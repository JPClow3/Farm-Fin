import { describe, it, expect } from 'vitest';
import { getLCDPREntries, generateLCDPR } from '../lcdpr';

describe('LCDPR Server Actions', () => {
  it('retrieves LCDPR entries with financial calculations', async () => {
    const res = await getLCDPREntries('f0000000-0000-4000-8000-000000000001', 2026);
    expect(res.success).toBe(true);
    expect(res.entries.length).toBeGreaterThan(0);
    expect(res.totalReceitas).toBeGreaterThan(0);
    expect(res.totalDespesas).toBeGreaterThan(0);
    expect(res.saldoFiscal).toBe(res.totalReceitas - res.totalDespesas);
  });

  it('generates formatted LCDPR .txt content', async () => {
    const res = await generateLCDPR(2026, 'f0000000-0000-4000-8000-000000000001');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.content).toContain('0000|LCDPR|0013');
      expect(res.data.content).toContain('9999|');
      expect(res.data.filename).toContain('LCDPR_2026_');
    }
  });
});
