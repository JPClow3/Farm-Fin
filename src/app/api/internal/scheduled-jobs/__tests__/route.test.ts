// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { signScheduledJobBody } from '@/workers/cron-signature';
import { SCHEDULED_JOB_SIGNATURE_HEADER } from '@/workers/dispatch-scheduled-cron';

vi.mock('@/workers/cron-secret', () => ({
  readCronSecret: () => 'route-test-secret',
}));

vi.mock('@/workers/run-scheduled-job', () => ({
  runScheduledJob: vi.fn(),
}));

import { POST } from '../route';
import { runScheduledJob } from '@/workers/run-scheduled-job';

const runJob = vi.mocked(runScheduledJob);
const SECRET = 'route-test-secret';

async function post(body: string, signature: string | null, contentType = 'application/json') {
  const headers = new Headers({ 'content-type': contentType });
  if (signature) headers.set(SCHEDULED_JOB_SIGNATURE_HEADER, signature);
  return POST(
    new NextRequest('https://farm-fin.com/api/internal/scheduled-jobs', {
      method: 'POST',
      headers,
      body,
    })
  );
}

describe('POST /api/internal/scheduled-jobs', () => {
  beforeEach(() => {
    runJob.mockReset();
  });

  it('rejects unsigned and mismatched cron payloads', async () => {
    const body = JSON.stringify({
      job: 'due-date-alert-sweep',
      cron: '0 8 * * *',
      scheduledTime: 10,
    });
    expect((await post(body, null)).status).toBe(401);
    expect((await post(body, 'ab'.repeat(32))).status).toBe(401);
    expect(runJob).not.toHaveBeenCalled();
  });

  it('runs a signed due-date sweep', async () => {
    const body = JSON.stringify({
      job: 'due-date-alert-sweep',
      cron: '0 8 * * *',
      scheduledTime: 10,
    });
    const signature = await signScheduledJobBody(body, SECRET);
    runJob.mockResolvedValue({
      job: 'due-date-alert-sweep',
      success: true,
      data: {
        dispatchedCount: 2,
        channel: 'email',
        timestamp: 't',
        message: 'ok',
      },
    });

    const response = await post(body, signature);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      job: 'due-date-alert-sweep',
      success: true,
    });
    expect(runJob).toHaveBeenCalledWith({
      job: 'due-date-alert-sweep',
      cron: '0 8 * * *',
      scheduledTime: 10,
    });
  });

  it('returns 500 when the finance job reports failure', async () => {
    const body = JSON.stringify({
      job: 'weekly-cash-flow-summary',
      cron: '0 0 * * 1',
      scheduledTime: 10,
    });
    const signature = await signScheduledJobBody(body, SECRET);
    runJob.mockResolvedValue({
      job: 'weekly-cash-flow-summary',
      success: false,
      error: 'db down',
    });

    expect((await post(body, signature)).status).toBe(500);
  });
});
