// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCurrentSession,
  getVerifiedSession,
  getEffectiveOrganizationId,
} from '../session';
import { DEFAULT_ORG_ID, SEED_USERS } from '@/db/seed';
import { DEMO_SESSION_COOKIE } from '../demoSession';

// Mock dependencies
const mockGetSession = vi.fn();
const mockHeaders = vi.fn();
const mockCookies = vi.fn();
const mockVerifyDemoSession = vi.fn();

vi.mock('next/headers', () => ({
  headers: () => mockHeaders(),
  cookies: () => mockCookies(),
}));

vi.mock('../auth', () => ({
  auth: {
    api: {
      getSession: (...args: any[]) => mockGetSession(...args),
    },
  },
}));

vi.mock('../demoSession', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../demoSession')>();
  return {
    ...actual,
    verifyDemoSession: (...args: any[]) => mockVerifyDemoSession(...args),
  };
});

describe('Session Retrieval & Verification Engine (src/lib/session.ts)', () => {
  const mockCookieStore = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockCookies.mockResolvedValue(mockCookieStore);
    mockCookieStore.get.mockReturnValue(undefined);
    mockGetSession.mockResolvedValue(null);
    mockVerifyDemoSession.mockResolvedValue(null);
  });

  describe('1. Better Auth Session Resolution (resolveBetterAuthSession via getVerifiedSession)', () => {
    it('resolves real Better Auth session with full profile (user, org, role)', async () => {
      mockGetSession.mockResolvedValueOnce({
        user: {
          id: 'usr-paraiba-01',
          name: 'Professor Paraíba',
          email: 'paraiba@farm-fin.com',
          role: 'Produtor',
          organizationId: 'org-fazenda-01',
          image: 'https://example.com/avatar.png',
        },
      });

      const session = await getVerifiedSession();

      expect(session).not.toBeNull();
      expect(session?.kind).toBe('auth');
      expect(session?.subject).toBe('user:usr-paraiba-01');
      expect(session?.isAuthenticated).toBe(true);
      expect(session?.role).toBe('Produtor');
      expect(session?.organizationId).toBe('org-fazenda-01');
      expect(session?.user).toEqual({
        id: 'usr-paraiba-01',
        name: 'Professor Paraíba',
        email: 'paraiba@farm-fin.com',
        role: 'Produtor',
        organizationId: 'org-fazenda-01',
        image: 'https://example.com/avatar.png',
      });
    });

    it('falls back to DEFAULT_ORG_ID when user.organizationId is omitted', async () => {
      mockGetSession.mockResolvedValueOnce({
        user: {
          id: 'usr-no-org',
          name: 'No Org User',
          email: 'no-org@farm-fin.com',
          role: 'Financeiro',
        },
      });

      const session = await getVerifiedSession();
      expect(session?.organizationId).toBe(DEFAULT_ORG_ID);
      expect(session?.user.organizationId).toBe(DEFAULT_ORG_ID);
      expect(session?.role).toBe('Financeiro');
    });

    it('falls back to Produtor role when user.role is omitted', async () => {
      mockGetSession.mockResolvedValueOnce({
        user: {
          id: 'usr-no-role',
          name: 'No Role User',
          email: 'no-role@farm-fin.com',
        },
      });

      const session = await getVerifiedSession();
      expect(session?.role).toBe('Produtor');
      expect(session?.user.role).toBe('Produtor');
    });

    it('gracefully catches Better Auth session exceptions and proceeds without throwing', async () => {
      mockGetSession.mockRejectedValueOnce(new Error('Database connection refused'));

      const session = await getVerifiedSession();
      // Should handle error and return null (since demo cookie is also empty)
      expect(session).toBeNull();
    });
  });

  describe('2. Demo Session Resolution (resolveDemoSession via getVerifiedSession)', () => {
    it('resolves demo session when Better Auth is absent and demo cookie is valid for seed user', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      mockCookieStore.get.mockReturnValueOnce({ value: 'valid-signed-token' });
      mockVerifyDemoSession.mockResolvedValueOnce({
        sid: 'sid-12345',
        email: 'antonio@fazendasantafe.com.br',
        name: 'Seu Antônio',
        role: 'Produtor',
      });

      const session = await getVerifiedSession();
      expect(session).not.toBeNull();
      expect(session?.kind).toBe('demo');
      expect(session?.subject).toBe('demo:sid-12345');
      expect(session?.isAuthenticated).toBe(true);
      expect(session?.role).toBe('Produtor');
      expect(session?.user.email).toBe('antonio@fazendasantafe.com.br');
    });

    it('resolves demo session for custom/non-seed email by constructing demo identity', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      mockCookieStore.get.mockReturnValueOnce({ value: 'valid-signed-token' });
      mockVerifyDemoSession.mockResolvedValueOnce({
        sid: 'sid-999',
        email: 'visitante@externo.com',
        name: 'Visitante Temporário',
        role: 'Contador',
      });

      const session = await getVerifiedSession();
      expect(session).not.toBeNull();
      expect(session?.kind).toBe('demo');
      expect(session?.subject).toBe('demo:sid-999');
      expect(session?.user.id).toBe('demo-sid-999');
      expect(session?.user.name).toBe('Visitante Temporário');
      expect(session?.role).toBe('Contador');
    });

    it('returns null when demo session token is invalid or tampered', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      mockCookieStore.get.mockReturnValueOnce({ value: 'tampered-token' });
      mockVerifyDemoSession.mockResolvedValueOnce(null);

      const session = await getVerifiedSession();
      expect(session).toBeNull();
    });

    it('handles cookie access failure outside request context gracefully', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      mockCookies.mockRejectedValueOnce(new Error('cookies was called outside a request scope'));

      const session = await getVerifiedSession();
      expect(session).toBeNull();
    });
  });

  describe('3. getCurrentSession Behavior', () => {
    it('returns verified session data (stripping kind and subject) when verified session exists', async () => {
      mockGetSession.mockResolvedValueOnce({
        user: {
          id: 'usr-gestor-1',
          name: 'Ana Gestora',
          email: 'ana@fazendasantafe.com.br',
          role: 'Gestor',
          organizationId: 'org-gestor',
        },
      });

      const session = await getCurrentSession();
      expect(session.isAuthenticated).toBe(true);
      expect(session.role).toBe('Gestor');
      expect(session.organizationId).toBe('org-gestor');
      expect(session.user.id).toBe('usr-gestor-1');
      expect((session as any).kind).toBeUndefined();
      expect((session as any).subject).toBeUndefined();
    });

    it('falls back to default demo session (SEED_USERS[0]) when neither auth nor demo session exists', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      mockCookieStore.get.mockReturnValueOnce(undefined);

      const session = await getCurrentSession();
      const defaultUser = SEED_USERS[0];

      expect(session.isAuthenticated).toBe(true);
      expect(session.user).toEqual(defaultUser);
      expect(session.organizationId).toBe(defaultUser.organizationId || DEFAULT_ORG_ID);
      expect(session.role).toBe(defaultUser.role);
    });
  });

  describe('4. getEffectiveOrganizationId Behavior', () => {
    it('returns organizationId from active authenticated session', async () => {
      mockGetSession.mockResolvedValueOnce({
        user: {
          id: 'usr-test',
          name: 'Test User',
          email: 'test@farm-fin.com',
          role: 'Financeiro',
          organizationId: 'custom-org-id-12345',
        },
      });

      const orgId = await getEffectiveOrganizationId();
      expect(orgId).toBe('custom-org-id-12345');
    });

    it('returns default organizationId when session has no explicit organizationId', async () => {
      mockGetSession.mockResolvedValueOnce(null);
      mockCookieStore.get.mockReturnValueOnce(undefined);

      const orgId = await getEffectiveOrganizationId();
      expect(orgId).toBe(SEED_USERS[0].organizationId || DEFAULT_ORG_ID);
    });
  });
});
