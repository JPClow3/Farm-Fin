import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';
dotenv.config();

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[Migrate] DATABASE_URL is not defined. Skipping live DB migration.');
    return;
  }

  console.log('[Migrate] Starting database migrations from ./drizzle...');
  try {
    const sql = neon(connectionString);
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('[Migrate] Database migrations applied successfully!');
  } catch (error) {
    console.error('[Migrate] Error applying database migrations:', error);
    process.exit(1);
  }
}

runMigrations();
