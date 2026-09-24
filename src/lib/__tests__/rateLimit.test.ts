// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { consumeRateLimit } from '../rateLimit';

function createStore() {
  const data = new Map<string, string>();
  return {
    async get(key: string) {
      return data.get(key) ?? null;
    },
    async put(key: string, value: string) {
      data.set(key, value);
    },
  };
}

describe('consumeRateLimit', () => {
  it('bloqueia quando qualquer regra atinge o limite', async () => {
    const store = createStore();
    const rules = [
      { key: 'ocr:user:1', limit: 2, windowSeconds: 3600 },
      { key: 'ocr:global', limit: 10, windowSeconds: 86400 },
    ];

    expect((await consumeRateLimit(rules, store)).allowed).toBe(true);
    expect((await consumeRateLimit(rules, store)).allowed).toBe(true);

    const blocked = await consumeRateLimit(rules, store);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);

    // Outro usuário continua liberado, e o global conta só as permitidas
    expect(
      (await consumeRateLimit([{ key: 'ocr:user:2', limit: 2, windowSeconds: 3600 }, rules[1]], store))
        .allowed
    ).toBe(true);
    expect(await store.get(`rl:ocr:global:${Math.floor(Date.now() / 1000) - (Math.floor(Date.now() / 1000) % 86400)}`)).toBe('3');
  });
});
