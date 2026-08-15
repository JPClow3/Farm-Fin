'use server';

import { db } from '../db';
import { payables, fields, stockMovements } from '../db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { getEffectiveOrganizationId } from '@/lib/session';
import { getFields } from './farm';
import {
  CostApportionmentMethod,
  OverheadExpenseItem,
  FieldApportionmentAllocation,
  ApportionmentCalculationResult,
  Field,
} from '@/lib/types';
import { SEED_PAYABLES, SEED_FIELDS } from '@/db/seed';
// Note: DEFAULT_OVERHEAD_EXPENSES lives in @/lib/overheadDefaults, not here -
// a 'use server' file may only export async functions, so this constant array
// can't live (or be re-exported) from this file.
import { DEFAULT_OVERHEAD_EXPENSES } from '@/lib/overheadDefaults';

const OVERHEAD_KEYWORDS = [
  'arrenda',
  'seguro',
  'admin',
  'sede',
  'escritorio',
  'energia',
  'luz',
  'contab',
  'honorario',
  'taxa',
  'imposto',
  'itr',
  'seguranc',
  'ti',
  'software',
  'telecom',
  'predial',
  'geral',
];

/**
 * Retrieve unallocated payables and overhead expenses eligible for rateio
 */
export async function getOverheadExpensesForApportionment(
  farmId: string,
  seasonId?: string
): Promise<OverheadExpenseItem[]> {
  try {
    const orgId = await getEffectiveOrganizationId();

    const dbPayables = await db.query.payables.findMany({
      where: (p, { eq, and }) =>
        and(
          eq(p.organizationId, orgId),
          eq(p.farmId, farmId),
          seasonId ? eq(p.cropSeasonId, seasonId) : undefined
        ),
    });

    // Filter payables that are unassigned to a specific field OR are general overhead categories
    const overheadPayables = dbPayables.filter((p) => {
      if (!p.fieldId) return true;
      const cat = (p.category || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return OVERHEAD_KEYWORDS.some((kw) => cat.includes(kw) || desc.includes(kw));
    });

    if (overheadPayables.length > 0) {
      return overheadPayables.map((p) => ({
        id: p.id,
        description: p.description,
        category: p.category || 'Despesas Gerais / Rateio',
        amount: Number(p.amount) || 0,
        source: 'payable',
        supplierName: p.supplierName || undefined,
        dueDate: p.dueDate,
        included: true,
      }));
    }
  } catch (error) {
    console.warn(
      '[getOverheadExpensesForApportionment] DB query error, using seed/default:',
      error
    );
  }

  // Fallback to SEED_PAYABLES or default items
  const seededOverhead = SEED_PAYABLES.filter((p) => {
    if (farmId && p.farmId !== farmId) return false;
    if (!p.fieldId) return true;
    const cat = (p.category || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    return OVERHEAD_KEYWORDS.some((kw) => cat.includes(kw) || desc.includes(kw));
  });

  if (seededOverhead.length > 0) {
    return seededOverhead.map((p) => ({
      id: p.id,
      description: p.description,
      category: p.category || 'Despesas Gerais / Rateio',
      amount: p.amount,
      source: 'payable',
      supplierName: p.supplierName,
      dueDate: p.dueDate,
      included: true,
    }));
  }

  return DEFAULT_OVERHEAD_EXPENSES;
}

export interface CalculateApportionmentParams {
  farmId: string;
  seasonId?: string;
  method?: CostApportionmentMethod;
  customItems?: OverheadExpenseItem[];
  customPercentages?: Record<string, number>;
  customOverheadAmount?: number;
  estimatedProductivityByCrop?: Record<string, number>; // sc/ha
}

/**
 * Calculates fixed cost apportionment (Rateio) across all fields of a farm
 */
export async function calculateCostApportionment(
  params: CalculateApportionmentParams
): Promise<ApportionmentCalculationResult> {
  const {
    farmId,
    seasonId = 's0000000-0000-4000-8000-000000000001',
    method = 'planted_area',
    customItems,
    customPercentages = {},
    customOverheadAmount,
    estimatedProductivityByCrop = { Soja: 62, Milho: 110, Algodão: 280 },
  } = params;

  // 1. Get Fields
  const fieldsList = await getFields(farmId);
  const activeFields = fieldsList.filter((f) => f.farmId === farmId);
  const targetFields: Field[] =
    activeFields.length > 0
      ? activeFields
      : SEED_FIELDS.filter((f) => !farmId || f.farmId === farmId);

  // 2. Get Overhead Items & Total Amount
  const overheadItems =
    customItems || (await getOverheadExpensesForApportionment(farmId, seasonId));
  const activeOverheadItems = overheadItems.filter((i) => i.included !== false);
  const totalOverheadAmount =
    customOverheadAmount !== undefined
      ? customOverheadAmount
      : activeOverheadItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // 3. Compute Direct Costs per Field (Inputs + Machinery + Labor base)
  const fieldsWithDirectCosts = targetFields.map((f) => {
    // Direct cost estimation: inputs (seeds, fertilizer, agrochem) + machinery + labor
    const inputsCost = f.area * 540;
    const machineryCost = f.area * 280;
    const laborCost = f.area * 95;
    const directCost = inputsCost + machineryCost + laborCost;
    return {
      field: f,
      directCost,
    };
  });

  const totalFarmArea = targetFields.reduce((sum, f) => sum + (f.area || 0), 0) || 1;
  const totalDirectCosts = fieldsWithDirectCosts.reduce((sum, f) => sum + f.directCost, 0) || 1;
  const totalFieldCount = targetFields.length || 1;

  // Total estimated production bags
  const totalEstimatedBags =
    targetFields.reduce((sum, f) => {
      const prod = estimatedProductivityByCrop[f.currentCrop] || 60;
      return sum + f.area * prod;
    }, 0) || 1;

  // 4. Calculate Allocation for each Field based on chosen method
  const allocations: FieldApportionmentAllocation[] = fieldsWithDirectCosts.map((item) => {
    const { field, directCost } = item;
    const area = field.area || 0;
    let basisValue = 0;
    let allocationPct = 0;

    switch (method) {
      case 'planted_area':
        basisValue = area;
        allocationPct = totalFarmArea > 0 ? (area / totalFarmArea) * 100 : 0;
        break;

      case 'equal_split':
        basisValue = 1;
        allocationPct = totalFieldCount > 0 ? (1 / totalFieldCount) * 100 : 0;
        break;

      case 'direct_cost':
        basisValue = directCost;
        allocationPct = totalDirectCosts > 0 ? (directCost / totalDirectCosts) * 100 : 0;
        break;

      case 'production_volume': {
        const cropProd = estimatedProductivityByCrop[field.currentCrop] || 60;
        const fieldBags = area * cropProd;
        basisValue = fieldBags;
        allocationPct = totalEstimatedBags > 0 ? (fieldBags / totalEstimatedBags) * 100 : 0;
        break;
      }

      case 'custom_percentage': {
        const rawPct = customPercentages[field.id] ?? 100 / totalFieldCount;
        basisValue = rawPct;
        allocationPct = rawPct;
        break;
      }

      default:
        basisValue = area;
        allocationPct = totalFarmArea > 0 ? (area / totalFarmArea) * 100 : 0;
    }

    const allocatedOverhead = (totalOverheadAmount * allocationPct) / 100;
    const directCostPerHa = area > 0 ? directCost / area : 0;
    const allocatedOverheadPerHa = area > 0 ? allocatedOverhead / area : 0;
    const finalTotalCost = directCost + allocatedOverhead;
    const finalTotalCostPerHa = area > 0 ? finalTotalCost / area : 0;

    return {
      fieldId: field.id,
      fieldName: field.name,
      area,
      crop: field.currentCrop || 'Soja',
      directCost,
      allocationBasisValue: parseFloat(basisValue.toFixed(2)),
      allocationPercentage: parseFloat(allocationPct.toFixed(2)),
      allocatedOverhead: parseFloat(allocatedOverhead.toFixed(2)),
      directCostPerHa: parseFloat(directCostPerHa.toFixed(2)),
      allocatedOverheadPerHa: parseFloat(allocatedOverheadPerHa.toFixed(2)),
      finalTotalCost: parseFloat(finalTotalCost.toFixed(2)),
      finalTotalCostPerHa: parseFloat(finalTotalCostPerHa.toFixed(2)),
    };
  });

  // Summary Metrics
  const totalDirectCostSum = allocations.reduce((sum, a) => sum + a.directCost, 0);
  const totalFinalCostSum = allocations.reduce((sum, a) => sum + a.finalTotalCost, 0);
  const avgDirectCostPerHa = totalFarmArea > 0 ? totalDirectCostSum / totalFarmArea : 0;
  const avgOverheadCostPerHa = totalFarmArea > 0 ? totalOverheadAmount / totalFarmArea : 0;
  const avgFinalCostPerHa = totalFarmArea > 0 ? totalFinalCostSum / totalFarmArea : 0;

  return {
    farmId,
    seasonId,
    method,
    totalOverheadAmount: parseFloat(totalOverheadAmount.toFixed(2)),
    overheadItems,
    allocations,
    summary: {
      totalArea: parseFloat(totalFarmArea.toFixed(2)),
      totalDirectCost: parseFloat(totalDirectCostSum.toFixed(2)),
      totalFinalCost: parseFloat(totalFinalCostSum.toFixed(2)),
      avgDirectCostPerHa: parseFloat(avgDirectCostPerHa.toFixed(2)),
      avgOverheadCostPerHa: parseFloat(avgOverheadCostPerHa.toFixed(2)),
      avgFinalCostPerHa: parseFloat(avgFinalCostPerHa.toFixed(2)),
    },
  };
}
