/**
 * Creates a real login account (Better Auth) in the database.
 *
 *   FARMFIN_CREATE_USER_PASSWORD=<secret> npm run db:create-user -- --username paraiba
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

import { parseArgs } from 'node:util';

export interface ProvisionUserOptions {
  username?: string;
  password?: string;
  name?: string;
  email?: string;
  role?: string;
}

export async function provisionUser(options: ProvisionUserOptions = {}) {
  const username = (options.username || 'paraiba').trim().toLowerCase();
  const password = options.password || process.env.FARMFIN_CREATE_USER_PASSWORD;
  if (!password) throw new Error('Defina FARMFIN_CREATE_USER_PASSWORD para criar o usuário.');
  const name = options.name || 'Professor Paraíba';
  const email = (options.email || 'paraiba@farm-fin.com').trim().toLowerCase();
  const role = options.role || 'Produtor';

  // Imported after dotenv so both modules see DATABASE_URL
  const { db, schema } = await import('./index');
  const { SEED_ORGANIZATION } = await import('./seed');
  const { auth } = await import('../lib/auth');
  const { eq, sql } = await import('drizzle-orm');

  // 1. Ensure Tenant Organization exists
  try {
    await db
      .insert(schema.organizations)
      .values({
        id: SEED_ORGANIZATION.id,
        name: SEED_ORGANIZATION.name,
        cnpjCpf: SEED_ORGANIZATION.cnpjCpf,
      })
      .onConflictDoNothing();
  } catch (orgErr: unknown) {
    const errorObj = orgErr as {
      code?: string;
      cause?: { code?: string };
      message?: string;
    } | null;
    if (
      errorObj?.code === 'ECONNREFUSED' ||
      errorObj?.cause?.code === 'ECONNREFUSED' ||
      errorObj?.message?.includes('ECONNREFUSED')
    ) {
      throw new Error('Banco de dados PostgreSQL não acessível. Nenhum usuário foi criado.');
    }
    throw orgErr;
  }

  const attachAccount = async (userId: string) => {
    await db.transaction(async (tx) => {
      // Serialize role initialization without requiring a production migration.
      await tx.execute(
        sql`SELECT id FROM ${schema.users} WHERE ${schema.users.id} = ${userId} FOR UPDATE`
      );
      const updated = await tx
        .update(schema.users)
        .set({
          name,
          username,
          displayUsername: username,
          role,
          organizationId: SEED_ORGANIZATION.id,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId))
        .returning({ id: schema.users.id });
      if (!updated.length)
        throw new Error('A conta de acesso não foi encontrada para provisionamento.');
      await tx.execute(sql`
        INSERT INTO ${schema.userRoles} (user_id, organization_id, role)
        SELECT ${userId}::uuid, ${SEED_ORGANIZATION.id}::uuid, 'PROPRIETARIO'
        WHERE NOT EXISTS (
          SELECT 1 FROM ${schema.userRoles}
          WHERE user_id = ${userId}::uuid AND organization_id = ${SEED_ORGANIZATION.id}::uuid AND role = 'PROPRIETARIO'
        )
      `);
    });
    return { id: userId, username, email, name, role };
  };
  const findAccount = () =>
    db.query.users.findFirst({
      where: (u, { or: orOp, eq: eqOp }) => orOp(eqOp(u.username, username), eqOp(u.email, email)),
    });
  // Query/update failures must cause the CLI to fail instead of reporting readiness.
  const existingUser = await findAccount();
  if (existingUser) return await attachAccount(existingUser.id);
  let userId: string | undefined;
  try {
    const result = await auth.api.signUpEmail({ body: { email, password, name, username } });
    userId = result?.user?.id;
  } catch (authErr: unknown) {
    const errorObj = authErr as { message?: string; status?: number } | null;
    if (errorObj?.message?.includes('already exists') || errorObj?.status === 422) {
      const recovered = await findAccount();
      if (
        recovered?.username?.toLowerCase() === username &&
        recovered.email.toLowerCase() === email
      ) {
        return await attachAccount(recovered.id);
      }
    }
    throw authErr;
  }
  if (!userId) throw new Error('O provedor não retornou uma conta criada.');
  return await attachAccount(userId);
}

async function main() {
  const { values } = parseArgs({
    options: {
      username: { type: 'string', default: 'paraiba' },
      password: {
        type: 'string',
        default: process.env.FARMFIN_CREATE_USER_PASSWORD || 'melhorprofessor',
      },
      name: { type: 'string', default: 'Professor Paraíba' },
      email: { type: 'string', default: 'paraiba@farm-fin.com' },
      role: { type: 'string', default: 'Produtor' },
    },
  });

  await provisionUser({
    username: values.username,
    password: values.password,
    name: values.name,
    email: values.email,
    role: values.role,
  });
}

// Execute main when run from CLI
if (process.argv[1]?.includes('create-user')) {
  main().catch((error) => {
    console.error('[create-user] Falha:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
