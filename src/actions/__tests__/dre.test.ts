import { describe, it, expect } from 'vitest';
import { calculateDRE } from '../dre';
import { exportDREToExcel } from '@/lib/exportDREExcel';

describe('DRE Server Action & Calculations', () => {
  it('calculates DRE with valid seasonId and produces revenues, costs, margin, and net income', async () => {
    const result = await calculateDRE('s0000000-0000-4000-8000-000000000001');
    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data).toHaveProperty('grossRevenue');
      expect(result.data).toHaveProperty('directCosts');
      expect(result.data).toHaveProperty('grossMargin');
      expect(result.data).toHaveProperty('netProfit');
      expect(result.data.grossMargin).toBe(result.data.netRevenue - result.data.directCosts.total);
      expect(result.data.ebitda).toBe(result.data.grossMargin - result.data.operatingExpenses.total);
      expect(result.data.netProfit).toBe(
        result.data.ebitda - result.data.financialExpenses - result.data.depreciation
      );
    }
  });

  it('calculates DRE by field (talhão) with transparent agronomic revenue allocation', async () => {
    const result = await calculateDRE({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      seasonId: 's0000000-0000-4000-8000-000000000001',
    });

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.fieldsDRE).toBeDefined();
      expect(Array.isArray(result.data.fieldsDRE)).toBe(true);
      expect(result.data.fieldsDRE!.length).toBeGreaterThan(0);

      const field0 = result.data.fieldsDRE![0];
      expect(field0).toHaveProperty('fieldName');
      expect(field0).toHaveProperty('area');
      expect(field0).toHaveProperty('grossRevenue');
      expect(field0).toHaveProperty('directCosts');
      expect(field0).toHaveProperty('grossMargin');
      expect(field0).toHaveProperty('revenuePerHa');
      expect(field0).toHaveProperty('directCostsPerHa');
      expect(field0).toHaveProperty('grossMarginPerHa');
      expect(field0).toHaveProperty('ebitdaPerHa');
      expect(field0).toHaveProperty('netProfitPerHa');
      expect(field0).toHaveProperty('breakEvenScHa');

      // Verify per hectare math
      expect(field0.revenuePerHa).toBeCloseTo(field0.grossRevenue / field0.area, 1);
      expect(field0.directCostsPerHa).toBeCloseTo(field0.directCosts.total / field0.area, 1);
      expect(field0.grossMarginPerHa).toBeCloseTo(field0.grossMargin / field0.area, 1);
      expect(field0.ebitdaPerHa).toBeCloseTo(field0.ebitda / field0.area, 1);
      expect(field0.netProfitPerHa).toBeCloseTo(field0.netProfit / field0.area, 1);

      // Verify revenue allocation method description
      expect(result.data.revenueAllocationMethod).toContain('Rateio Proporcional por Área');
    }
  });

  it('calculates DRE for a single filtered field (talhão drilldown)', async () => {
    const fullResult = await calculateDRE({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      seasonId: 's0000000-0000-4000-8000-000000000001',
    });
    expect(fullResult.success).toBe(true);
    if (fullResult.success && fullResult.data) {
      const targetField = fullResult.data.fieldsDRE![0];

      const singleFieldResult = await calculateDRE({
        farmId: 'f0000000-0000-4000-8000-000000000001',
        seasonId: 's0000000-0000-4000-8000-000000000001',
        fieldId: targetField.fieldId,
      });

      expect(singleFieldResult.success).toBe(true);
      if (singleFieldResult.success && singleFieldResult.data) {
        expect(singleFieldResult.data.grossRevenue).toBeCloseTo(targetField.grossRevenue, 1);
        expect(singleFieldResult.data.directCosts.total).toBeCloseTo(targetField.directCosts.total, 1);
        expect(singleFieldResult.data.grossMargin).toBeCloseTo(targetField.grossMargin, 1);
        expect(singleFieldResult.data.netProfit).toBeCloseTo(targetField.netProfit, 1);
      }
    }
  });

  it('calculates DRE by period (annual and monthly)', async () => {
    // Annual DRE
    const annualResult = await calculateDRE({
      periodType: 'annual',
      year: 2026,
    });
    expect(annualResult.success).toBe(true);
    if (annualResult.success && annualResult.data) {
      expect(annualResult.data.periodType).toBe('annual');
      expect(annualResult.data.year).toBe(2026);
    }

    // Monthly DRE
    const monthlyResult = await calculateDRE({
      periodType: 'monthly',
      year: 2026,
      month: 2,
    });
    expect(monthlyResult.success).toBe(true);
    if (monthlyResult.success && monthlyResult.data) {
      expect(monthlyResult.data.periodType).toBe('monthly');
      expect(monthlyResult.data.month).toBe(2);
      expect(monthlyResult.data.grossRevenue).toBeGreaterThan(0);
      expect(monthlyResult.data.directCosts.total).toBeGreaterThan(0);
    }
  });

  it('produces a complete 12-month evolutionary matrix', async () => {
    const result = await calculateDRE({
      periodType: 'season',
      year: 2026,
    });

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.monthlyBreakdown).toBeDefined();
      expect(result.data.monthlyBreakdown!.length).toBe(12);

      const febPoint = result.data.monthlyBreakdown!.find((m: { monthIndex: number }) => m.monthIndex === 2);
      expect(febPoint).toBeDefined();
      expect(febPoint!.grossRevenue).toBeGreaterThan(0);
      expect(febPoint!.directCosts).toBeGreaterThan(0);
      expect(febPoint!.grossMargin).toBe(febPoint!.netRevenue - febPoint!.directCosts);
      expect(febPoint!.ebitda).toBe(febPoint!.grossMargin - febPoint!.operatingExpenses);
    }
  });
});
