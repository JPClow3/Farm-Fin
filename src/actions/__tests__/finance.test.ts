import { describe, it, expect } from 'vitest';
import {
  getPayables,
  createPayable,
  payPayableAction,
  getReceivables,
  createReceivable,
  receiveReceivableAction,
  getCashFlowReport,
} from '../finance';

describe('Finance Server Actions', () => {
  it('retrieves payables with proper schema shape', async () => {
    const payables = await getPayables();
    expect(Array.isArray(payables)).toBe(true);
    expect(payables.length).toBeGreaterThan(0);
    expect(payables[0]).toHaveProperty('id');
    expect(payables[0]).toHaveProperty('amount');
    expect(payables[0]).toHaveProperty('status');
  });

  it('creates payable with validation and fallback safety', async () => {
    const created = await createPayable({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      cropSeasonId: 's0000000-0000-4000-8000-000000000001',
      supplierId: 'sup-0001',
      supplierName: 'Yara Brasil',
      category: 'Insumos > Fertilizantes',
      description: 'Adubo Safra Nova',
      amount: 50000,
      dueDate: '2026-09-30',
      status: 'pendente',
      installments: '1/1',
      hasAttachment: false,
    });

    expect(created).toBeDefined();
    expect(created.amount).toBe(50000);
    expect(created.description).toBe('Adubo Safra Nova');
  });

  it('rejects invalid payPayableAction payload safely', async () => {
    const result = await payPayableAction('', '', -10, 'invalid-date');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('retrieves receivables and processes cash flow report', async () => {
    const [receivables, cashFlow] = await Promise.all([getReceivables(), getCashFlowReport()]);

    expect(receivables.length).toBeGreaterThan(0);
    expect(cashFlow.success).toBe(true);
    if (cashFlow.success) {
      expect(cashFlow.data.length).toBeGreaterThan(0);
      expect(cashFlow.data[0]).toHaveProperty('period');
      expect(cashFlow.data[0]).toHaveProperty('inflows');
      expect(cashFlow.data[0]).toHaveProperty('outflows');
    }
  });
});
