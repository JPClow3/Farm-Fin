import { describe, it, expect } from 'vitest';
import {
  getStockAlertCategory,
  getExpiryAlertCategory,
  calculateSuggestedReorder,
  calculateStockAlertSummary,
} from '../stockAlerts';
import { StockItem } from '../types';

describe('Stock Alerts & Thresholds Utility', () => {
  it('correctly classifies stock balance tiers', () => {
    // Zero / stockout
    expect(getStockAlertCategory(0, 50)).toBe('zerado');
    expect(getStockAlertCategory(-5, 50)).toBe('zerado');

    // Critical (<= 50% of min)
    expect(getStockAlertCategory(20, 50)).toBe('critico');
    expect(getStockAlertCategory(25, 50)).toBe('critico');

    // Minimum (<= 100% of min)
    expect(getStockAlertCategory(30, 50)).toBe('minimo');
    expect(getStockAlertCategory(50, 50)).toBe('minimo');

    // Attention buffer (<= 120% of min)
    expect(getStockAlertCategory(55, 50)).toBe('atencao');
    expect(getStockAlertCategory(60, 50)).toBe('atencao');

    // Normal safe level
    expect(getStockAlertCategory(70, 50)).toBe('normal');
    expect(getStockAlertCategory(150, 50)).toBe('normal');
  });

  it('correctly classifies expiration date alerts', () => {
    const baseDate = '2026-08-15';

    // Already expired
    expect(getExpiryAlertCategory('2026-08-10', baseDate)).toBe('vencido');
    expect(getExpiryAlertCategory('2026-08-14', baseDate)).toBe('vencido');

    // Expiring in <= 30 days
    expect(getExpiryAlertCategory('2026-08-15', baseDate)).toBe('vencendo_30d');
    expect(getExpiryAlertCategory('2026-09-01', baseDate)).toBe('vencendo_30d');
    expect(getExpiryAlertCategory('2026-09-14', baseDate)).toBe('vencendo_30d');

    // Expiring in <= 60 days
    expect(getExpiryAlertCategory('2026-10-01', baseDate)).toBe('vencendo_60d');

    // Expiring in <= 90 days
    expect(getExpiryAlertCategory('2026-11-10', baseDate)).toBe('vencendo_90d');

    // Valid (> 90 days or none)
    expect(getExpiryAlertCategory('2027-01-01', baseDate)).toBe('valido');
    expect(getExpiryAlertCategory(undefined, baseDate)).toBe('valido');
  });

  it('calculates suggested reorder quantities and costs', () => {
    const item: StockItem = {
      id: 'stk-1',
      farmId: 'farm-1',
      name: 'Adubo NPK',
      category: 'Fertilizantes',
      unit: 'ton',
      quantity: 10,
      minQuantity: 40,
      averageCost: 3000,
      lastSupplier: 'Yara',
    };

    const reorder = calculateSuggestedReorder(item);
    // Target is minQuantity * 2 = 80. Current is 10. Suggested = 70.
    expect(reorder.suggestedQty).toBe(70);
    expect(reorder.estimatedCost).toBe(210000);
  });

  it('compiles a consolidated stock alert summary with priority sorting', () => {
    const items: StockItem[] = [
      {
        id: 'stk-1',
        farmId: 'farm-1',
        name: 'Diesel S10',
        category: 'Combustíveis',
        unit: 'L',
        quantity: 0, // Zerado
        minQuantity: 2000,
        averageCost: 6,
        lastSupplier: 'Ipiranga',
      },
      {
        id: 'stk-2',
        farmId: 'farm-1',
        name: 'Fungicida Bayer',
        category: 'Defensivos',
        unit: 'L',
        quantity: 30, // Critico (min 100)
        minQuantity: 100,
        averageCost: 200,
        lastSupplier: 'Bayer',
        expiryDate: '2026-08-10', // Vencido
      },
      {
        id: 'stk-3',
        farmId: 'farm-1',
        name: 'Semente Soja',
        category: 'Sementes',
        unit: 'sc',
        quantity: 500, // Normal
        minQuantity: 100,
        averageCost: 150,
        lastSupplier: 'Syngenta',
        expiryDate: '2027-12-31',
      },
    ];

    const summary = calculateStockAlertSummary(items, '2026-08-15');

    expect(summary.totalItems).toBe(3);
    expect(summary.outOfStockCount).toBe(1);
    expect(summary.criticalStockCount).toBe(1);
    expect(summary.expiredLotsCount).toBe(1);
    expect(summary.alerts.length).toBe(2);

    // Zerado should be priority #1
    expect(summary.alerts[0].name).toBe('Diesel S10');
    expect(summary.totalReplenishmentCost).toBeGreaterThan(0);
  });
});
