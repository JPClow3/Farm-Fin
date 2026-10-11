import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SEED_USERS, DEFAULT_ORG_ID, SEED_ORGANIZATION } from '../seed';
import { provisionUser } from '../create-user';
import { registerUserAction } from '../../actions/auth';
import { registerSchema } from '../../lib/validations/auth.schema';

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  dbInsert: vi.fn(),
  dbUpdate: vi.fn(),
  signUpEmail: vi.fn(),
}));

// Mock DB queries for create-user.ts and actions/auth.ts
vi.mock('../index', () => ({
  db: {
    query: {
      users: {
        findFirst: mocks.findUser,
      },
    },
    insert: mocks.dbInsert,
    update: mocks.dbUpdate,
  },
  schema: {
    organizations: { id: 'organizations.id' },
    users: { id: 'users.id' },
    userRoles: { id: 'user_roles.id' },
    farms: { id: 'farms.id' },
  },
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      users: {
        findFirst: mocks.findUser,
      },
    },
    insert: mocks.dbInsert,
    update: mocks.dbUpdate,
  },
  schema: {
    organizations: { id: 'organizations.id' },
    users: { id: 'users.id' },
    userRoles: { id: 'user_roles.id' },
    farms: { id: 'farms.id' },
  },
}));

// Mock Better Auth for create-user.ts
vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: mocks.signUpEmail,
    },
  },
}));

describe('Milestone 1 Empirical Challenger: User Provisioning, Idempotency & Auth Collisions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behaviors
    mocks.dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue({}),
        returning: vi.fn().mockResolvedValue([{ id: 'mock-org-uuid', name: 'Fazenda Santa Fé' }]),
      }),
    });

    mocks.dbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'mock-user-uuid' }]),
      }),
    });

    mocks.signUpEmail.mockResolvedValue({
      user: {
        id: 'u0000000-0000-4000-8000-000000000005',
        email: 'paraiba@farm-fin.com',
        name: 'Professor Paraíba',
      },
    });
  });

  describe('1. Authoritative User Contract: user "paraiba"', () => {
    it('verifies user "paraiba" is present in SEED_USERS with exact required properties', () => {
      const paraiba = SEED_USERS.find((u) => u.username === 'paraiba');
      expect(paraiba).toBeDefined();
      expect(paraiba?.username).toBe('paraiba');
      expect(paraiba?.email).toBe('paraiba@farm-fin.com');
      expect(paraiba?.role).toBe('Produtor');
      expect(paraiba?.name).toBe('Professor Paraíba');
      expect(paraiba?.organizationId).toBe(DEFAULT_ORG_ID);
      expect(paraiba?.id).toBe('u0000000-0000-4000-8000-000000000005');
    });

    it('verifies SEED_ORGANIZATION matches DEFAULT_ORG_ID', () => {
      expect(SEED_ORGANIZATION.id).toBe(DEFAULT_ORG_ID);
      expect(SEED_ORGANIZATION.name).toBe('Grupo Agropecuário Santa Fé');
    });

    it('enforces password requirement and allows "melhorprofessor" credentials', async () => {
      const previousEnv = process.env.FARMFIN_CREATE_USER_PASSWORD;
      delete process.env.FARMFIN_CREATE_USER_PASSWORD;

      try {
        // Without password -> MUST reject
        await expect(provisionUser({ username: 'paraiba' })).rejects.toThrow(
          'Defina FARMFIN_CREATE_USER_PASSWORD para criar o usuário.'
        );

        // With explicit password "melhorprofessor" -> MUST accept
        mocks.findUser.mockResolvedValue(null);
        const result = await provisionUser({
          username: 'paraiba',
          password: 'melhorprofessor',
        });

        expect(result.username).toBe('paraiba');
        expect(result.role).toBe('Produtor');
        expect(result.email).toBe('paraiba@farm-fin.com');
        expect(mocks.signUpEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              username: 'paraiba',
              password: 'melhorprofessor',
              email: 'paraiba@farm-fin.com',
              role: 'Produtor',
            }),
          })
        );
      } finally {
        if (previousEnv !== undefined) {
          process.env.FARMFIN_CREATE_USER_PASSWORD = previousEnv;
        } else {
          delete process.env.FARMFIN_CREATE_USER_PASSWORD;
        }
      }
    });
  });

  describe('2. Idempotency of provisionUser in create-user.ts', () => {
    it('creates user on first call when user does not exist in DB', async () => {
      mocks.findUser.mockResolvedValue(null);

      const result = await provisionUser({
        username: 'paraiba',
        password: 'melhorprofessor',
      });

      expect(mocks.signUpEmail).toHaveBeenCalledTimes(1);
      expect(result.username).toBe('paraiba');
      expect(result.email).toBe('paraiba@farm-fin.com');
    });

    it('updates user idempotently without calling signUpEmail when user already exists in DB', async () => {
      // Simulate user existing in database
      const existingUserRecord = {
        id: 'u0000000-0000-4000-8000-000000000005',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
        name: 'Professor Paraíba',
        role: 'Produtor',
      };
      mocks.findUser.mockResolvedValue(existingUserRecord);

      // Second call (idempotency check)
      const result = await provisionUser({
        username: 'paraiba',
        password: 'melhorprofessor',
      });

      // MUST NOT try to sign up again via Better Auth
      expect(mocks.signUpEmail).not.toHaveBeenCalled();
      // MUST update user attributes in DB
      expect(mocks.dbUpdate).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('u0000000-0000-4000-8000-000000000005');
      expect(result.username).toBe('paraiba');
      expect(result.email).toBe('paraiba@farm-fin.com');
      expect(result.role).toBe('Produtor');
    });

    it('handles multiple repeated invocations (triple execution) without data corruption or crash', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'u0000000-0000-4000-8000-000000000005',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });

      // Run 3 consecutive calls
      const r1 = await provisionUser({ username: 'paraiba', password: 'melhorprofessor' });
      const r2 = await provisionUser({ username: 'paraiba', password: 'melhorprofessor' });
      const r3 = await provisionUser({ username: 'paraiba', password: 'melhorprofessor' });

      expect(r1.id).toBe('u0000000-0000-4000-8000-000000000005');
      expect(r2.id).toBe('u0000000-0000-4000-8000-000000000005');
      expect(r3.id).toBe('u0000000-0000-4000-8000-000000000005');
      expect(mocks.signUpEmail).not.toHaveBeenCalled();
    });

    it('normalizes casing and whitespace on provisionUser inputs', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'u0000000-0000-4000-8000-000000000005',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });

      const result = await provisionUser({
        username: '   PARAIBA   ',
        email: '   PARAIBA@FARM-FIN.COM   ',
        password: 'melhorprofessor',
      });

      expect(result.username).toBe('paraiba');
      expect(result.email).toBe('paraiba@farm-fin.com');
    });

    it('handles Better Auth "already exists" / 422 error gracefully', async () => {
      mocks.findUser.mockResolvedValue(null);
      mocks.signUpEmail.mockRejectedValue({
        status: 422,
        message: 'User already exists',
      });

      const result = await provisionUser({
        username: 'paraiba',
        password: 'melhorprofessor',
      });

      expect(result.username).toBe('paraiba');
      expect(result.email).toBe('paraiba@farm-fin.com');
    });

    it('propagates clean error when PostgreSQL connection is refused (ECONNREFUSED)', async () => {
      mocks.dbInsert.mockImplementation(() => {
        throw { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:5432' };
      });

      await expect(
        provisionUser({ username: 'paraiba', password: 'melhorprofessor' })
      ).rejects.toThrow('Banco de dados PostgreSQL não acessível. Nenhum usuário foi criado.');
    });
  });

  describe('3. registerUserAction Adversarial Collision & Edge Case Testing', () => {
    it('detects and rejects duplicate username when email is different', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'existing-id-1',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });

      const res = await registerUserAction({
        name: 'Attacker',
        username: 'paraiba', // SAME USERNAME
        email: 'attacker@other-domain.com', // DIFFERENT EMAIL
        password: 'password123',
        organizationName: 'Fazenda Fake',
        role: 'Produtor',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Este nome de usuário já está em uso.');
      expect(mocks.dbUpdate).not.toHaveBeenCalled();
    });

    it('detects and rejects duplicate email when username is different', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'existing-id-1',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });

      const res = await registerUserAction({
        name: 'Attacker',
        username: 'other_username', // DIFFERENT USERNAME
        email: 'paraiba@farm-fin.com', // SAME EMAIL
        password: 'password123',
        organizationName: 'Fazenda Fake',
        role: 'Produtor',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Este e-mail já está cadastrado.');
      expect(mocks.dbUpdate).not.toHaveBeenCalled();
    });

    it('normalizes uppercase username input and prevents case-variant collision', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'existing-id-1',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });

      const res = await registerUserAction({
        name: 'Attacker',
        username: 'PARAIBA', // UPPERCASE
        email: 'attacker@other-domain.com',
        password: 'password123',
        organizationName: 'Fazenda Fake',
        role: 'Produtor',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Este nome de usuário já está em uso.');
    });

    it('succeeds when both email and username match the legitimate registered user', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'legit-user-id',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });

      const res = await registerUserAction({
        name: 'Professor Paraíba',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
        password: 'melhorprofessor',
        organizationName: 'Fazenda Santa Fé',
        role: 'Produtor',
      });

      expect(res.success).toBe(true);
      expect(res.user?.username).toBe('paraiba');
      expect(res.user?.email).toBe('paraiba@farm-fin.com');
      expect(res.organization?.name).toBe('Fazenda Santa Fé');
      expect(mocks.dbUpdate).toHaveBeenCalled();
    });

    it('fails gracefully when user account was not created beforehand', async () => {
      mocks.findUser.mockResolvedValue(null);

      const res = await registerUserAction({
        name: 'Ghost User',
        username: 'ghost_user',
        email: 'ghost@example.com',
        password: 'password123',
        organizationName: 'Fazenda Fantasma',
        role: 'Produtor',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe(
        'Não foi possível finalizar o cadastro agora. Tente novamente em instantes.'
      );
    });

    it('handles PostgreSQL unique constraint violation (code 23505) for username', async () => {
      // Simulate findFirst returning user, but concurrent race condition throws 23505 on update
      mocks.findUser.mockResolvedValue({
        id: 'race-user-id',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });

      mocks.dbUpdate.mockImplementation(() => {
        throw {
          code: '23505',
          message: 'duplicate key value violates unique constraint "users_username_unique"',
        };
      });

      const res = await registerUserAction({
        name: 'Professor Paraíba',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
        password: 'melhorprofessor',
        organizationName: 'Fazenda Santa Fé',
        role: 'Produtor',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Este nome de usuário já está em uso.');
    });

    it('handles PostgreSQL unique constraint violation (code 23505) for email', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'race-user-id',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });

      mocks.dbUpdate.mockImplementation(() => {
        throw {
          code: '23505',
          message: 'duplicate key value violates unique constraint "users_email_unique"',
        };
      });

      const res = await registerUserAction({
        name: 'Professor Paraíba',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
        password: 'melhorprofessor',
        organizationName: 'Fazenda Santa Fé',
        role: 'Produtor',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Este e-mail já está cadastrado.');
    });
  });

  describe('4. Input Schema Boundaries & Malformed / Adversarial Usernames', () => {
    const baseValid = {
      name: 'Test User',
      email: 'test@farm-fin.com',
      password: 'password123',
      organizationName: 'Fazenda Teste',
      role: 'Produtor' as const,
    };

    it('rejects usernames that violate length boundaries (< 3 or > 30)', () => {
      expect(registerSchema.safeParse({ ...baseValid, username: 'ab' }).success).toBe(false);
      expect(registerSchema.safeParse({ ...baseValid, username: 'a'.repeat(31) }).success).toBe(false);
      expect(registerSchema.safeParse({ ...baseValid, username: 'abc' }).success).toBe(true);
      expect(registerSchema.safeParse({ ...baseValid, username: 'a'.repeat(30) }).success).toBe(true);
    });

    it('rejects usernames with spaces, special symbols, or injection payloads', () => {
      const malicious = [
        'user name',
        'user@domain',
        'user#1',
        "admin'--",
        "' OR '1'='1",
        '<script>alert(1)</script>',
        'user/name',
        'user\\name',
        'user+name',
      ];

      for (const payload of malicious) {
        const parsed = registerSchema.safeParse({ ...baseValid, username: payload });
        expect(parsed.success).toBe(false);
      }
    });

    it('accepts legitimate alphanumeric characters, dots, hyphens, and underscores', () => {
      const validUsernames = [
        'paraiba',
        'professor.paraiba',
        'paraiba-agro',
        'paraiba_agro_2026',
        'user.name-123_ok',
      ];

      for (const u of validUsernames) {
        const parsed = registerSchema.safeParse({ ...baseValid, username: u });
        expect(parsed.success).toBe(true);
      }
    });
  });
});
