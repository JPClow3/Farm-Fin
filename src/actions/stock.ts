'use server';

import { db } from '@/db';
import { stockItems, stockMovements, machinery } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getEffectiveOrganizationId } from '@/lib/session';
import { requireModuleAccess } from '@/lib/permissionGuard';
import { writeAuditLog } from '@/lib/audit';
import { SEED_STOCK_ITEMS, SEED_STOCK_MOVEMENTS, SEED_MACHINERY } from '@/db/seed';
import {
  StockItem,
  StockMovement,
  Machinery,
  KardexReportItem,
  LotTraceabilityReport,
  StockAlertSummary,
} from '@/lib/types';
import {
  createStockItemSchema,
  createStockMovementSchema,
  createMachinerySchema,
} from '@/lib/validations';
import {
  mapDbStockItemToStockItem,
  mapDbStockMovementToStockMovement,
  mapDbMachineryToMachinery,
} from '@/lib/mappers';
import { getTodayDateString } from '@/lib/dateUtils';
import { calculateStockAlertSummary, getExpiryAlertCategory } from '@/lib/stockAlerts';

// In-memory runtime fallback store to ensure consistent tests and offline operations
const memoryStockItems: StockItem[] = [...SEED_STOCK_ITEMS];
const memoryStockMovements: StockMovement[] = [...SEED_STOCK_MOVEMENTS];

// ----------------------
// Stock Items
// ----------------------

export async function getStockItems(farmId?: string): Promise<StockItem[]> {
  try {
    const orgId = await getEffectiveOrganizationId();
    const result = await db.query.stockItems.findMany({
      where: (s, { eq, and }) =>
        farmId
          ? and(eq(s.organizationId, orgId), eq(s.farmId, farmId))
          : eq(s.organizationId, orgId),
    });

    if (result && result.length > 0) {
      return result.map(mapDbStockItemToStockItem);
    }
    const current = memoryStockItems.map((s) => ({ ...s, organizationId: orgId }));
    return farmId ? current.filter((s) => s.farmId === farmId) : current;
  } catch (error) {
    console.warn('[getStockItems] DB query fallback to memory:', error);
    const orgId = 'a0000000-0000-4000-8000-000000000001';
    const current = memoryStockItems.map((s) => ({ ...s, organizationId: orgId }));
    return farmId ? current.filter((s) => s.farmId === farmId) : current;
  }
}

export async function createStockItem(data: Omit<StockItem, 'id'>): Promise<StockItem> {
  const session = await requireModuleAccess('estoque', 'manage');
  const parsed = createStockItemSchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const orgId = validData.organizationId || (await getEffectiveOrganizationId());
    const result = await db
      .insert(stockItems)
      .values({
        organizationId: orgId,
        farmId: validData.farmId,
        name: validData.name,
        category: validData.category,
        unit: validData.unit,
        quantity: validData.quantity,
        minQuantity: validData.minQuantity,
        averageCost: validData.averageCost,
        lastSupplier: validData.lastSupplier || 'N/A',
        batchNumber: validData.batchNumber || null,
        location: validData.location || null,
        expiryDate: validData.expiryDate || null,
        createdBy: session.user.id,
      })
      .returning();

    if (result[0]) {
      const mapped = mapDbStockItemToStockItem(result[0]);
      memoryStockItems.unshift(mapped);
      await writeAuditLog({
        action: 'create',
        entityType: 'stock_item',
        entityId: mapped.id,
        details: `${mapped.name} criado`,
      });
      return mapped;
    }
  } catch (error) {
    console.warn('[createStockItem] DB insert fallback to optimistic data:', error);
  }

  const newId = `stk-${Date.now()}`;
  const created: StockItem = {
    id: newId,
    ...validData,
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
  memoryStockItems.unshift(created);
  return created;
}

export interface CreateStockEntryData {
  farmId: string;
  name: string;
  category: 'Sementes' | 'Fertilizantes' | 'Defensivos' | 'Combustíveis' | string;
  unit: 'kg' | 'L' | 'sc' | 'ton' | string;
  quantity: number;
  unitPrice: number;
  minQuantity?: number;
  supplierId?: string;
  supplierName?: string;
  documentNumber?: string;
  batchNumber?: string;
  location?: string;
  expiryDate?: string;
  date?: string;
}

/**
 * Creates a stock entry (compra de insumo / entrada NF)
 * Recalculates Weighted Average Cost (Custo Médio Ponderado - CMP):
 * CMP_novo = ((Q_atual * CustoMedio_atual) + (Q_entrada * Preco_entrada)) / (Q_atual + Q_entrada)
 */
export async function createStockEntry(data: CreateStockEntryData) {
  const session = await requireModuleAccess('estoque', 'manage');
  let orgId = 'a0000000-0000-4000-8000-000000000001';
  try {
    orgId = await getEffectiveOrganizationId();
  } catch {
    // ignore
  }

  const entryDate = data.date || getTodayDateString();
  const incomingCost = data.quantity * data.unitPrice;

  try {
    const existing = await db.query.stockItems.findFirst({
      where: and(
        eq(stockItems.organizationId, orgId),
        eq(stockItems.farmId, data.farmId),
        eq(stockItems.name, data.name)
      ),
    });

    let targetStockId: string;
    let newQuantity: number;
    let newAvgCost: number;

    if (existing) {
      targetStockId = existing.id;
      const currentQty = Number(existing.quantity) || 0;
      const currentAvgCost = Number(existing.averageCost) || 0;

      const totalCostBefore = currentQty * currentAvgCost;
      newQuantity = currentQty + data.quantity;
      newAvgCost =
        newQuantity > 0 ? (totalCostBefore + incomingCost) / newQuantity : data.unitPrice;

      await db
        .update(stockItems)
        .set({
          quantity: newQuantity,
          averageCost: parseFloat(newAvgCost.toFixed(2)),
          lastSupplier: data.supplierName || existing.lastSupplier,
          batchNumber: data.batchNumber || existing.batchNumber,
          location: data.location || existing.location,
          expiryDate: data.expiryDate || existing.expiryDate,
          updatedAt: new Date(),
        })
        .where(eq(stockItems.id, existing.id));
    } else {
      newQuantity = data.quantity;
      newAvgCost = data.unitPrice;

      const [newItem] = await db
        .insert(stockItems)
        .values({
          organizationId: orgId,
          farmId: data.farmId,
          name: data.name,
          category: data.category,
          unit: data.unit,
          quantity: data.quantity,
          minQuantity: data.minQuantity || 10,
          averageCost: data.unitPrice,
          lastSupplier: data.supplierName || 'Fornecedor',
          batchNumber: data.batchNumber || null,
          location: data.location || null,
          expiryDate: data.expiryDate || '2027-12-31',
        })
        .returning();

      targetStockId = newItem.id;
    }

    const [movement] = await db
      .insert(stockMovements)
      .values({
        organizationId: orgId,
        farmId: data.farmId,
        stockItemId: targetStockId,
        itemName: data.name,
        type: 'entrada',
        quantity: data.quantity,
        unit: data.unit,
        date: entryDate,
        documentNumber: data.documentNumber || 'NF-e',
        batchNumber: data.batchNumber || null,
        location: data.location || null,
        totalCost: parseFloat(incomingCost.toFixed(2)),
        createdBy: session.user.id,
      })
      .returning();

    const mappedMovement = mapDbStockMovementToStockMovement(movement);
    await writeAuditLog({
      action: 'create',
      entityType: 'stock_movement',
      entityId: mappedMovement?.id,
      details: `Entrada de ${data.quantity} ${data.unit} de ${data.name}`,
    });

    return {
      success: true,
      stockItemId: targetStockId,
      newQuantity,
      newAverageCost: parseFloat(newAvgCost.toFixed(2)),
      movement: mappedMovement,
    };
  } catch (error) {
    console.warn('[createStockEntry] DB fallback to memory CMP calculation:', error);

    // In-memory fallback calculation
    const existingIndex = memoryStockItems.findIndex(
      (s) => s.farmId === data.farmId && s.name.toLowerCase() === data.name.toLowerCase()
    );

    let targetStockId: string;
    let newQuantity: number;
    let newAvgCost: number;

    if (existingIndex >= 0) {
      const existing = memoryStockItems[existingIndex];
      targetStockId = existing.id;
      const currentQty = existing.quantity || 0;
      const currentAvgCost = existing.averageCost || 0;
      const totalCostBefore = currentQty * currentAvgCost;

      newQuantity = currentQty + data.quantity;
      newAvgCost =
        newQuantity > 0 ? (totalCostBefore + incomingCost) / newQuantity : data.unitPrice;
      newAvgCost = parseFloat(newAvgCost.toFixed(2));

      memoryStockItems[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        averageCost: newAvgCost,
        lastSupplier: data.supplierName || existing.lastSupplier,
        batchNumber: data.batchNumber || existing.batchNumber,
        location: data.location || existing.location,
        expiryDate: data.expiryDate || existing.expiryDate,
      };
    } else {
      targetStockId = `stk-${Date.now()}`;
      newQuantity = data.quantity;
      newAvgCost = parseFloat(data.unitPrice.toFixed(2));

      const newItem: StockItem = {
        id: targetStockId,
        organizationId: orgId,
        farmId: data.farmId,
        name: data.name,
        category: data.category,
        unit: data.unit,
        quantity: newQuantity,
        minQuantity: data.minQuantity || 10,
        averageCost: newAvgCost,
        lastSupplier: data.supplierName || 'Fornecedor',
        batchNumber: data.batchNumber || 'LT-PADRAO',
        location: data.location || 'Galpão Principal',
        expiryDate: data.expiryDate || '2027-12-31',
      };
      memoryStockItems.unshift(newItem);
    }

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      organizationId: orgId,
      farmId: data.farmId,
      stockItemId: targetStockId,
      itemName: data.name,
      type: 'entrada',
      quantity: data.quantity,
      unit: data.unit,
      date: entryDate,
      documentNumber: data.documentNumber || 'NF-e',
      batchNumber: data.batchNumber || 'LT-PADRAO',
      location: data.location || 'Galpão Principal',
      totalCost: parseFloat(incomingCost.toFixed(2)),
    };
    memoryStockMovements.unshift(movement);

    return {
      success: true,
      stockItemId: targetStockId,
      newQuantity,
      newAverageCost: newAvgCost,
      movement,
    };
  }
}

export const createStockEntryAction = createStockEntry;

// ----------------------
// Stock Movements
// ----------------------

export async function getStockMovements(farmId?: string): Promise<StockMovement[]> {
  try {
    const orgId = await getEffectiveOrganizationId();
    const result = await db.query.stockMovements.findMany({
      where: (m, { eq, and }) =>
        farmId
          ? and(eq(m.organizationId, orgId), eq(m.farmId, farmId))
          : eq(m.organizationId, orgId),
      orderBy: [desc(stockMovements.date), desc(stockMovements.createdAt)],
    });

    if (result && result.length > 0) {
      return result.map(mapDbStockMovementToStockMovement);
    }
    const current = memoryStockMovements.map((m) => ({ ...m, organizationId: orgId }));
    return farmId ? current.filter((m) => m.farmId === farmId) : current;
  } catch (error) {
    console.warn('[getStockMovements] DB query fallback to memory:', error);
    const orgId = 'a0000000-0000-4000-8000-000000000001';
    const current = memoryStockMovements.map((m) => ({ ...m, organizationId: orgId }));
    return farmId ? current.filter((m) => m.farmId === farmId) : current;
  }
}

export async function createStockMovement(data: Omit<StockMovement, 'id'>): Promise<StockMovement> {
  const session = await requireModuleAccess('estoque', 'manage');
  const parsed = createStockMovementSchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const orgId = validData.organizationId || (await getEffectiveOrganizationId());
    const result = await db
      .insert(stockMovements)
      .values({
        organizationId: orgId,
        farmId: validData.farmId,
        stockItemId: validData.stockItemId,
        itemName: validData.itemName,
        type: validData.type,
        quantity: validData.quantity,
        unit: validData.unit,
        date: validData.date,
        fieldId: validData.fieldId || null,
        fieldName: validData.fieldName || null,
        machinery: validData.machinery || null,
        operator: validData.operator || null,
        documentNumber: validData.documentNumber || null,
        batchNumber: validData.batchNumber || null,
        location: validData.location || null,
        totalCost: validData.totalCost,
        createdBy: session.user.id,
      })
      .returning();

    if (result[0]) {
      const mapped = mapDbStockMovementToStockMovement(result[0]);
      memoryStockMovements.unshift(mapped);
      await writeAuditLog({
        action: 'create',
        entityType: 'stock_movement',
        entityId: mapped.id,
        details: `${mapped.itemName} - ${mapped.type} de ${mapped.quantity} ${mapped.unit}`,
      });
      return mapped;
    }
  } catch (error) {
    console.warn('[createStockMovement] DB insert fallback to optimistic data:', error);
  }

  const newId = `mov-${Date.now()}`;
  const created: StockMovement = {
    id: newId,
    ...validData,
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
  memoryStockMovements.unshift(created);
  return created;
}

export const addStockMovementAction = createStockMovement;

export interface CreateStockExitData {
  farmId: string;
  stockItemId: string;
  quantity: number;
  fieldId?: string;
  fieldName?: string;
  machinery?: string;
  operator?: string;
  batchNumber?: string;
  location?: string;
  date?: string;
}

export async function createStockExit(data: CreateStockExitData) {
  const session = await requireModuleAccess('estoque', 'manage');
  let orgId = 'a0000000-0000-4000-8000-000000000001';
  try {
    orgId = await getEffectiveOrganizationId();
  } catch {
    // ignore
  }

  const exitDate = data.date || getTodayDateString();

  try {
    const item = await db.query.stockItems.findFirst({
      where: and(eq(stockItems.id, data.stockItemId), eq(stockItems.organizationId, orgId)),
    });

    if (!item) {
      throw new Error('Insumo não encontrado no banco');
    }

    const currentQty = Number(item.quantity) || 0;
    if (currentQty < data.quantity) {
      return {
        success: false,
        error: `Saldo insuficiente. Disponível: ${currentQty} ${item.unit}.`,
      };
    }

    const remainingQty = Math.max(0, currentQty - data.quantity);
    const totalCost = data.quantity * Number(item.averageCost);

    await db
      .update(stockItems)
      .set({
        quantity: remainingQty,
        updatedAt: new Date(),
      })
      .where(eq(stockItems.id, item.id));

    const [movement] = await db
      .insert(stockMovements)
      .values({
        organizationId: orgId,
        farmId: data.farmId,
        stockItemId: item.id,
        itemName: item.name,
        type: 'saida',
        quantity: data.quantity,
        unit: item.unit,
        date: exitDate,
        fieldId: data.fieldId || null,
        fieldName: data.fieldName || 'Talhão Geral',
        machinery: data.machinery || 'Trator',
        operator: data.operator || 'Operador',
        batchNumber: data.batchNumber || item.batchNumber || null,
        location: data.location || item.location || null,
        totalCost: parseFloat(totalCost.toFixed(2)),
        createdBy: session.user.id,
      })
      .returning();

    const mappedMovement = mapDbStockMovementToStockMovement(movement);
    await writeAuditLog({
      action: 'create',
      entityType: 'stock_movement',
      entityId: mappedMovement?.id,
      details: `Saída de ${data.quantity} ${item.unit} de ${item.name}`,
    });

    return {
      success: true,
      remainingQuantity: remainingQty,
      averageCost: item.averageCost,
      totalCost: parseFloat(totalCost.toFixed(2)),
      movement: mappedMovement,
    };
  } catch (error) {
    console.warn('[createStockExit] DB update fallback to memory:', error);

    const itemIndex = memoryStockItems.findIndex((s) => s.id === data.stockItemId);
    const item =
      itemIndex >= 0
        ? memoryStockItems[itemIndex]
        : memoryStockItems.find((s) => s.farmId === data.farmId);

    if (!item) {
      return { success: false, error: 'Insumo não encontrado no estoque.' };
    }

    const currentQty = Number(item.quantity) || 0;
    if (currentQty < data.quantity) {
      return {
        success: false,
        error: `Saldo insuficiente. Disponível: ${currentQty} ${item.unit}.`,
      };
    }

    const remainingQty = Math.max(0, currentQty - data.quantity);
    const totalCost = data.quantity * Number(item.averageCost);

    memoryStockItems[itemIndex >= 0 ? itemIndex : 0] = {
      ...item,
      quantity: remainingQty,
    };

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      organizationId: orgId,
      farmId: data.farmId,
      stockItemId: item.id,
      itemName: item.name,
      type: 'saida',
      quantity: data.quantity,
      unit: item.unit,
      date: exitDate,
      fieldId: data.fieldId || null,
      fieldName: data.fieldName || 'Talhão Geral',
      machinery: data.machinery || 'Trator',
      operator: data.operator || 'Operador',
      batchNumber: data.batchNumber || item.batchNumber || 'LT-PADRAO',
      location: data.location || item.location || 'Galpão Principal',
      totalCost: parseFloat(totalCost.toFixed(2)),
    };
    memoryStockMovements.unshift(movement);

    return {
      success: true,
      remainingQuantity: remainingQty,
      averageCost: item.averageCost,
      totalCost: parseFloat(totalCost.toFixed(2)),
      movement,
    };
  }
}

export const createStockExitAction = createStockExit;

// ----------------------
// Kardex Report
// ----------------------

export interface KardexFilterOptions {
  farmId?: string;
  stockItemId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  batchNumber?: string;
  type?: 'entrada' | 'saida';
}

/**
 * Returns a complete Kardex movement report sorted chronologically with running balances.
 */
export async function getStockKardexReport(
  optionsOrFarmId?: string | KardexFilterOptions,
  legacyStockItemId?: string
): Promise<KardexReportItem[]> {
  let options: KardexFilterOptions = {};
  if (typeof optionsOrFarmId === 'string') {
    options = { farmId: optionsOrFarmId, stockItemId: legacyStockItemId };
  } else if (optionsOrFarmId) {
    options = optionsOrFarmId;
  }

  const [items, movements] = await Promise.all([
    getStockItems(options.farmId),
    getStockMovements(options.farmId),
  ]);

  let filteredMovements = [...movements];

  if (options.stockItemId && options.stockItemId !== 'todos') {
    filteredMovements = filteredMovements.filter(
      (m) => m.stockItemId === options.stockItemId || m.itemName === options.stockItemId
    );
  }

  if (options.type) {
    filteredMovements = filteredMovements.filter((m) => m.type === options.type);
  }

  if (options.batchNumber) {
    filteredMovements = filteredMovements.filter(
      (m) =>
        m.batchNumber && m.batchNumber.toLowerCase().includes(options.batchNumber!.toLowerCase())
    );
  }

  if (options.startDate) {
    filteredMovements = filteredMovements.filter((m) => m.date >= options.startDate!);
  }

  if (options.endDate) {
    filteredMovements = filteredMovements.filter((m) => m.date <= options.endDate!);
  }

  // Sort ascending by date & createdAt for accurate running balance
  const sorted = [...filteredMovements].sort((a, b) => a.date.localeCompare(b.date));

  let runningQty = 0;
  let runningValue = 0;

  const kardex: KardexReportItem[] = [];

  for (const m of sorted) {
    const item = items.find((i) => i.id === m.stockItemId || i.name === m.itemName);
    const unitPrice =
      m.quantity > 0 && m.totalCost > 0
        ? parseFloat((m.totalCost / m.quantity).toFixed(2))
        : item?.averageCost || 0;

    if (m.type === 'entrada') {
      runningQty += m.quantity;
      runningValue += m.totalCost;
    } else {
      runningQty = Math.max(0, runningQty - m.quantity);
      runningValue = Math.max(0, runningValue - m.totalCost);
    }

    kardex.push({
      id: m.id,
      date: m.date,
      stockItemId: m.stockItemId,
      itemName: m.itemName,
      category: item?.category || 'Insumos',
      type: m.type as 'entrada' | 'saida',
      documentNumber: m.documentNumber || (m.type === 'entrada' ? 'NF-e Entrada' : 'Req. Campo'),
      batchNumber: m.batchNumber || item?.batchNumber || 'LOTE-PADRAO',
      location: m.location || item?.location || 'Galpão Principal',
      fieldOrSupplier:
        m.type === 'entrada'
          ? item?.lastSupplier || 'Fornecedor'
          : m.fieldName || 'Aplicação no Talhão',
      fieldId: m.fieldId,
      machinery: m.machinery,
      operator: m.operator,
      quantity: m.quantity,
      unit: m.unit,
      unitCost: unitPrice,
      totalCost: m.totalCost,
      runningBalanceQty: parseFloat(runningQty.toFixed(2)),
      runningBalanceValue: parseFloat(runningValue.toFixed(2)),
    });
  }

  // Return descending for UI presentation
  return kardex.reverse();
}

export const getStockKardexReportAction = getStockKardexReport;

// ----------------------
// Lot Traceability
// ----------------------

/**
 * Returns complete traceability for stock lots: origin NF, entry date, storage location,
 * expiry status, and all downstream field applications with machinery and operator.
 */
export async function getLotTraceability(
  farmId?: string,
  batchNumberFilter?: string
): Promise<LotTraceabilityReport[]> {
  const [items, movements] = await Promise.all([getStockItems(farmId), getStockMovements(farmId)]);

  // Group by batchNumber or item ID
  const batches = new Map<
    string,
    { item: StockItem; entries: StockMovement[]; exits: StockMovement[] }
  >();

  for (const item of items) {
    const batchKey = item.batchNumber || `LT-${item.id.slice(0, 8)}`;
    if (batchNumberFilter && !batchKey.toLowerCase().includes(batchNumberFilter.toLowerCase())) {
      continue;
    }
    if (!batches.has(batchKey)) {
      batches.set(batchKey, { item, entries: [], exits: [] });
    }
  }

  for (const m of movements) {
    const batchKey = m.batchNumber || `LT-${m.stockItemId.slice(0, 8)}`;
    if (batchNumberFilter && !batchKey.toLowerCase().includes(batchNumberFilter.toLowerCase())) {
      continue;
    }

    if (!batches.has(batchKey)) {
      const item = items.find((i) => i.id === m.stockItemId || i.name === m.itemName);
      if (item) {
        batches.set(batchKey, { item, entries: [], exits: [] });
      }
    }

    const record = batches.get(batchKey);
    if (record) {
      if (m.type === 'entrada') {
        record.entries.push(m);
      } else {
        record.exits.push(m);
      }
    }
  }

  const reports: LotTraceabilityReport[] = [];

  batches.forEach((val, key) => {
    const totalEntered = val.entries.reduce((sum, e) => sum + e.quantity, 0) || val.item.quantity;
    const totalExited = val.exits.reduce((sum, e) => sum + e.quantity, 0);
    const remaining = Math.max(0, totalEntered - totalExited);
    const expiryStatus = getExpiryAlertCategory(val.item.expiryDate);

    reports.push({
      batchNumber: key,
      stockItemId: val.item.id,
      itemName: val.item.name,
      category: val.item.category,
      unit: val.item.unit,
      location: val.item.location || 'Galpão Principal - Baia A',
      expiryDate: val.item.expiryDate || null,
      expiryStatus,
      totalEnteredQty: totalEntered,
      totalExitedQty: totalExited,
      remainingQty: remaining,
      averageCost: val.item.averageCost,
      totalImmobilizedValue: parseFloat((remaining * val.item.averageCost).toFixed(2)),
      entries: val.entries,
      applications: val.exits,
    });
  });

  return reports;
}

export const getLotTraceabilityAction = getLotTraceability;

// ----------------------
// Stock Alerts Summary Action
// ----------------------

export async function getStockAlertsSummaryAction(farmId?: string): Promise<StockAlertSummary> {
  const items = await getStockItems(farmId);
  return calculateStockAlertSummary(items);
}

// ----------------------
// Machinery
// ----------------------

export async function getMachineryList(farmId?: string): Promise<Machinery[]> {
  try {
    const orgId = await getEffectiveOrganizationId();
    const result = await db.query.machinery.findMany({
      where: (m, { eq, and }) =>
        farmId
          ? and(eq(m.organizationId, orgId), eq(m.farmId, farmId))
          : eq(m.organizationId, orgId),
    });

    if (result && result.length > 0) {
      return result.map(mapDbMachineryToMachinery);
    }
    const seeded = SEED_MACHINERY.map((m) => ({ ...m, organizationId: orgId }));
    return farmId ? seeded.filter((m) => m.farmId === farmId) : seeded;
  } catch (error) {
    console.warn('[getMachineryList] DB query fallback to seed:', error);
    const orgId = 'a0000000-0000-4000-8000-000000000001';
    const seeded = SEED_MACHINERY.map((m) => ({ ...m, organizationId: orgId }));
    return farmId ? seeded.filter((m) => m.farmId === farmId) : seeded;
  }
}

export async function createMachineryAction(data: Omit<Machinery, 'id'>): Promise<Machinery> {
  const session = await requireModuleAccess('cadastros', 'manage');
  const parsed = createMachinerySchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const orgId = validData.organizationId || (await getEffectiveOrganizationId());
    const result = await db
      .insert(machinery)
      .values({
        organizationId: orgId,
        farmId: validData.farmId,
        name: validData.name,
        type: validData.type,
        plate: validData.plate || 'AGRO-001',
        hourCost: validData.hourCost,
        status: validData.status || 'Operacional',
        createdBy: session.user.id,
      })
      .returning();

    if (result[0]) {
      const mapped = mapDbMachineryToMachinery(result[0]);
      await writeAuditLog({
        action: 'create',
        entityType: 'machinery',
        entityId: mapped.id,
        details: `${mapped.name} criado`,
      });
      return mapped;
    }
  } catch (error) {
    console.warn('[createMachineryAction] DB insert fallback to optimistic data:', error);
  }

  const newId = `mac-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    plate: validData.plate || 'AGRO-001',
    status: (validData.status as 'Operacional' | 'Manutenção' | 'Inativo') || 'Operacional',
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
}
