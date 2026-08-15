import { describe, it, expect } from 'vitest';
import { getDueDateAlertCategory, calculateDueDateAlertSummary } from '../financeAlerts';
import { Payable } from '../types';

describe('financeAlerts', () => {
  const baseDate = '2026-08-15';

  describe('getDueDateAlertCategory', () => {
    it('returns null for already paid or cancelled payables', () => {
      expect(getDueDateAlertCategory('2026-08-01', 'pago', baseDate)).toBeNull();
      expect(getDueDateAlertCategory('2026-08-15', 'pago', baseDate)).toBeNull();
      expect(getDueDateAlertCategory('2026-08-01', 'cancelado', baseDate)).toBeNull();
    });

    it('returns vencido for dates prior to baseDate', () => {
      expect(getDueDateAlertCategory('2026-08-14', 'pendente', baseDate)).toBe('vencido');
      expect(getDueDateAlertCategory('2026-08-01', 'pendente', baseDate)).toBe('vencido');
      expect(getDueDateAlertCategory('2026-08-14', 'vencido', baseDate)).toBe('vencido');
    });

    it('returns hoje for dates matching baseDate', () => {
      expect(getDueDateAlertCategory('2026-08-15', 'pendente', baseDate)).toBe('hoje');
    });

    it('returns ate_3_dias for dates 1 to 3 days ahead', () => {
      expect(getDueDateAlertCategory('2026-08-16', 'pendente', baseDate)).toBe('ate_3_dias'); // +1d
      expect(getDueDateAlertCategory('2026-08-17', 'pendente', baseDate)).toBe('ate_3_dias'); // +2d
      expect(getDueDateAlertCategory('2026-08-18', 'pendente', baseDate)).toBe('ate_3_dias'); // +3d
    });

    it('returns ate_7_dias for dates 4 to 7 days ahead', () => {
      expect(getDueDateAlertCategory('2026-08-19', 'pendente', baseDate)).toBe('ate_7_dias'); // +4d
      expect(getDueDateAlertCategory('2026-08-22', 'pendente', baseDate)).toBe('ate_7_dias'); // +7d
    });

    it('returns null for dates > 7 days ahead', () => {
      expect(getDueDateAlertCategory('2026-08-23', 'pendente', baseDate)).toBeNull(); // +8d
      expect(getDueDateAlertCategory('2026-09-15', 'pendente', baseDate)).toBeNull();
    });
  });

  describe('calculateDueDateAlertSummary', () => {
    const mockPayables: Partial<Payable>[] = [
      {
        id: '1',
        description: 'Conta Vencida',
        amount: 1200,
        dueDate: '2026-08-10',
        status: 'pendente',
      },
      {
        id: '2',
        description: 'Conta Hoje',
        amount: 800,
        dueDate: '2026-08-15',
        status: 'pendente',
      },
      {
        id: '3',
        description: 'Conta 2 Dias',
        amount: 1500,
        dueDate: '2026-08-17',
        status: 'pendente',
      },
      {
        id: '4',
        description: 'Conta 5 Dias',
        amount: 2500,
        dueDate: '2026-08-20',
        status: 'pendente',
      },
      {
        id: '5',
        description: 'Conta Longe',
        amount: 10000,
        dueDate: '2026-09-30',
        status: 'pendente',
      },
    ];

    it('correctly aggregates alert tiers and amounts', () => {
      const summary = calculateDueDateAlertSummary(mockPayables as Payable[], [], baseDate);

      expect(summary.totalAlerts).toBe(4);
      expect(summary.totalAmountInAlert).toBe(6000); // 1200 + 800 + 1500 + 2500

      expect(summary.overdueCount).toBe(1);
      expect(summary.overdueAmount).toBe(1200);

      expect(summary.dueTodayCount).toBe(1);
      expect(summary.dueTodayAmount).toBe(800);

      expect(summary.dueIn3DaysCount).toBe(1);
      expect(summary.dueIn3DaysAmount).toBe(1500);

      expect(summary.dueIn7DaysCount).toBe(1);
      expect(summary.dueIn7DaysAmount).toBe(2500);
    });
  });
});
