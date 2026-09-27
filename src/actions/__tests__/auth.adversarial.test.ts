import { beforeEach, describe, it, expect, vi } from 'vitest';
import { normalizeLoginIdentifier } from '@/lib/loginIdentifier';
import { registerSchema } from '@/lib/validations/auth.schema';
import { registerUserAction } from '../auth';
import * as fs from 'node:fs';
import * as path from 'node:path';

// --- Mocks for auth server action ---
const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: { users: { findFirst: mocks.findUser } },
    insert: mocks.insert,
    update: mocks.update,
  },
}));

vi.mock('@/lib/session', () => ({ getCurrentSession: mocks.getSession }));

describe('Milestone 1 Adversarial & Empirical Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Dual Login Identifier Normalization (src/lib/loginIdentifier.ts)
  // =========================================================================
  describe('Adversarial tests: normalizeLoginIdentifier', () => {
    it('normalizes mixed-case usernames correctly to lowercase', () => {
      expect(normalizeLoginIdentifier('Paraiba')).toEqual({
        type: 'username',
        value: 'paraiba',
      });
      expect(normalizeLoginIdentifier('PARAIBA')).toEqual({
        type: 'username',
        value: 'paraiba',
      });
      expect(normalizeLoginIdentifier('pArAiBa_AgRo')).toEqual({
        type: 'username',
        value: 'paraiba_agro',
      });
    });

    it('accepts usernames with dots, hyphens, and underscores', () => {
      const validCases = [
        'paraiba.agro',
        'paraiba-agro',
        'paraiba_agro',
        'p.a-r_a',
        '123.456-789_0',
        '.leading.dot',
        '-leading-hyphen',
        '_leading_underscore',
        'user.name-123_test',
      ];
      for (const username of validCases) {
        const result = normalizeLoginIdentifier(username);
        expect(result).toEqual({ type: 'username', value: username });
      }
    });

    it('strictly enforces username length boundaries (2 reject, 3 accept, 30 accept, 31 reject)', () => {
      // 0 chars
      expect(normalizeLoginIdentifier('').type).toBe('invalid');
      // 1 char
      expect(normalizeLoginIdentifier('a').type).toBe('invalid');
      // 2 chars -> REJECT
      expect(normalizeLoginIdentifier('ab').type).toBe('invalid');
      // 3 chars -> ACCEPT
      expect(normalizeLoginIdentifier('abc')).toEqual({
        type: 'username',
        value: 'abc',
      });
      // 4 chars -> ACCEPT
      expect(normalizeLoginIdentifier('abcd')).toEqual({
        type: 'username',
        value: 'abcd',
      });
      // 30 chars -> ACCEPT
      const exactly30 = 'a'.repeat(30);
      expect(normalizeLoginIdentifier(exactly30)).toEqual({
        type: 'username',
        value: exactly30,
      });
      // 31 chars -> REJECT
      const exactly31 = 'a'.repeat(31);
      expect(normalizeLoginIdentifier(exactly31).type).toBe('invalid');
      // 100 chars -> REJECT
      expect(normalizeLoginIdentifier('a'.repeat(100)).type).toBe('invalid');
    });

    it('correctly trims whitespace padding around valid usernames', () => {
      expect(normalizeLoginIdentifier('   paraiba   ')).toEqual({
        type: 'username',
        value: 'paraiba',
      });
      expect(normalizeLoginIdentifier('\t\nparaiba\r\n')).toEqual({
        type: 'username',
        value: 'paraiba',
      });
      // Whitespace only -> REJECT
      expect(normalizeLoginIdentifier('    ').type).toBe('invalid');
      expect(normalizeLoginIdentifier('\t\r\n').type).toBe('invalid');
      // Internal whitespace -> REJECT
      expect(normalizeLoginIdentifier('para iba').type).toBe('invalid');
      expect(normalizeLoginIdentifier('  para   iba  ').type).toBe('invalid');
    });

    it('distinguishes email from username and normalizes email properly', () => {
      expect(normalizeLoginIdentifier('  Paraiba@Farm-Fin.COM  ')).toEqual({
        type: 'email',
        value: 'paraiba@farm-fin.com',
      });
      expect(normalizeLoginIdentifier('user.test+tag@domain.co.uk')).toEqual({
        type: 'email',
        value: 'user.test+tag@domain.co.uk',
      });
    });

    it('rejects malformed email formats containing @ character', () => {
      const malformedEmails = [
        'paraiba@',
        '@farm-fin.com',
        'paraiba@.com',
        'paraiba@@farm-fin.com',
        'para iba@farm-fin.com',
      ];
      for (const email of malformedEmails) {
        const res = normalizeLoginIdentifier(email);
        expect(res.type).toBe('invalid');
      }
    });

    it('rejects adversarial characters, injection attempts, and special symbols', () => {
      const injectionAttempts = [
        "paraiba' OR '1'='1",
        'admin\'--',
        '<script>alert(1)</script>',
        'paraiba; DROP TABLE users;',
        'paraiba" OR "1"="1',
        'para/iba',
        'para\\iba',
        'paraiba!',
        'paraiba#',
        'paraiba$',
        'paraiba%',
        'paraiba^',
        'paraiba&',
        'paraiba*',
        'paraiba(admin)',
        'paraiba[admin]',
        'paraiba{admin}',
        'paraiba?admin',
        'paraiba~',
        'paraiba`',
        'paraíba', // accented
        'paraiba🌾', // emoji
        'paraiba\0', // null byte
      ];
      for (const attempt of injectionAttempts) {
        const res = normalizeLoginIdentifier(attempt);
        expect(res.type).toBe('invalid');
      }
    });
  });

  // =========================================================================
  // 2. Registration Validation Schema (src/lib/validations/auth.schema.ts)
  // =========================================================================
  describe('Adversarial tests: registerSchema', () => {
    const baseValidInput = {
      name: 'Professor Paraíba',
      username: 'paraiba',
      email: 'paraiba@farm-fin.com',
      password: 'melhorprofessor',
      organizationName: 'Fazenda Santa Fé',
      role: 'Produtor' as const,
    };

    it('accepts valid credentials and preserves valid inputs', () => {
      const parsed = registerSchema.safeParse(baseValidInput);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.username).toBe('paraiba');
        expect(parsed.data.email).toBe('paraiba@farm-fin.com');
      }
    });

    it('normalizes uppercase and trims username in registerSchema', () => {
      const parsed = registerSchema.safeParse({
        ...baseValidInput,
        username: '   PARAIBA_AGRO.2026   ',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.username).toBe('paraiba_agro.2026');
      }
    });

    it('boundary: validates trimmed username length constraints (2 reject, 3 accept, 30 accept, 31 reject)', () => {
      // 2 chars -> REJECT
      const short = registerSchema.safeParse({
        ...baseValidInput,
        username: 'ab',
      });
      expect(short.success).toBe(false);

      // 2 chars padded with whitespace -> REJECT (after trim it is 2 chars)
      const shortPadded = registerSchema.safeParse({
        ...baseValidInput,
        username: '  ab  ',
      });
      expect(shortPadded.success).toBe(false);

      // 3 chars -> ACCEPT
      const minValid = registerSchema.safeParse({
        ...baseValidInput,
        username: 'abc',
      });
      expect(minValid.success).toBe(true);

      // 30 chars -> ACCEPT
      const exactly30 = 'u'.repeat(30);
      const maxValid = registerSchema.safeParse({
        ...baseValidInput,
        username: exactly30,
      });
      expect(maxValid.success).toBe(true);
      if (maxValid.success) {
        expect(maxValid.data.username).toBe(exactly30);
      }

      // 30 chars padded with whitespace -> ACCEPT (trimmed to 30)
      const maxPadded = registerSchema.safeParse({
        ...baseValidInput,
        username: `   ${exactly30}   `,
      });
      expect(maxPadded.success).toBe(true);
      if (maxPadded.success) {
        expect(maxPadded.data.username).toBe(exactly30);
      }

      // 31 chars -> REJECT
      const exactly31 = 'u'.repeat(31);
      const tooLong = registerSchema.safeParse({
        ...baseValidInput,
        username: exactly31,
      });
      expect(tooLong.success).toBe(false);
    });

    it('accepts dots, hyphens, and underscores in username', () => {
      const validUsernames = ['carlos.silva', 'carlos-silva', 'carlos_silva', 'a.b-c_123'];
      for (const u of validUsernames) {
        const parsed = registerSchema.safeParse({
          ...baseValidInput,
          username: u,
        });
        expect(parsed.success).toBe(true);
      }
    });

    it('rejects illegal characters in username', () => {
      const illegalUsernames = [
        'user name', // space
        'user@domain', // @
        'user#123', // #
        'user$123', // $
        'user!123', // !
        'user%123', // %
        'user&123', // &
        'user*123', // *
        'user/123', // /
        'user\\123', // \
        'usuário', // accent
        'user🌾', // emoji
      ];
      for (const u of illegalUsernames) {
        const parsed = registerSchema.safeParse({
          ...baseValidInput,
          username: u,
        });
        expect(parsed.success).toBe(false);
      }
    });

    it('enforces RBAC role enum values and rejects invalid roles', () => {
      const validRoles = ['Produtor', 'Gestor', 'Financeiro', 'Contador', 'Operador'] as const;
      for (const role of validRoles) {
        const parsed = registerSchema.safeParse({ ...baseValidInput, role });
        expect(parsed.success).toBe(true);
      }

      const invalidRoles = ['Admin', 'Superadmin', 'Root', 'Guest', ''];
      for (const role of invalidRoles) {
        const parsed = registerSchema.safeParse({ ...baseValidInput, role });
        expect(parsed.success).toBe(false);
      }
    });

    it('enforces password minimum length of 6 characters', () => {
      expect(registerSchema.safeParse({ ...baseValidInput, password: '12345' }).success).toBe(false);
      expect(registerSchema.safeParse({ ...baseValidInput, password: '123456' }).success).toBe(true);
    });
  });

  // =========================================================================
  // 3. Server Action (src/actions/auth.ts)
  // =========================================================================
  describe('Adversarial tests: registerUserAction', () => {
    const defaultInput = {
      name: 'Professor Paraíba',
      username: 'paraiba',
      email: 'paraiba@farm-fin.com',
      password: 'melhorprofessor',
      organizationName: 'Fazenda Santa Fé',
      role: 'Produtor' as const,
    };

    it('rejects registration when schema validation fails before touching the DB', async () => {
      const res = await registerUserAction({
        ...defaultInput,
        username: 'ab', // Invalid: < 3 chars
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain('mínimo 3 caracteres');
      expect(mocks.findUser).not.toHaveBeenCalled();
      expect(mocks.insert).not.toHaveBeenCalled();
      expect(mocks.update).not.toHaveBeenCalled();
    });

    it('normalizes username input before performing database query', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'user-paraiba-id',
        name: 'Professor Paraíba',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });
      mocks.insert.mockImplementation(() => {
        const op = Object.assign(Promise.resolve([]), {
          returning: vi.fn().mockResolvedValue([{ id: 'org-santa-fe-id', name: 'Fazenda Santa Fé' }]),
        }) as unknown as Promise<unknown[]> & { returning: () => Promise<Array<{ id: string; name: string }>> };
        return { values: () => op };
      });
      mocks.update.mockReturnValue({ set: () => ({ where: vi.fn().mockResolvedValue([]) }) });

      const res = await registerUserAction({
        ...defaultInput,
        username: '  PARAIBA  ', // Mixed case + whitespace
      });

      expect(res.success).toBe(true);
      expect(res.user?.username).toBe('paraiba');
      expect(mocks.update).toHaveBeenCalledOnce();
    });

    it('verifies D1 fix: mixed-case email during registration is accepted and normalized', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'user-paraiba-id',
        name: 'Professor Paraíba',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });
      mocks.insert.mockImplementation(() => {
        const op = Object.assign(Promise.resolve([]), {
          returning: vi.fn().mockResolvedValue([{ id: 'org-santa-fe-id', name: 'Fazenda Santa Fé' }]),
        }) as unknown as Promise<unknown[]> & { returning: () => Promise<Array<{ id: string; name: string }>> };
        return { values: () => op };
      });
      mocks.update.mockReturnValue({ set: () => ({ where: vi.fn().mockResolvedValue([]) }) });

      const res = await registerUserAction({
        ...defaultInput,
        email: 'Paraiba@farm-fin.com',
      });

      // D1 REMEDIATION VERIFICATION:
      // Case-insensitive comparison and email normalization ensures mixed-case registration succeeds
      expect(res.success).toBe(true);
      expect(res.user?.username).toBe('paraiba');
      expect(mocks.update).toHaveBeenCalledOnce();
    });

    it('prevents email collision when existing user has same email but different username', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'other-user-id',
        username: 'different_user',
        email: 'paraiba@farm-fin.com',
      });

      const res = await registerUserAction(defaultInput);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Este e-mail já está cadastrado.');
      expect(mocks.insert).not.toHaveBeenCalled();
    });

    it('prevents username collision when existing user has same username but different email', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'other-user-id',
        username: 'paraiba',
        email: 'imposter@another-domain.com',
      });

      const res = await registerUserAction(defaultInput);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Este nome de usuário já está em uso.');
      expect(mocks.insert).not.toHaveBeenCalled();
    });

    it('handles unexpected database duplicate key errors gracefully', async () => {
      mocks.findUser.mockResolvedValue({
        id: 'user-id',
        username: 'paraiba',
        email: 'paraiba@farm-fin.com',
      });
      mocks.insert.mockImplementation(() => {
        const error = new Error('duplicate key value violates unique constraint "users_username_unique"');
        Object.assign(error, { code: '23505' });
        throw error;
      });

      const res = await registerUserAction(defaultInput);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Este nome de usuário já está em uso.');
    });

    it('returns generic error on database outage without leaking stack trace', async () => {
      mocks.findUser.mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:5432'));

      const res = await registerUserAction(defaultInput);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Não foi possível finalizar o cadastro agora. Tente novamente em instantes.');
    });
  });

  // =========================================================================
  // 4. Verification: Demo Persona Selector Cards Cannot Be Rendered or Bypassed
  // =========================================================================
  describe('Adversarial verification: Demo persona cards removal & bypass resistance', () => {
    it('verifies LoginScreen.tsx has zero demo persona components or strings', () => {
      const loginScreenPath = path.resolve(process.cwd(), 'src/app/(auth)/login/LoginScreen.tsx');
      const content = fs.readFileSync(loginScreenPath, 'utf-8');

      // Check for forbidden demo phrases
      expect(content).not.toContain('Conhecer o sistema');
      expect(content).not.toContain('personaCard');
      expect(content).not.toContain('personaGrid');
      expect(content).not.toContain('DEMO_PERSONAS');
      expect(content).not.toContain('DEMO_ROLES');
      expect(content).not.toContain('quick-login');

      // Verify that no bypass link exists in LoginScreen
      expect(content).not.toContain('/api/session/demo');
    });

    it('verifies login.module.css has zero persona card styling rules', () => {
      const loginCssPath = path.resolve(process.cwd(), 'src/app/(auth)/login/login.module.css');
      const content = fs.readFileSync(loginCssPath, 'utf-8');

      expect(content).not.toContain('.persona');
      expect(content).not.toContain('.personaGrid');
      expect(content).not.toContain('.personaCard');
      expect(content).not.toContain('.personaBadge');
    });

    it('verifies that login modes only allow standard auth flows', () => {
      const loginScreenPath = path.resolve(process.cwd(), 'src/app/(auth)/login/LoginScreen.tsx');
      const content = fs.readFileSync(loginScreenPath, 'utf-8');

      // Check mode type definition
      expect(content).toContain("type Mode = 'password' | 'magicLink' | 'magicLinkSent' | 'twoFactor';");
    });
  });
});
