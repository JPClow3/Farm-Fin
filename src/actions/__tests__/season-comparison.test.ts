import { describe, it, expect } from 'vitest';
import { getCrossSeasonComparison } from '../season-comparison';

describe('Cross-Season Comparison Engine (Comparativo Histórico de Safras)', () => {
  it('retrieves multi-season performance metrics with complete financial structure', async () => {
    const result = await getCrossSeasonComparison();

    expect(result).toBeDefined();
    expect(Array.isArray(result.seasons)).toBe(true);
    expect(result.seasons.length).toBeGreaterThanOrEqual(3);

    // Verify properties of seasons
    const currentSeason = result.seasons.find((s) => s.isCurrent);
    expect(currentSeason).toBeDefined();
    expect(currentSeason?.seasonName).toContain('Safra 2025/2026');
    expect(currentSeason?.grossRevenue).toBeGreaterThan(0);
    expect(currentSeason?.totalCost).toBeGreaterThan(0);
    expect(currentSeason?.costPerHa).toBeGreaterThan(0);
    expect(currentSeason?.productivityScHa).toBeGreaterThan(0);
    expect(currentSeason?.breakevenYieldScHa).toBeGreaterThan(0);
  });

  it('calculates accurate economic margins, cost per bag, and breakeven yield', async () => {
    const result = await getCrossSeasonComparison();

    result.seasons.forEach((season) => {
      // costPerHa = totalCost / plantedArea
      const expectedCostPerHa = season.totalCost / season.plantedArea;
      expect(season.costPerHa).toBeCloseTo(expectedCostPerHa, 1);

      // costPerBag = totalCost / totalProductionBags
      const expectedCostPerBag = season.totalCost / season.totalProductionBags;
      expect(season.costPerBag).toBeCloseTo(expectedCostPerBag, 1);

      // breakevenYieldScHa = costPerHa / averagePricePerBag
      const expectedBreakeven = season.costPerHa / season.averagePricePerBag;
      expect(season.breakevenYieldScHa).toBeCloseTo(expectedBreakeven, 1);

      // Net profit = Gross Revenue - Total Cost (approximate before tax/ebitda adjust)
      expect(season.grossMarginPct).toBeGreaterThan(0);
      expect(season.ebitdaPct).toBeGreaterThan(0);
      expect(season.netProfitPct).toBeGreaterThan(0);
    });
  });

  it('computes Year-over-Year (YoY) variations between successive crop seasons', async () => {
    const result = await getCrossSeasonComparison();

    expect(Array.isArray(result.variations)).toBe(true);
    expect(result.variations.length).toBe(result.seasons.length - 1);

    result.variations.forEach((variation) => {
      expect(variation).toHaveProperty('seasonA');
      expect(variation).toHaveProperty('seasonB');
      expect(typeof variation.revenueVarPct).toBe('number');
      expect(typeof variation.costVarPct).toBe('number');
      expect(typeof variation.productivityVarPct).toBe('number');
      expect(typeof variation.netProfitVarPct).toBe('number');
    });
  });

  it('generates cost per hectare evolution across categories over time', async () => {
    const result = await getCrossSeasonComparison();

    expect(Array.isArray(result.categoryCostEvolution)).toBe(true);
    expect(result.categoryCostEvolution.length).toBeGreaterThan(0);

    const fertCat = result.categoryCostEvolution.find((c) => c.category === 'Fertilizantes');
    expect(fertCat).toBeDefined();
    expect(fertCat?.valuesBySeason).toBeDefined();
    expect(Object.keys(fertCat?.valuesBySeason || {}).length).toBe(result.seasons.length);
  });

  it('filters historical seasons by crop type when specified', async () => {
    const sojaResult = await getCrossSeasonComparison(undefined, 'Soja');
    expect(sojaResult.seasons.length).toBeGreaterThan(0);
    sojaResult.seasons.forEach((s) => {
      expect(s.crop).toContain('Soja');
    });
  });
});
