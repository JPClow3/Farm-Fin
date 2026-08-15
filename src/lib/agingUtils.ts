import { Payable, Receivable, AgingBucketKey, AgingSummary, AgingBucketItem } from './types';
import { calculateDateDifferenceDays, getTodayDateString } from './dateUtils';

/**
 * Returns the aging bucket key based on the due date and a reference date.
 * - 'a_vencer': target >= base (not overdue)
 * - '1_30': 1 to 30 days overdue
 * - '31_60': 31 to 60 days overdue
 * - '61_90': 61 to 90 days overdue
 * - '90_plus': 91+ days overdue
 */
export function getAgingBucketKey(dueDate: string, baseDate?: string): AgingBucketKey {
  const diffDays = calculateDateDifferenceDays(dueDate, baseDate || getTodayDateString());
  if (diffDays >= 0) return 'a_vencer';
  const delayDays = Math.abs(diffDays);
  if (delayDays <= 30) return '1_30';
  if (delayDays <= 60) return '31_60';
  if (delayDays <= 90) return '61_90';
  return '90_plus';
}

/**
 * Compiles a comprehensive Aging Analysis report from a list of payables or receivables.
 * Filters out already paid or cancelled items by default to calculate pending debt / credit aging.
 */
export function calculateAgingSummary<T extends Payable | Receivable>(
  items: T[],
  options?: {
    baseDate?: string;
    includePaid?: boolean;
  }
): AgingSummary<T> {
  const baseDate = options?.baseDate || getTodayDateString();
  const includePaid = options?.includePaid ?? false;

  const activeItems = includePaid
    ? items
    : items.filter((item) => item.status !== 'pago' && item.status !== 'cancelado');

  const initialBuckets: Record<AgingBucketKey, AgingBucketItem<T>> = {
    a_vencer: {
      key: 'a_vencer',
      label: 'A Vencer',
      rangeDescription: 'No prazo (vencimento futuro ou hoje)',
      count: 0,
      totalAmount: 0,
      percentage: 0,
      items: [],
    },
    '1_30': {
      key: '1_30',
      label: '1 a 30 dias',
      rangeDescription: 'Atraso de 1 até 30 dias',
      count: 0,
      totalAmount: 0,
      percentage: 0,
      items: [],
    },
    '31_60': {
      key: '31_60',
      label: '31 a 60 dias',
      rangeDescription: 'Atraso de 31 até 60 dias',
      count: 0,
      totalAmount: 0,
      percentage: 0,
      items: [],
    },
    '61_90': {
      key: '61_90',
      label: '61 a 90 dias',
      rangeDescription: 'Atraso de 61 até 90 dias',
      count: 0,
      totalAmount: 0,
      percentage: 0,
      items: [],
    },
    '90_plus': {
      key: '90_plus',
      label: 'Acima de 90 dias',
      rangeDescription: 'Inadimplência superior a 90 dias',
      count: 0,
      totalAmount: 0,
      percentage: 0,
      items: [],
    },
  };

  let totalOpenAmount = 0;

  for (const item of activeItems) {
    const amount = 'totalAmount' in item ? Number(item.totalAmount) : Number(item.amount) || 0;
    const bucketKey = getAgingBucketKey(item.dueDate, baseDate);

    initialBuckets[bucketKey].count += 1;
    initialBuckets[bucketKey].totalAmount += amount;
    initialBuckets[bucketKey].items.push(item);
    totalOpenAmount += amount;
  }

  // Calculate percentage shares
  for (const key of Object.keys(initialBuckets) as AgingBucketKey[]) {
    const bucket = initialBuckets[key];
    bucket.percentage =
      totalOpenAmount > 0 ? Number(((bucket.totalAmount / totalOpenAmount) * 100).toFixed(1)) : 0;
  }

  return {
    totalOpenAmount,
    totalCount: activeItems.length,
    buckets: initialBuckets,
  };
}
