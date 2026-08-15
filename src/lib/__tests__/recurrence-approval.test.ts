import { describe, it, expect } from 'vitest';
import { getNextRecurrenceDate, addDaysToDate, calculateDateDifferenceDays } from '../dateUtils';
import {
  recurrencePatternSchema,
  approvalStatusSchema,
  createPayableSchema,
  createReceivableSchema,
} from '../validations/finance.schema';

describe('Recurrence Date Utilities', () => {
  const baseDate = '2026-01-15';

  it('calculates biweekly recurrence correctly (+14 days per step)', () => {
    expect(getNextRecurrenceDate(baseDate, 'biweekly', 0)).toBe('2026-01-15');
    expect(getNextRecurrenceDate(baseDate, 'biweekly', 1)).toBe('2026-01-29');
    expect(getNextRecurrenceDate(baseDate, 'biweekly', 2)).toBe('2026-02-12');
  });

  it('calculates monthly recurrence correctly (+1 month per step)', () => {
    expect(getNextRecurrenceDate(baseDate, 'monthly', 0)).toBe('2026-01-15');
    expect(getNextRecurrenceDate(baseDate, 'monthly', 1)).toBe('2026-02-15');
    expect(getNextRecurrenceDate(baseDate, 'monthly', 2)).toBe('2026-03-15');
  });

  it('calculates quarterly recurrence correctly (+3 months per step)', () => {
    expect(getNextRecurrenceDate(baseDate, 'quarterly', 1)).toBe('2026-04-15');
    expect(getNextRecurrenceDate(baseDate, 'quarterly', 2)).toBe('2026-07-15');
  });

  it('calculates semiannual recurrence correctly (+6 months per step)', () => {
    expect(getNextRecurrenceDate(baseDate, 'semiannual', 1)).toBe('2026-07-15');
    expect(getNextRecurrenceDate(baseDate, 'semiannual', 2)).toBe('2027-01-15');
  });

  it('calculates yearly recurrence correctly (+1 year per step)', () => {
    expect(getNextRecurrenceDate(baseDate, 'yearly', 1)).toBe('2027-01-15');
    expect(getNextRecurrenceDate(baseDate, 'yearly', 2)).toBe('2028-01-15');
  });
});

describe('Validation Schemas for Recurrence & Approval', () => {
  it('validates recurrencePatternSchema', () => {
    expect(recurrencePatternSchema.safeParse('monthly').success).toBe(true);
    expect(recurrencePatternSchema.safeParse('biweekly').success).toBe(true);
    expect(recurrencePatternSchema.safeParse('none').success).toBe(true);
    expect(recurrencePatternSchema.safeParse('invalid').success).toBe(false);
  });

  it('validates approvalStatusSchema', () => {
    expect(approvalStatusSchema.safeParse('pendente').success).toBe(true);
    expect(approvalStatusSchema.safeParse('aprovado').success).toBe(true);
    expect(approvalStatusSchema.safeParse('rejeitado').success).toBe(true);
    expect(approvalStatusSchema.safeParse('outro').success).toBe(false);
  });

  it('validates createPayableSchema with recurrence and approval flags', () => {
    const validPayable = {
      farmId: 'f1',
      cropSeasonId: 's1',
      supplierId: 'sup1',
      supplierName: 'Fertilizantes Brasil',
      category: 'Insumos',
      description: 'Compra de Adubo Mensal',
      amount: 15000,
      dueDate: '2026-09-01',
      recurrencePattern: 'monthly',
      requiresApproval: true,
      approvalStatus: 'pendente',
    };

    const res = createPayableSchema.safeParse(validPayable);
    expect(res.success).toBe(true);
  });

  it('validates createReceivableSchema with recurrence pattern', () => {
    const validReceivable = {
      farmId: 'f1',
      cropSeasonId: 's1',
      customerId: 'c1',
      customerName: 'Cargill Agrícola',
      crop: 'Soja',
      description: 'Contrato de Soja Futuro',
      totalAmount: 150000,
      dueDate: '2026-05-30',
      contractType: 'Contrato Futuro',
      recurrencePattern: 'quarterly',
    };

    const res = createReceivableSchema.safeParse(validReceivable);
    expect(res.success).toBe(true);
  });
});
