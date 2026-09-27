import { headers, cookies } from 'next/headers';
import { auth } from './auth';
import { DEFAULT_ORG_ID, SEED_USERS } from '../db/seed';
import { User, UserRoleType } from './types';
import { DEMO_SESSION_COOKIE, getSessionSecret, verifyDemoSession } from './demoSession';

export interface SessionContext {
  user: User;
  organizationId: string;
  role: UserRoleType;
  isAuthenticated: boolean;
}

export interface VerifiedSessionContext extends SessionContext {
  /** 'auth' = real Better Auth session; 'demo' = server-signed demo persona */
  kind: 'auth' | 'demo';
  /** Stable id for per-session limits (user id or demo session id) */
  subject: string;
}

async function resolveBetterAuthSession(): Promise<VerifiedSessionContext | null> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session?.user) return null;

  const user = session.user as typeof session.user & {
    organizationId?: string;
    role?: UserRoleType;
  };
  const orgId = user.organizationId || DEFAULT_ORG_ID;
  const role = (user.role as UserRoleType) || 'Produtor';

  return {
    kind: 'auth',
    subject: `user:${user.id}`,
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

async function resolveDemoSession(): Promise<VerifiedSessionContext | null> {
  const cookieStore = await cookies();
  const payload = await verifyDemoSession(
    cookieStore.get(DEMO_SESSION_COOKIE)?.value,
    getSessionSecret()
  );
  if (!payload) return null;

  const seedUser = SEED_USERS.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
  const user: User = seedUser
    ? { ...seedUser, role: payload.role }
    : {
        ...SEED_USERS[0],
        id: `demo-${payload.sid}`,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };

  return {
    kind: 'demo',
    subject: `demo:${payload.sid}`,
    user,
    organizationId: user.organizationId || DEFAULT_ORG_ID,
    role: payload.role,
    isAuthenticated: true,
  };
}

/**
 * Resolves a session that the server can vouch for: a real Better Auth session
 * (checked against the database) or a server-signed demo session. Returns null
 * otherwise - unlike getCurrentSession, there is no default demo fallback, so
 * use this to protect endpoints with real cost (e.g. the NF OCR).
 */
export async function getVerifiedSession(): Promise<VerifiedSessionContext | null> {
  try {
    const authSession = await resolveBetterAuthSession();
    if (authSession) return authSession;
  } catch (error) {
    console.warn('[getVerifiedSession] Better Auth session lookup failed:', error);
  }

  try {
    return await resolveDemoSession();
  } catch {
    // headers/cookies unavailable outside a request context (e.g. tests)
    return null;
  }
}

/**
 * Resolves the authenticated user and organization context for Server Actions.
 */
export async function getCurrentSession(): Promise<SessionContext> {
  const verified = await getVerifiedSession();
  if (verified) {
    const { kind: _kind, subject: _subject, ...session } = verified;
    return session;
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
