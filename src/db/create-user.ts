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
  const { eq } = await import('drizzle-orm');

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

  // 2. Check if user already exists (idempotency check)
  let existingUser = null;
  try {
    existingUser = await db.query.users.findFirst({
      where: (u, { or: orOp, eq: eqOp }) => orOp(eqOp(u.username, username), eqOp(u.email, email)),
    });
  } catch (err) {
    console.warn('[create-user] Consulta de usuário existente falhou:', err);
  }

  if (existingUser) {
    // Idempotent update of existing user attributes
    try {
      await db
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
        .where(eq(schema.users.id, existingUser.id));

      try {
        await db
          .insert(schema.userRoles)
          .values({
            userId: existingUser.id,
            organizationId: SEED_ORGANIZATION.id,
            role: 'PROPRIETARIO',
          })
          .onConflictDoNothing();
      } catch {
        // Non-blocking role association
      }

      console.log(
        `[create-user] Usuário "${username}" já existe e foi atualizado/confirmado (id: ${existingUser.id}, perfil: ${role}).`
      );
      return { id: existingUser.id, username, email, name, role };
    } catch (updateErr) {
      console.warn('[create-user] Atualização de usuário existente encontrou aviso:', updateErr);
      return { id: existingUser.id, username, email, name, role };
    }
  }

  // 3. User does not exist, create via Better Auth
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        username,
        role,
        organizationId: SEED_ORGANIZATION.id,
      },
    });

    const userId = result?.user?.id;
    if (userId) {
      try {
        await db
          .insert(schema.userRoles)
          .values({
            userId,
            organizationId: SEED_ORGANIZATION.id,
            role: 'PROPRIETARIO',
          })
          .onConflictDoNothing();
      } catch {
        // Non-blocking role association
      }
    }

    console.log(
      `[create-user] Usuário "${username}" criado com sucesso (id: ${userId || 'novo'}, perfil: ${role}).`
    );
    return { id: userId, username, email, name, role };
  } catch (authErr: unknown) {
    const errorObj = authErr as { message?: string; status?: number } | null;
    if (errorObj?.message?.includes('already exists') || errorObj?.status === 422) {
      console.log(
        `[create-user] Usuário "${username}" / "${email}" já cadastrado no provedor de autenticação.`
      );
      return { username, email, name, role };
    }
    throw authErr;
  }
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
