import { describe, it, expect } from 'vitest';
import { getAgingBucketKey, calculateAgingSummary } from '../agingUtils';
import { Payable } from '../types';

describe('agingUtils', () => {
  const baseDate = '2026-08-15';

  describe('getAgingBucketKey', () => {
    it('returns a_vencer for future or today dates', () => {
      expect(getAgingBucketKey('2026-08-15', baseDate)).toBe('a_vencer');
      expect(getAgingBucketKey('2026-08-20', baseDate)).toBe('a_vencer');
      expect(getAgingBucketKey('2026-09-15', baseDate)).toBe('a_vencer');
    });

    it('returns 1_30 for 1 to 30 days overdue', () => {
      expect(getAgingBucketKey('2026-08-14', baseDate)).toBe('1_30'); // 1 day overdue
      expect(getAgingBucketKey('2026-07-20', baseDate)).toBe('1_30'); // 26 days overdue
      expect(getAgingBucketKey('2026-07-16', baseDate)).toBe('1_30'); // 30 days overdue
    });

    it('returns 31_60 for 31 to 60 days overdue', () => {
      expect(getAgingBucketKey('2026-07-15', baseDate)).toBe('31_60'); // 31 days overdue
      expect(getAgingBucketKey('2026-06-20', baseDate)).toBe('31_60'); // 56 days overdue
      expect(getAgingBucketKey('2026-06-16', baseDate)).toBe('31_60'); // 60 days overdue
    });

    it('returns 61_90 for 61 to 90 days overdue', () => {
      expect(getAgingBucketKey('2026-06-15', baseDate)).toBe('61_90'); // 61 days overdue
      expect(getAgingBucketKey('2026-05-20', baseDate)).toBe('61_90'); // 87 days overdue
      expect(getAgingBucketKey('2026-05-17', baseDate)).toBe('61_90'); // 90 days overdue
    });

    it('returns 90_plus for > 90 days overdue', () => {
      expect(getAgingBucketKey('2026-05-16', baseDate)).toBe('90_plus'); // 91 days overdue
      expect(getAgingBucketKey('2025-08-15', baseDate)).toBe('90_plus'); // 365 days overdue
    });
  });

  describe('calculateAgingSummary', () => {
    const mockPayables: Partial<Payable>[] = [
      {
        id: '1',
        description: 'Conta Futura',
        amount: 1000,
        dueDate: '2026-08-20',
        status: 'pendente',
      },
      {
        id: '2',
        description: 'Conta Atraso Leve',
        amount: 2000,
        dueDate: '2026-08-01',
        status: 'pendente',
      }, // 14d -> 1_30
      {
        id: '3',
        description: 'Conta Atraso Médio',
        amount: 3000,
        dueDate: '2026-07-01',
        status: 'pendente',
      }, // 45d -> 31_60
      {
        id: '4',
        description: 'Conta Atraso Alto',
        amount: 4000,
        dueDate: '2026-06-01',
        status: 'pendente',
      }, // 75d -> 61_90
      {
        id: '5',
        description: 'Conta Muito Atrasada',
        amount: 5000,
        dueDate: '2026-04-01',
        status: 'vencido',
      }, // >90d -> 90_plus
      {
        id: '6',
        description: 'Conta Paga Ignorada',
        amount: 9999,
        dueDate: '2026-04-01',
        status: 'pago',
      },
    ];

    it('correctly aggregates open obligations across aging buckets', () => {
      const summary = calculateAgingSummary(mockPayables as Payable[], { baseDate });

      expect(summary.totalOpenAmount).toBe(15000);
      expect(summary.totalCount).toBe(5);

      expect(summary.buckets.a_vencer.totalAmount).toBe(1000);
      expect(summary.buckets.a_vencer.count).toBe(1);
      expect(summary.buckets.a_vencer.percentage).toBe(6.7);

      expect(summary.buckets['1_30'].totalAmount).toBe(2000);
      expect(summary.buckets['1_30'].count).toBe(1);
      expect(summary.buckets['1_30'].percentage).toBe(13.3);

      expect(summary.buckets['31_60'].totalAmount).toBe(3000);
      expect(summary.buckets['31_60'].count).toBe(1);

      expect(summary.buckets['61_90'].totalAmount).toBe(4000);
      expect(summary.buckets['61_90'].count).toBe(1);

      expect(summary.buckets['90_plus'].totalAmount).toBe(5000);
      expect(summary.buckets['90_plus'].count).toBe(1);
      expect(summary.buckets['90_plus'].percentage).toBe(33.3);
    });
  });
});
