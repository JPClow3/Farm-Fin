import { describe, it, expect } from 'vitest';
import { calculateDRE } from '../dre';

describe('DRE Server Action', () => {
  it('calculates DRE with valid seasonId and produces revenues, costs, margin, and net income', async () => {
    const result = await calculateDRE('s0000000-0000-4000-8000-000000000001');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('grossRevenue');
      expect(result.data).toHaveProperty('directCosts');
      expect(result.data).toHaveProperty('grossMargin');
      expect(result.data).toHaveProperty('netProfit');
      expect(result.data.grossMargin).toBe(result.data.netRevenue - result.data.directCosts.total);
    }
  });
});
