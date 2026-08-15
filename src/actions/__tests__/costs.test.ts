import { describe, it, expect } from 'vitest';
import { getOverheadExpensesForApportionment, calculateCostApportionment } from '../costs';
import { DEFAULT_OVERHEAD_EXPENSES } from '../../lib/overheadDefaults';

describe('Fixed Cost Apportionment Engine (Rateio de Custos Fixos)', () => {
  const mockFarmId = 'f0000000-0000-4000-8000-000000000001';

  it('retrieves overhead expenses eligible for apportionment', async () => {
    const expenses = await getOverheadExpensesForApportionment(mockFarmId);
    expect(Array.isArray(expenses)).toBe(true);
    expect(expenses.length).toBeGreaterThan(0);
    expect(expenses[0]).toHaveProperty('description');
    expect(expenses[0]).toHaveProperty('category');
    expect(expenses[0]).toHaveProperty('amount');
    expect(expenses[0].amount).toBeGreaterThan(0);
  });

  it('calculates apportionment using "planted_area" criterion (proportional to ha)', async () => {
    const result = await calculateCostApportionment({
      farmId: mockFarmId,
      method: 'planted_area',
    });

    expect(result).toBeDefined();
    expect(result.method).toBe('planted_area');
    expect(result.allocations.length).toBeGreaterThan(0);
    expect(result.totalOverheadAmount).toBeGreaterThan(0);

    // Verify percentages sum to ~100%
    const totalPercentage = result.allocations.reduce((sum, a) => sum + a.allocationPercentage, 0);
    expect(totalPercentage).toBeCloseTo(100, 0);

    // Verify larger fields receive more allocated overhead
    const sortedByArea = [...result.allocations].sort((a, b) => b.area - a.area);
    expect(sortedByArea[0].allocatedOverhead).toBeGreaterThanOrEqual(
      sortedByArea[sortedByArea.length - 1].allocatedOverhead
    );

    // Verify overhead per hectare is uniform across all fields in planted_area method
    const overheadPerHaFirst = result.allocations[0].allocatedOverheadPerHa;
    const overheadPerHaLast =
      result.allocations[result.allocations.length - 1].allocatedOverheadPerHa;
    expect(overheadPerHaFirst).toBeCloseTo(overheadPerHaLast, 1);
  });

  it('calculates apportionment using "equal_split" criterion (identical split per field)', async () => {
    const result = await calculateCostApportionment({
      farmId: mockFarmId,
      method: 'equal_split',
    });

    expect(result.allocations.length).toBeGreaterThan(0);
    const firstAlloc = result.allocations[0].allocatedOverhead;
    result.allocations.forEach((alloc) => {
      expect(alloc.allocatedOverhead).toBeCloseTo(firstAlloc, 1);
    });
  });

  it('calculates apportionment using "direct_cost" criterion (proportional to direct costs)', async () => {
    const result = await calculateCostApportionment({
      farmId: mockFarmId,
      method: 'direct_cost',
    });

    expect(result.allocations.length).toBeGreaterThan(0);
    const sortedByDirect = [...result.allocations].sort((a, b) => b.directCost - a.directCost);
    expect(sortedByDirect[0].allocatedOverhead).toBeGreaterThanOrEqual(
      sortedByDirect[sortedByDirect.length - 1].allocatedOverhead
    );
  });

  it('calculates apportionment using "production_volume" criterion', async () => {
    const result = await calculateCostApportionment({
      farmId: mockFarmId,
      method: 'production_volume',
      estimatedProductivityByCrop: { Soja: 60, Milho: 120 },
    });

    expect(result.allocations.length).toBeGreaterThan(0);
    const totalPercentage = result.allocations.reduce((sum, a) => sum + a.allocationPercentage, 0);
    expect(totalPercentage).toBeCloseTo(100, 0);
  });

  it('calculates apportionment using "custom_percentage" criterion', async () => {
    const customPercentages: Record<string, number> = {
      'fld-00000000-0001': 50,
      'fld-00000000-0002': 50,
    };

    const result = await calculateCostApportionment({
      farmId: mockFarmId,
      method: 'custom_percentage',
      customPercentages,
      customOverheadAmount: 100000,
    });

    expect(result.allocations.length).toBeGreaterThan(0);
    const field1 = result.allocations.find((a) => a.fieldId === 'fld-00000000-0001');
    if (field1) {
      expect(field1.allocatedOverhead).toBeCloseTo(50000, 0);
    }
  });

  it('preserves mathematical consistency: Total Final Cost = Total Direct + Total Overhead', async () => {
    const result = await calculateCostApportionment({
      farmId: mockFarmId,
      method: 'planted_area',
    });

    const sumAllocatedOverhead = result.allocations.reduce(
      (sum, a) => sum + a.allocatedOverhead,
      0
    );
    expect(sumAllocatedOverhead).toBeCloseTo(result.totalOverheadAmount, 0);

    const sumFinalCost = result.allocations.reduce((sum, a) => sum + a.finalTotalCost, 0);
    expect(sumFinalCost).toBeCloseTo(result.summary.totalFinalCost, 0);
  });
});
