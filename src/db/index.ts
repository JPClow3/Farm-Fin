import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://mock_user:mock_pass@localhost:5432/farmfin_db';

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export { schema };
