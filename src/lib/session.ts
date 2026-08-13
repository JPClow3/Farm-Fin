import { headers } from 'next/headers';
import { auth } from './auth';
import { DEFAULT_ORG_ID, SEED_USERS } from '../db/seed';
import { User, UserRoleType } from './types';

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
