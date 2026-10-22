import type { BrowserContext } from '@playwright/test';
import { DEMO_SESSION_COOKIE, signDemoSession } from '../../src/lib/demoSession';

/** Match the server's signed fixture session instead of relying on an invalid placeholder token. */
export async function installDemoSession(
  context: BrowserContext,
  baseURL = 'http://localhost:3000'
) {
  if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) {
    throw new Error('Sessões de teste só podem ser usadas no servidor local');
  }
  const value = await signDemoSession(
    {
      sid: 'e2e-core-fixture',
      email: 'paraiba@farm-fin.com',
      name: 'Professor Paraíba',
      role: 'Produtor',
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    'farm-fin-e2e-only-secret-at-least-32-characters'
  );
  await context.addCookies([{ name: DEMO_SESSION_COOKIE, value, url: baseURL, httpOnly: true }]);
}
