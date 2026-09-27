import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Minimal fixed-window rate limiter.
 *
 * Uses the Workers KV binding `CACHE` when running on Cloudflare (shared across
 * isolates; KV is eventually consistent, so limits are approximate). Falls back
 * to an in-memory map in local dev/tests.
 */

interface MinimalKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface RateLimitRule {
  /** Identifies what is being limited, e.g. `ocr:user:123` */
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the current window resets */
  retryAfter: number;
}

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

const memoryKV: MinimalKV = {
  async get(key) {
    const entry = memoryStore.get(key);
    if (!entry || entry.expiresAt < Date.now()) return null;
    return String(entry.count);
  },
  async put(key, value, options) {
    memoryStore.set(key, {
      count: Number(value),
      expiresAt: Date.now() + (options?.expirationTtl ?? 60) * 1000,
    });
  },
};

async function getStore(): Promise<MinimalKV> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as unknown as { CACHE?: MinimalKV }).CACHE;
    if (kv) return kv;
  } catch {
    // Not running on Cloudflare (next dev / tests)
  }
  return memoryKV;
}

export async function consumeRateLimit(
  rules: RateLimitRule[],
  store?: MinimalKV
): Promise<RateLimitResult> {
  const kv = store ?? (await getStore());
  const now = Math.floor(Date.now() / 1000);

  const windows = await Promise.all(
    rules.map(async (rule) => {
      const windowStart = now - (now % rule.windowSeconds);
      const storageKey = `rl:${rule.key}:${windowStart}`;
      const count = Number((await kv.get(storageKey)) ?? 0);
      return { rule, storageKey, count, retryAfter: windowStart + rule.windowSeconds - now };
    })
  );

  const blocked = windows.find((w) => w.count >= w.rule.limit);
  if (blocked) {
    return { allowed: false, retryAfter: blocked.retryAfter };
  }

  await Promise.all(
    windows.map((w) =>
      // KV requires a TTL of at least 60s
      kv.put(w.storageKey, String(w.count + 1), {
        expirationTtl: Math.max(60, w.retryAfter + 60),
      })
    )
  );
  return { allowed: true, retryAfter: 0 };
}
