import { describe, it, expect } from 'vitest';
import {
  getStockItems,
  createStockItem,
  getStockMovements,
  createStockMovement,
  getMachineryList,
  createMachineryAction,
} from '../stock';

describe('Stock Server Actions', () => {
  it('retrieves stock items and creates a new stock item with validation', async () => {
    const items = await getStockItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty('name');
    expect(items[0]).toHaveProperty('quantity');
    expect(items[0]).toHaveProperty('averageCost');

    const created = await createStockItem({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      name: 'Adubo Especial Nitrogênio',
      category: 'Fertilizantes',
      unit: 'ton',
      quantity: 50,
      minQuantity: 10,
      averageCost: 3200,
      lastSupplier: 'Yara Brasil',
    });

    expect(created).toBeDefined();
    expect(created.name).toBe('Adubo Especial Nitrogênio');
    expect(created.quantity).toBe(50);
  });

  it('retrieves stock movements and creates new movement', async () => {
    const movements = await getStockMovements();
    expect(movements.length).toBeGreaterThan(0);

    const newMov = await createStockMovement({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      stockItemId: 'stk-00000000-0001',
      itemName: 'NPK 04-14-08',
      type: 'saida',
      quantity: 10,
      unit: 'ton',
      date: '2026-08-15',
      fieldName: 'Talhão 01',
      totalCost: 32000,
    });

    expect(newMov).toBeDefined();
    expect(newMov.type).toBe('saida');
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
