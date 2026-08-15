import { headers, cookies } from 'next/headers';
import { auth } from './auth';
import { DEFAULT_ORG_ID, SEED_USERS } from '../db/seed';
import { User, UserRoleType } from './types';

const DEMO_ROLES: UserRoleType[] = ['Produtor', 'Gestor', 'Financeiro', 'Contador', 'Operador'];

export interface SessionContext {
  user: User;
  organizationId: string;
  role: UserRoleType;
  isAuthenticated: boolean;
}

/**
 * Resolves the authenticated user and organization context for Server Actions.
 */
export async function getCurrentSession(): Promise<SessionContext> {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (session?.user) {
      const user = session.user as typeof session.user & {
        organizationId?: string;
        role?: UserRoleType;
      };
      const orgId = user.organizationId || DEFAULT_ORG_ID;
      const role = (user.role as UserRoleType) || 'Produtor';

      return {
        user: {
          id: user.id,
          organizationId: orgId,
          name: user.name,
          email: user.email,
          role,
          image: user.image,
        },
        organizationId: orgId,
        role,
        isAuthenticated: true,
      };
    }
  } catch (error) {
    // Session resolution fallback for local/demo execution
  }

  // No real Better Auth session was resolved. Fall back to the demo persona
  // selected at /login or /configuracoes (stored as a cookie so it's visible
  // server-side, unlike the localStorage copy used for instant client rendering).
  try {
    const cookieStore = await cookies();
    const demoRole = cookieStore.get('farmfin_demo_role')?.value as UserRoleType | undefined;
    if (demoRole && DEMO_ROLES.includes(demoRole)) {
      const demoUser =
        SEED_USERS.find((u) => u.role === demoRole) ||
        ({ ...SEED_USERS[0], role: demoRole } as User);
      return {
        user: demoUser,
        organizationId: demoUser.organizationId || DEFAULT_ORG_ID,
        role: demoRole,
        isAuthenticated: true,
      };
    }
  } catch {
    // headers/cookies unavailable outside a request context (e.g. tests) - ignore
  }

  // Default demo session (Seu Antônio - Produtor)
  const defaultUser = SEED_USERS[0];
  return {
    user: defaultUser,
    organizationId: defaultUser.organizationId || DEFAULT_ORG_ID,
    role: defaultUser.role,
    isAuthenticated: true,
  };
}

/**
 * Returns the active organization ID for query scoping.
 */
export async function getEffectiveOrganizationId(): Promise<string> {
  const session = await getCurrentSession();
  return session.organizationId || DEFAULT_ORG_ID;
}
