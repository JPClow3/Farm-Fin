import { getCashFlowReport, sendDueDateAlertsNotificationAction } from '@/actions/finance';
import type { ScheduledJobMessage } from './scheduled-jobs';

/**
 * Executes the finance job named by a cron trigger.
 *
 * Both actions resolve the organization from the request session and, outside a
 * logged-in request, fall back to the default organization. Cron invocations
 * have no user session, so they use that same fallback.
 */
export async function runScheduledJob(message: ScheduledJobMessage) {
  if (message.job === 'due-date-alert-sweep') {
    const result = await sendDueDateAlertsNotificationAction('email');
    return { job: message.job, ...result };
  }

  const result = await getCashFlowReport('semanal');
  return { job: message.job, ...result };
}
