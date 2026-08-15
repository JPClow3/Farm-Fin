import { describe, it, expect } from 'vitest';
import {
  getStockItems,
  createStockItem,
  createStockEntry,
  createStockExit,
  getStockMovements,
  createStockMovement,
  getStockKardexReport,
  getLotTraceability,
  getMachineryList,
  createMachineryAction,
} from '../stock';

describe('Stock & Inventory Management Server Actions', () => {
  it('retrieves stock items and creates a new stock item with validation', async () => {
    const items = await getStockItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty('name');
    expect(items[0]).toHaveProperty('quantity');
    expect(items[0]).toHaveProperty('averageCost');

    const created = await createStockItem({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      name: 'Adubo Especial Nitrogênio Test',
      category: 'Fertilizantes',
      unit: 'ton',
      quantity: 50,
      minQuantity: 10,
      averageCost: 3200,
      lastSupplier: 'Yara Brasil',
      batchNumber: 'LT-TEST-001',
      location: 'Galpão 01',
      expiryDate: '2027-12-31',
    });

    expect(created).toBeDefined();
    expect(created.name).toBe('Adubo Especial Nitrogênio Test');
    expect(created.quantity).toBe(50);
    expect(created.batchNumber).toBe('LT-TEST-001');
  });

  it('accurately calculates Weighted Average Cost (CMP) across successive entries', async () => {
    const farmId = 'f0000000-0000-4000-8000-000000000001';
    const uniqueItemName = `Superfosfato Simples ${Date.now()}`;

    // Entry 1: 10 ton @ R$ 2.000,00 = R$ 20.000,00 (CMP = 2000.00)
    const entry1 = await createStockEntry({
      farmId,
      name: uniqueItemName,
      category: 'Fertilizantes',
      unit: 'ton',
      quantity: 10,
      unitPrice: 2000,
      supplierName: 'Fosfértil',
      batchNumber: 'LT-FOS-1',
    });

    expect(entry1.success).toBe(true);
    expect(entry1.newQuantity).toBe(10);
    expect(entry1.newAverageCost).toBe(2000);

    // Entry 2: +10 ton @ R$ 4.000,00 = R$ 40.000,00
    // Total Qty = 20 ton. Total Value = 20k + 40k = 60k. Expected CMP = 60.000 / 20 = 3000.00
    const entry2 = await createStockEntry({
      farmId,
      name: uniqueItemName,
      category: 'Fertilizantes',
      unit: 'ton',
      quantity: 10,
      unitPrice: 4000,
      supplierName: 'Fosfértil',
      batchNumber: 'LT-FOS-2',
    });

    expect(entry2.success).toBe(true);
    expect(entry2.newQuantity).toBe(20);
    expect(entry2.newAverageCost).toBe(3000);

    // Entry 3: +30 ton @ R$ 3.000,00 = R$ 90.000,00
    // Total Qty = 50 ton. Total Value = 60k + 90k = 150k. Expected CMP = 150.000 / 50 = 3000.00
    const entry3 = await createStockEntry({
      farmId,
      name: uniqueItemName,
      category: 'Fertilizantes',
      unit: 'ton',
      quantity: 30,
      unitPrice: 3000,
      supplierName: 'Fosfértil',
      batchNumber: 'LT-FOS-3',
    });

    expect(entry3.success).toBe(true);
    expect(entry3.newQuantity).toBe(50);
    expect(entry3.newAverageCost).toBe(3000);
  });

  it('handles stock exit (baixa no campo) with CMP valuation and guards against overdraft', async () => {
    const farmId = 'f0000000-0000-4000-8000-000000000001';
    const itemName = `Herbicida Test ${Date.now()}`;

    // Create initial stock of 100 L @ R$ 50/L
    const entry = await createStockEntry({
      farmId,
      name: itemName,
      category: 'Defensivos',
      unit: 'L',
      quantity: 100,
      unitPrice: 50,
      batchNumber: 'LT-HERB-01',
    });

    expect(entry.success).toBe(true);
    const stockId = entry.stockItemId!;

    // Exit 30 L: Total cost should be 30 * 50 = R$ 1500. Remaining = 70 L
    const exit1 = await createStockExit({
      farmId,
      stockItemId: stockId,
      quantity: 30,
      fieldName: 'Talhão 02 - Sul',
      machinery: 'Pulverizador Uniport',
      operator: 'Carlos Agrônomo',
    });

    expect(exit1.success).toBe(true);
    expect(exit1.remainingQuantity).toBe(70);
    expect(exit1.totalCost).toBe(1500);

    // Attempting to exit 100 L when only 70 L is available should fail
    const exitOverdraft = await createStockExit({
      farmId,
      stockItemId: stockId,
      quantity: 100,
      fieldName: 'Talhão 02 - Sul',
    });

    expect(exitOverdraft.success).toBe(false);
    expect(exitOverdraft.error).toContain('Saldo insuficiente');
  });

  it('generates chronological Kardex report with physical and financial running balances', async () => {
    const kardex = await getStockKardexReport();
    expect(kardex).toBeDefined();
    expect(Array.isArray(kardex)).toBe(true);
    expect(kardex.length).toBeGreaterThan(0);

    const first = kardex[0];
    expect(first).toHaveProperty('date');
    expect(first).toHaveProperty('itemName');
    expect(first).toHaveProperty('type');
    expect(first).toHaveProperty('quantity');
    expect(first).toHaveProperty('unitCost');
    expect(first).toHaveProperty('runningBalanceQty');
    expect(first).toHaveProperty('runningBalanceValue');
  });

  it('returns lot traceability report detailing entries and field applications', async () => {
    const lots = await getLotTraceability('f0000000-0000-4000-8000-000000000001');
    expect(lots.length).toBeGreaterThan(0);

    const lot = lots[0];
    expect(lot).toHaveProperty('batchNumber');
    expect(lot).toHaveProperty('itemName');
    expect(lot).toHaveProperty('expiryStatus');
    expect(lot).toHaveProperty('totalEnteredQty');
    expect(lot).toHaveProperty('remainingQty');
    expect(lot).toHaveProperty('entries');
    expect(lot).toHaveProperty('applications');
  });

  it('retrieves machinery and creates machinery', async () => {
    const machinery = await getMachineryList();
    expect(machinery.length).toBeGreaterThan(0);

    const created = await createMachineryAction({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      name: 'Trator Valtra S394',
      type: 'Trator Pesado',
      plate: 'AGRO-VT05',
      hourCost: 350,
      status: 'Operacional',
    });

    expect(created).toBeDefined();
    expect(created.name).toBe('Trator Valtra S394');
  });
});
