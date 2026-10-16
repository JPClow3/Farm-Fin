import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runScheduledJob } from '../run-scheduled-job';

vi.mock('@/actions/finance', () => ({
  sendDueDateAlertsNotificationAction: vi.fn(),
  getCashFlowReport: vi.fn(),
}));

import { getCashFlowReport, sendDueDateAlertsNotificationAction } from '@/actions/finance';

const sendAlerts = vi.mocked(sendDueDateAlertsNotificationAction);
const cashFlow = vi.mocked(getCashFlowReport);

describe('runScheduledJob', () => {
  beforeEach(() => {
    sendAlerts.mockReset();
    cashFlow.mockReset();
  });

  it('runs the due-date alert notification for the daily cron', async () => {
    sendAlerts.mockResolvedValue({
      success: true,
      data: {
        dispatchedCount: 4,
        channel: 'email',
        timestamp: '2026-10-16T08:00:00.000Z',
        message: '4 alertas',
      },
    });

    const result = await runScheduledJob({
      job: 'due-date-alert-sweep',
      cron: '0 8 * * *',
      scheduledTime: 1,
    });

    expect(sendAlerts).toHaveBeenCalledWith('email');
    expect(cashFlow).not.toHaveBeenCalled();
    expect(result).toMatchObject({ job: 'due-date-alert-sweep', success: true });
  });

  it('builds the weekly cash flow summary for the Monday cron', async () => {
    cashFlow.mockResolvedValue({
      success: true,
      data: [
        {
          period: 'Semana',
          initialBalance: 1,
          inflows: 2,
          outflows: 1,
          netFlow: 1,
          finalBalance: 2,
          isProjected: false,
        },
      ],
    });

    const result = await runScheduledJob({
      job: 'weekly-cash-flow-summary',
      cron: '0 0 * * 1',
      scheduledTime: 1,
    });

    expect(cashFlow).toHaveBeenCalledWith('semanal');
    expect(sendAlerts).not.toHaveBeenCalled();
    expect(result).toMatchObject({ job: 'weekly-cash-flow-summary', success: true });
  });
});
