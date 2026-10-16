import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { signScheduledJobBody, verifyScheduledJobSignature } from '../cron-signature';
import {
  SCHEDULED_JOB_PATH,
  SCHEDULED_JOB_SIGNATURE_HEADER,
  consumeScheduledJobs,
  dispatchScheduledCron,
  type ScheduledQueue,
  type ScheduledQueueMessage,
} from '../dispatch-scheduled-cron';
import { SCHEDULED_JOBS, jobForCron, parseScheduledJobMessage } from '../scheduled-jobs';

const SECRET = 'test-cron-secret';

function queues() {
  const alertSend = vi.fn(async () => undefined);
  const reportSend = vi.fn(async () => undefined);
  const env = {
    ALERT_QUEUE: { send: alertSend } as ScheduledQueue,
    REPORT_QUEUE: { send: reportSend } as ScheduledQueue,
    BETTER_AUTH_SECRET: SECRET,
    APP_URL: 'https://farm-fin.com',
  };
  return { env, alertSend, reportSend };
}

describe('scheduled cron jobs', () => {
  it('maps each wrangler cron to the queue named in the config comments', () => {
    const wrangler = readFileSync(path.join(process.cwd(), 'wrangler.jsonc'), 'utf8');
    expect(SCHEDULED_JOBS).toHaveLength(2);

    for (const job of SCHEDULED_JOBS) {
      expect(wrangler).toContain(`"${job.cron}"`);
      expect(wrangler).toContain(`"queue": "${job.queueName}"`);
      expect(jobForCron(job.cron)).toEqual(job);
    }

    expect(jobForCron('0 8 * * *')?.name).toBe('due-date-alert-sweep');
    expect(jobForCron('0 8 * * *')?.queueBinding).toBe('ALERT_QUEUE');
    expect(jobForCron('0 0 * * 1')?.name).toBe('weekly-cash-flow-summary');
    expect(jobForCron('0 0 * * 1')?.queueBinding).toBe('REPORT_QUEUE');
    expect(jobForCron('*/5 * * * *')).toBeNull();
  });

  it('accepts only a signed body whose cron matches the job', async () => {
    const body = JSON.stringify({
      job: 'due-date-alert-sweep',
      cron: '0 8 * * *',
      scheduledTime: 1_700_000_000_000,
    });
    const signature = await signScheduledJobBody(body, SECRET);
    expect(await verifyScheduledJobSignature(body, signature, SECRET)).toBe(true);
    expect(await verifyScheduledJobSignature(`${body} `, signature, SECRET)).toBe(false);
    expect(await verifyScheduledJobSignature(body, signature, 'other-secret')).toBe(false);
    expect(parseScheduledJobMessage(body)?.job).toBe('due-date-alert-sweep');
    expect(
      parseScheduledJobMessage(
        JSON.stringify({
          job: 'weekly-cash-flow-summary',
          cron: '0 8 * * *',
          scheduledTime: 1,
        })
      )
    ).toBeNull();
  });

  it('publishes the daily alert sweep to farm-fin-alerts', async () => {
    const { env, alertSend, reportSend } = queues();
    const job = await dispatchScheduledCron({
      cron: '0 8 * * *',
      scheduledTime: 1_700_000_000_000,
      env,
    });

    expect(job.queueName).toBe('farm-fin-alerts');
    expect(alertSend).toHaveBeenCalledWith({
      job: 'due-date-alert-sweep',
      cron: '0 8 * * *',
      scheduledTime: 1_700_000_000_000,
    });
    expect(reportSend).not.toHaveBeenCalled();
  });

  it('publishes the Monday cash-flow summary to farm-fin-reports', async () => {
    const { env, alertSend, reportSend } = queues();
    const job = await dispatchScheduledCron({
      cron: '0 0 * * 1',
      scheduledTime: 1_700_000_000_000,
      env,
    });

    expect(job.name).toBe('weekly-cash-flow-summary');
    expect(reportSend).toHaveBeenCalledWith({
      job: 'weekly-cash-flow-summary',
      cron: '0 0 * * 1',
      scheduledTime: 1_700_000_000_000,
    });
    expect(alertSend).not.toHaveBeenCalled();
  });

  it('rejects a cron that is not one of the two configured schedules', async () => {
    const { env, alertSend, reportSend } = queues();
    await expect(
      dispatchScheduledCron({ cron: '15 * * * *', scheduledTime: 1, env })
    ).rejects.toThrow(/No scheduled job/);
    expect(alertSend).not.toHaveBeenCalled();
    expect(reportSend).not.toHaveBeenCalled();
  });

  it('runs a queued alert sweep and retries when the finance job fails', async () => {
    const { env } = queues();
    const alert = message({
      job: 'due-date-alert-sweep',
      cron: '0 8 * * *',
      scheduledTime: 1_700_000_000_000,
    });
    const broken = message({
      job: 'weekly-cash-flow-summary',
      cron: '0 0 * * 1',
      scheduledTime: 1_700_000_000_000,
    });
    const poison = message({ job: 'not-a-job' });

    const fetchHandler = vi.fn(async (request: Request) => {
      const body = await request.text();
      const signature = request.headers.get(SCHEDULED_JOB_SIGNATURE_HEADER);
      expect(new URL(request.url).pathname).toBe(SCHEDULED_JOB_PATH);
      expect(await verifyScheduledJobSignature(body, signature, SECRET)).toBe(true);
      const parsed = JSON.parse(body) as { job: string };
      if (parsed.job === 'weekly-cash-flow-summary') {
        return new Response('db down', { status: 500 });
      }
      return new Response(JSON.stringify({ success: true, job: parsed.job }), { status: 200 });
    });

    await consumeScheduledJobs({
      messages: [alert.record, broken.record, poison.record],
      env,
      fetchHandler,
    });

    expect(alert.ack).toHaveBeenCalledOnce();
    expect(alert.retry).not.toHaveBeenCalled();
    expect(broken.retry).toHaveBeenCalledOnce();
    expect(broken.ack).not.toHaveBeenCalled();
    expect(poison.ack).toHaveBeenCalledOnce();
    expect(poison.retry).not.toHaveBeenCalled();
  });
});

function message(body: unknown): {
  record: ScheduledQueueMessage;
  ack: ReturnType<typeof vi.fn>;
  retry: ReturnType<typeof vi.fn>;
} {
  const ack = vi.fn();
  const retry = vi.fn();
  return { record: { body, ack, retry }, ack, retry };
}
