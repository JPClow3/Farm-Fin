/**
 * Utility functions for date manipulation and formatting in Farm-Fin.
 */

export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function formatDateToBR(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function addDaysToDate(dateStr: string, daysToAdd: number): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(Date.UTC(y, m, d + daysToAdd));
    return dateObj.toISOString().split('T')[0];
  }
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return dateStr;
  dateObj.setDate(dateObj.getDate() + daysToAdd);
  return dateObj.toISOString().split('T')[0];
}

export function addMonthsToDate(dateStr: string, monthsToAdd: number): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1 + monthsToAdd;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(Date.UTC(y, m, d));
    return dateObj.toISOString().split('T')[0];
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + monthsToAdd);
    return fallback.toISOString().split('T')[0];
  }
  d.setMonth(d.getMonth() + monthsToAdd);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates the number of days difference: targetDate - baseDate.
 * E.g., if target is 2026-08-17 and base is 2026-08-14, returns 3.
 * If target is 2026-08-10 and base is 2026-08-14, returns -4 (overdue by 4 days).
 */
export function calculateDateDifferenceDays(targetDate: string, baseDate?: string): number {
  const base = baseDate || getTodayDateString();
  const tParts = targetDate.split('-');
  const bParts = base.split('-');
  if (tParts.length === 3 && bParts.length === 3) {
    const tUtc = Date.UTC(
      parseInt(tParts[0], 10),
      parseInt(tParts[1], 10) - 1,
      parseInt(tParts[2], 10)
    );
    const bUtc = Date.UTC(
      parseInt(bParts[0], 10),
      parseInt(bParts[1], 10) - 1,
      parseInt(bParts[2], 10)
    );
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((tUtc - bUtc) / msPerDay);
  }
  const tTime = new Date(targetDate).getTime();
  const bTime = new Date(base).getTime();
  return Math.round((tTime - bTime) / (1000 * 60 * 60 * 24));
}

/**
 * Generates the due date for step `i` (0-indexed) based on recurrence pattern.
 */
export function getNextRecurrenceDate(
  startDate: string,
  pattern: 'none' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly',
  step: number
): string {
  if (step === 0 || pattern === 'none') return startDate;
  switch (pattern) {
    case 'biweekly':
      return addDaysToDate(startDate, step * 14);
    case 'monthly':
      return addMonthsToDate(startDate, step);
    case 'quarterly':
      return addMonthsToDate(startDate, step * 3);
    case 'semiannual':
      return addMonthsToDate(startDate, step * 6);
    case 'yearly':
      return addMonthsToDate(startDate, step * 12);
    default:
      return addMonthsToDate(startDate, step);
  }
}

export function getMonthYearLabel(dateStr: string): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
