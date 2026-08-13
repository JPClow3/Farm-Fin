'use server';

import { db } from '@/db';
import { stockItems, stockMovements, machinery } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getEffectiveOrganizationId } from '@/lib/session';
import { SEED_STOCK_ITEMS, SEED_STOCK_MOVEMENTS, SEED_MACHINERY } from '@/db/seed';
import { StockItem, StockMovement, Machinery } from '@/lib/types';
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
    const seeded = SEED_STOCK_ITEMS.map((s) => ({ ...s, organizationId: orgId }));
    return farmId ? seeded.filter((s) => s.farmId === farmId) : seeded;
  } catch (error) {
    console.warn('[getStockItems] DB query fallback to seed:', error);
    const orgId = 'a0000000-0000-4000-8000-000000000001';
    const seeded = SEED_STOCK_ITEMS.map((s) => ({ ...s, organizationId: orgId }));
    return farmId ? seeded.filter((s) => s.farmId === farmId) : seeded;
  }
}

export async function createStockItem(data: Omit<StockItem, 'id'>): Promise<StockItem> {
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
        expiryDate: validData.expiryDate || null,
      })
      .returning();

    if (result[0]) {
      return mapDbStockItemToStockItem(result[0]);
    }
  } catch (error) {
    console.warn('[createStockItem] DB insert fallback to optimistic data:', error);
  }

  const newId = `stk-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
}

export interface CreateStockEntryData {
  farmId: string;
  name: string;
  category: 'Sementes' | 'Fertilizantes' | 'Defensivos' | 'Combustíveis';
  unit: 'kg' | 'L' | 'sc' | 'ton';
  quantity: number;
  unitPrice: number;
  minQuantity?: number;
  supplierId?: string;
  supplierName?: string;
  documentNumber?: string;
  expiryDate?: string;
  date?: string;
}

/**
 * Creates a stock entry (compra de insumo / entrada NF)
 * Recalculates Weighted Average Cost (Custo Médio Ponderado - CMP):
 * CMP_novo = ((Q_atual * CustoMedio_atual) + (Q_entrada * Preco_entrada)) / (Q_atual + Q_entrada)
 */
export async function createStockEntry(data: CreateStockEntryData) {
  const orgId = await getEffectiveOrganizationId();
  const entryDate = data.date || getTodayDateString();

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
      const incomingCost = data.quantity * data.unitPrice;
      newQuantity = currentQty + data.quantity;
      newAvgCost =
        newQuantity > 0 ? (totalCostBefore + incomingCost) / newQuantity : data.unitPrice;

      await db
        .update(stockItems)
        .set({
          quantity: newQuantity,
          averageCost: parseFloat(newAvgCost.toFixed(2)),
          lastSupplier: data.supplierName || existing.lastSupplier,
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
          expiryDate: data.expiryDate || '2027-12-31',
        })
        .returning();

      targetStockId = newItem.id;
    }

    const movementCost = data.quantity * data.unitPrice;
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
        totalCost: parseFloat(movementCost.toFixed(2)),
      })
      .returning();

    return {
      success: true,
      stockItemId: targetStockId,
      newQuantity,
      newAverageCost: newAvgCost,
      movement,
    };
  } catch (error) {
    console.error('Error registering stock entry (CMP):', error);
    return { success: false, error: String(error) };
  }
}

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
    const seeded = SEED_STOCK_MOVEMENTS.map((m) => ({ ...m, organizationId: orgId }));
    return farmId ? seeded.filter((m) => m.farmId === farmId) : seeded;
  } catch (error) {
    console.warn('[getStockMovements] DB query fallback to seed:', error);
    const orgId = 'a0000000-0000-4000-8000-000000000001';
    const seeded = SEED_STOCK_MOVEMENTS.map((m) => ({ ...m, organizationId: orgId }));
    return farmId ? seeded.filter((m) => m.farmId === farmId) : seeded;
  }
}

export async function createStockMovement(data: Omit<StockMovement, 'id'>): Promise<StockMovement> {
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
        totalCost: validData.totalCost,
      })
      .returning();

    if (result[0]) {
      return mapDbStockMovementToStockMovement(result[0]);
    }
  } catch (error) {
    console.warn('[createStockMovement] DB insert fallback to optimistic data:', error);
  }

  const newId = `mov-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
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
  date?: string;
}

export async function createStockExit(data: CreateStockExitData) {
  const orgId = await getEffectiveOrganizationId();
  const exitDate = data.date || getTodayDateString();

  try {
    const item = await db.query.stockItems.findFirst({
      where: and(eq(stockItems.id, data.stockItemId), eq(stockItems.organizationId, orgId)),
    });

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
        totalCost: parseFloat(totalCost.toFixed(2)),
      })
      .returning();

    return {
      success: true,
      remainingQuantity: remainingQty,
      averageCost: item.averageCost,
      totalCost,
      movement,
    };
  } catch (error) {
    console.error('Error registering stock exit:', error);
    return { success: false, error: String(error) };
  }
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
      })
      .returning();

    if (result[0]) {
      return mapDbMachineryToMachinery(result[0]);
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
