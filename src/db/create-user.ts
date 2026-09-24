/**
 * Creates a real login account (Better Auth) in the database from DATABASE_URL.
 *
 *   npm run db:create-user -- --username paraiba --password '...' --name 'Prof. Paraíba' --role Produtor
 *
 * The password is hashed by Better Auth itself, exactly as on sign-up. The
 * demo organization is created first when missing, since users belong to one.
 * Role `Produtor` (Proprietário) has full access to every module.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { parseArgs } from 'node:util';

async function main() {
  const { values } = parseArgs({
    options: {
      username: { type: 'string' },
      password: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      role: { type: 'string', default: 'Produtor' },
    },
  });

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definido.');
  }
  if (!values.username || !values.password) {
    throw new Error('Informe --username e --password.');
  }

  // Imported after dotenv so both modules see DATABASE_URL
  const { db, schema } = await import('./index');
  const { SEED_ORGANIZATION } = await import('./seed');
  const { auth } = await import('../lib/auth');

  await db
    .insert(schema.organizations)
    .values({ id: SEED_ORGANIZATION.id, name: SEED_ORGANIZATION.name, cnpjCpf: SEED_ORGANIZATION.cnpjCpf })
    .onConflictDoNothing();

  const username = values.username.trim().toLowerCase();
  const result = await auth.api.signUpEmail({
    body: {
      email: values.email || `${username}@usuarios.farm-fin.com`,
      password: values.password,
      name: values.name || username,
      username,
      role: values.role,
      organizationId: SEED_ORGANIZATION.id,
    },
  });

  console.log(`[create-user] Usuário "${username}" criado (id ${result.user.id}, perfil ${values.role}).`);
}

main().catch((error) => {
  console.error('[create-user] Falha:', error instanceof Error ? error.message : error);
  process.exit(1);
});
