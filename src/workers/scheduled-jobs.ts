/**
 * Cron → job map for the farm-fin Worker.
 *
 * The expressions are the ones in wrangler.jsonc:
 * - "0 8 * * *" daily at 08:00 UTC — due-date alert sweep → farm-fin-alerts
 * - "0 0 * * 1" Mondays at 00:00 UTC — weekly cash flow summary → farm-fin-reports
 *
 * The Worker is the producer for both queues and, before this handler, nothing
 * sent to them and nothing consumed them. `scheduled()` publishes one message
 * per cron. The queue handler on this same Worker runs the existing finance job.
 */

export const DUE_DATE_ALERT_CRON = '0 8 * * *';
export const WEEKLY_CASH_FLOW_CRON = '0 0 * * 1';

export type ScheduledJobName = 'due-date-alert-sweep' | 'weekly-cash-flow-summary';

export type ScheduledQueueBinding = 'ALERT_QUEUE' | 'REPORT_QUEUE';

export interface ScheduledJob {
  name: ScheduledJobName;
  cron: string;
  queueBinding: ScheduledQueueBinding;
  queueName: 'farm-fin-alerts' | 'farm-fin-reports';
}

export interface ScheduledJobMessage {
  job: ScheduledJobName;
  cron: string;
  scheduledTime: number;
}

export const SCHEDULED_JOBS: readonly ScheduledJob[] = [
  {
    name: 'due-date-alert-sweep',
    cron: DUE_DATE_ALERT_CRON,
    queueBinding: 'ALERT_QUEUE',
    queueName: 'farm-fin-alerts',
  },
  {
    name: 'weekly-cash-flow-summary',
    cron: WEEKLY_CASH_FLOW_CRON,
    queueBinding: 'REPORT_QUEUE',
    queueName: 'farm-fin-reports',
  },
];

const JOBS_BY_CRON = new Map(SCHEDULED_JOBS.map((job) => [job.cron, job]));

export function jobForCron(cron: string): ScheduledJob | null {
  return JOBS_BY_CRON.get(cron) ?? null;
}

export function parseScheduledJobMessage(raw: string): ScheduledJobMessage | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const job = record.job;
  const cron = record.cron;
  const scheduledTime = record.scheduledTime;
  if (job !== 'due-date-alert-sweep' && job !== 'weekly-cash-flow-summary') return null;
  if (typeof cron !== 'string' || typeof scheduledTime !== 'number') return null;
  if (!Number.isFinite(scheduledTime)) return null;

  const expected = jobForCron(cron);
  if (!expected || expected.name !== job) return null;

  return { job, cron, scheduledTime };
}
