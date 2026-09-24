import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Pool } from 'pg';
import { cache } from 'react';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const localFallbackConnectionString =
  'postgresql://mock_user:mock_pass@localhost:5432/farmfin_db';

function getConnectionString(): string {
  try {
    const { env } = getCloudflareContext();
    const connectionString = (env as typeof env & { DB?: { connectionString?: string } }).DB
      ?.connectionString;
    if (connectionString) return connectionString;
  } catch {
    // Next.js development and build do not have a Cloudflare request context.
  }

  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // Allow Next's static production build to import server modules before any
  // runtime bindings exist. A deployed production request must use Hyperdrive
  // or DATABASE_URL; it must never silently connect to this local placeholder.
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('Cloudflare Hyperdrive binding DB or DATABASE_URL is required.');
  }

  return localFallbackConnectionString;
}

function createDb() {
  const pool = new Pool({
    connectionString: getConnectionString(),
    // Cloudflare Workers should not reuse a PostgreSQL connection across requests.
    maxUses: 1,
  });
  return drizzle({ client: pool, schema });
}

// OpenNext exposes Hyperdrive only inside a request context. Keep the public
// db surface lazy so server modules (including Better Auth) can be imported at
// startup, then resolve the per-request connection when a query is used.
const getDb = cache(createDb);
type FarmFinDb = ReturnType<typeof createDb>;
export const db = new Proxy({} as FarmFinDb, {
  get(_target, property) {
    const currentDb = getDb();
    const value = Reflect.get(currentDb, property, currentDb) as unknown;
    return typeof value === 'function' ? value.bind(currentDb) : value;
  },
});

export { schema };
