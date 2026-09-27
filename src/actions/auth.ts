'use server';

import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentSession, SessionContext } from '@/lib/session';
import { registerSchema, RegisterInput } from '@/lib/validations/auth.schema';

// Note: registerSchema/RegisterInput live in @/lib/validations/auth.schema, not here -
// a 'use server' file may only export async functions, so the Zod schema object can't
// live (or be re-exported) from this file. Import it directly from that module instead.
export type { RegisterInput };

export interface RegisterResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    username?: string | null;
    email: string;
    role: string;
    organizationId: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  error?: string;
}

/**
 * Server action to register a new user, create their tenant organization, and initialize their farm.
 */
export async function registerUserAction(input: RegisterInput): Promise<RegisterResult> {
  const validated = registerSchema.safeParse(input);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || 'Dados de cadastro inválidos',
    };
  }

  const { name, username, email, role, organizationName } = validated.data;

  try {
    // Better Auth has already created the credential and user before this action
    // attaches the tenant. Reuse that row when it matches the submitted identity.
    const existingUser = await db.query.users.findFirst({
      where: (u, { or, eq: equals }) => or(equals(u.email, email), equals(u.username, username)),
    });

    if (existingUser) {
      if (existingUser.username?.toLowerCase() !== username.toLowerCase()) {
        return { success: false, error: 'Este e-mail já está cadastrado.' };
      }
      if (existingUser.email.toLowerCase() !== email.toLowerCase()) {
        return { success: false, error: 'Este nome de usuário já está em uso.' };
      }
    }
    if (!existingUser) throw new Error('Conta não encontrada após a autenticação.');

    // 1. Create tenant organization
    const [newOrg] = await db
      .insert(schema.organizations)
      .values({
        name: organizationName,
        cnpjCpf: '00.000.000/0001-00',
      })
      .returning();

    if (!newOrg) throw new Error('Não foi possível criar a organização.');
    const orgId = newOrg.id;

    // Better Auth created the credential and account row before tenant setup.
    await db
      .update(schema.users)
      .set({ name, username, displayUsername: username, role, organizationId: orgId })
      .where(eq(schema.users.id, existingUser.id));
    const userId = existingUser.id;

    // 3. Assign User Role
    try {
      await db.insert(schema.userRoles).values({
        userId,
        organizationId: orgId,
        role: role.toUpperCase(),
      });
    } catch {
      // Non-blocking role association
    }

    // 4. Create default farm for the new organization
    try {
      await db.insert(schema.farms).values({
        organizationId: orgId,
        name: `Fazenda ${organizationName}`,
        location: 'Mato Grosso - MT',
        totalArea: 500,
        active: true,
      });
    } catch {
      // Non-blocking farm seed
    }

    return {
      success: true,
      user: {
        id: userId,
        name,
        username,
        email,
        role,
        organizationId: orgId,
      },
      organization: {
        id: orgId,
        name: organizationName,
      },
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string } | null;
    if (
      errorObj?.code === '23505' ||
      errorObj?.message?.includes('unique') ||
      errorObj?.message?.includes('duplicate key')
    ) {
      const isUsername = errorObj?.message?.includes('username');
      return {
        success: false,
        error: isUsername
          ? 'Este nome de usuário já está em uso.'
          : 'Este e-mail já está cadastrado.',
      };
    }

    return {
      success: false,
      error: 'Não foi possível finalizar o cadastro agora. Tente novamente em instantes.',
    };
  }
}

/**
 * Server action to get the current authenticated session details.
 */
export async function getAuthSessionAction(): Promise<SessionContext> {
  return await getCurrentSession();
}
