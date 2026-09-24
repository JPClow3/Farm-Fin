// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createDemoSessionPayload,
  getSessionSecret,
  signDemoSession,
  verifyDemoSession,
} from '../demoSession';

const SECRET = 'test-secret';

describe('demoSession', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('verifica uma sessão assinada pelo servidor', async () => {
    const payload = createDemoSessionPayload({
      email: 'antonio@fazendasantafe.com.br',
      name: 'Seu Antônio',
      role: 'Produtor',
    });
    const token = await signDemoSession(payload, SECRET);

    await expect(verifyDemoSession(token, SECRET)).resolves.toEqual(payload);
  });

  it('rejeita cookies forjados, adulterados ou assinados com outro segredo', async () => {
    const token = await signDemoSession(
      createDemoSessionPayload({ email: 'a@b.com', name: 'A', role: 'Contador' }),
      SECRET
    );
    const [body, signature] = token.split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), role: 'Produtor' })
    ).toString('base64url');

    await expect(verifyDemoSession('farmfin-token-123', SECRET)).resolves.toBeNull();
    await expect(verifyDemoSession(`${forgedBody}.${signature}`, SECRET)).resolves.toBeNull();
    await expect(verifyDemoSession(token, 'other-secret')).resolves.toBeNull();
    await expect(verifyDemoSession(token, null)).resolves.toBeNull();
    await expect(verifyDemoSession(undefined, SECRET)).resolves.toBeNull();
  });

  it('rejeita sessões expiradas', async () => {
    const token = await signDemoSession(
      createDemoSessionPayload({ email: 'a@b.com', name: 'A', role: 'Gestor' }),
      SECRET
    );
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000);

    await expect(verifyDemoSession(token, SECRET)).resolves.toBeNull();
  });

  it('não usa segredo padrão em produção', () => {
    vi.stubEnv('BETTER_AUTH_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(getSessionSecret()).toBeNull();

    vi.stubEnv('BETTER_AUTH_SECRET', 'real-secret');
    expect(getSessionSecret()).toBe('real-secret');
  });
});
