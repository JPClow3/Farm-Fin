import {
  Payable,
  Receivable,
  DueDateAlertItem,
  DueDateAlertSummary,
  DueDateAlertCategory,
} from './types';
import { calculateDateDifferenceDays, getTodayDateString } from './dateUtils';

/**
 * Categorizes an obligation or receivable due date into an alert tier:
 * - 'vencido': daysDiff < 0
 * - 'hoje': daysDiff === 0
 * - 'ate_3_dias': daysDiff >= 1 && daysDiff <= 3
 * - 'ate_7_dias': daysDiff >= 4 && daysDiff <= 7
 * - null: more than 7 days ahead or already paid
 */
export function getDueDateAlertCategory(
  dueDate: string,
  status: string,
  baseDate?: string
): DueDateAlertCategory | null {
  if (status === 'pago' || status === 'cancelado') return null;

  const diffDays = calculateDateDifferenceDays(dueDate, baseDate || getTodayDateString());

  if (diffDays < 0) return 'vencido';
  if (diffDays === 0) return 'hoje';
  if (diffDays >= 1 && diffDays <= 3) return 'ate_3_dias';
  if (diffDays >= 4 && diffDays <= 7) return 'ate_7_dias';

  return null;
}

/**
 * Builds a consolidated Due Date Alerts summary for payables and/or receivables.
 */
export function calculateDueDateAlertSummary(
  payables: Payable[],
  receivables: Receivable[] = [],
  baseDate?: string
): DueDateAlertSummary {
  const base = baseDate || getTodayDateString();
  const alerts: DueDateAlertItem[] = [];

  let overdueCount = 0;
  let overdueAmount = 0;
  let dueTodayCount = 0;
  let dueTodayAmount = 0;
  let dueIn3DaysCount = 0;
  let dueIn3DaysAmount = 0;
  let dueIn7DaysCount = 0;
  let dueIn7DaysAmount = 0;
  let totalAmountInAlert = 0;

  // Process Payables
  for (const p of payables) {
    if (p.status === 'pago' || p.status === 'cancelado') continue;
    const cat = getDueDateAlertCategory(p.dueDate, p.status, base);
    if (!cat) continue;

    const diffDays = calculateDateDifferenceDays(p.dueDate, base);
    const amount = Number(p.amount) || 0;

    if (cat === 'vencido') {
      overdueCount++;
      overdueAmount += amount;
    } else if (cat === 'hoje') {
      dueTodayCount++;
      dueTodayAmount += amount;
    } else if (cat === 'ate_3_dias') {
      dueIn3DaysCount++;
      dueIn3DaysAmount += amount;
    } else if (cat === 'ate_7_dias') {
      dueIn7DaysCount++;
      dueIn7DaysAmount += amount;
    }

    totalAmountInAlert += amount;

    alerts.push({
      id: p.id,
      type: 'payable',
      description: p.description,
      partyName: p.supplierName,
      amount,
      dueDate: p.dueDate,
      category: cat,
      daysDiff: diffDays,
      status: p.status,
    });
  }

  // Process Receivables
  for (const r of receivables) {
    if (r.status === 'pago' || r.status === 'cancelado') continue;
    const cat = getDueDateAlertCategory(r.dueDate, r.status, base);
    if (!cat) continue;

    const diffDays = calculateDateDifferenceDays(r.dueDate, base);
    const amount = Number(r.totalAmount) || 0;

    if (cat === 'vencido') {
      overdueCount++;
      overdueAmount += amount;
    } else if (cat === 'hoje') {
      dueTodayCount++;
      dueTodayAmount += amount;
    } else if (cat === 'ate_3_dias') {
      dueIn3DaysCount++;
      dueIn3DaysAmount += amount;
    } else if (cat === 'ate_7_dias') {
      dueIn7DaysCount++;
      dueIn7DaysAmount += amount;
    }

    totalAmountInAlert += amount;

    alerts.push({
      id: r.id,
      type: 'receivable',
      description: r.description,
      partyName: r.customerName,
      amount,
      dueDate: r.dueDate,
      category: cat,
      daysDiff: diffDays,
      status: r.status,
    });
  }

  // Sort alerts: 'vencido' first (most overdue first), then 'hoje', then closest future
  alerts.sort((a, b) => a.daysDiff - b.daysDiff);

  return {
    totalAlerts: alerts.length,
    overdueCount,
    overdueAmount,
    dueTodayCount,
    dueTodayAmount,
    dueIn3DaysCount,
    dueIn3DaysAmount,
    dueIn7DaysCount,
    dueIn7DaysAmount,
    totalAmountInAlert,
    alerts,
  };
}
