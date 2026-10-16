// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

describe('middleware scheduled jobs', () => {
  it('lets the cron route through without a session cookie', async () => {
    const response = await middleware(
      new NextRequest('https://farm-fin.com/api/internal/scheduled-jobs', {
        method: 'POST',
      })
    );
    expect(response.status).not.toBe(401);
  });

  it('still rejects other API routes without a session', async () => {
    const response = await middleware(
      new NextRequest('https://farm-fin.com/api/internal/other', { method: 'POST' })
    );
    expect(response.status).toBe(401);
  });
});
