import { beforeEach, describe, it, expect, vi } from 'vitest';
import { registerUserAction, getAuthSessionAction } from '../auth';
import { registerSchema } from '../../lib/validations/auth.schema';

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

describe('Auth Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUser.mockResolvedValue({
      id: 'user-existing',
      name: 'Mariana Gestora',
      username: 'mariana.gestora',
      email: 'mariana@fazendasantafe.com.br',
    });
    mocks.insert.mockImplementation(() => {
      const operation = Object.assign(Promise.resolve([]), {
        returning: vi.fn().mockResolvedValue([{ id: 'organization-new' }]),
      }) as unknown as Promise<unknown[]> & {
        returning: () => Promise<Array<{ id: string }>>;
      };
      return { values: () => operation };
    });
    mocks.update.mockReturnValue({ set: () => ({ where: vi.fn().mockResolvedValue([]) }) });
    mocks.getSession.mockResolvedValue({
      isAuthenticated: true,
      user: { id: 'user-existing', email: 'maria@example.com' },
    });
  });

  it('validates registerSchema successfully with valid data including username', () => {
    const validData = {
      name: 'João Produtor',
      username: 'joao.produtor',
      email: 'joao@fazendanova.com.br',
      password: 'password123',
      organizationName: 'Fazenda Nova Esperança',
      role: 'Produtor' as const,
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe('joao.produtor');
    }
  });

  it('normalizes username to lowercase and trims whitespace in registerSchema', () => {
    const validData = {
      name: 'João Produtor',
      username: '  Paraiba_Agro.2026  ',
      email: 'joao@fazendanova.com.br',
      password: 'password123',
      organizationName: 'Fazenda Nova Esperança',
      role: 'Produtor' as const,
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe('paraiba_agro.2026');
    }
  });

  it('rejects registerSchema with invalid username formats', () => {
    // Too short (< 3)
    const shortResult = registerSchema.safeParse({
      name: 'João Produtor',
      username: 'ab',
      email: 'joao@fazendanova.com.br',
      password: 'password123',
      organizationName: 'Fazenda Nova Esperança',
      role: 'Produtor' as const,
    });
    expect(shortResult.success).toBe(false);

    // Invalid characters (spaces, @, special symbols)
    const invalidCharResult = registerSchema.safeParse({
      name: 'João Produtor',
      username: 'joao produtor!',
      email: 'joao@fazendanova.com.br',
      password: 'password123',
      organizationName: 'Fazenda Nova Esperança',
      role: 'Produtor' as const,
    });
    expect(invalidCharResult.success).toBe(false);

    // Too long (> 30)
    const longResult = registerSchema.safeParse({
      name: 'João Produtor',
      username: 'a'.repeat(31),
      email: 'joao@fazendanova.com.br',
      password: 'password123',
      organizationName: 'Fazenda Nova Esperança',
      role: 'Produtor' as const,
    });
    expect(longResult.success).toBe(false);
  });

  it('rejects registerSchema with missing username, invalid email and short password', () => {
    const invalidData = {
      name: 'J',
      username: '',
      email: 'not-an-email',
      password: '123',
      organizationName: '',
      role: 'Produtor' as const,
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('attaches the authenticated user to a new tenant with its username', async () => {
    const input = {
      name: 'Mariana Gestora',
      username: 'mariana.gestora',
      email: 'mariana@fazendasantafe.com.br',
      password: 'strongPassword2026',
      organizationName: 'Grupo Agrícola Santa Fé',
      role: 'Gestor' as const,
    };

    const res = await registerUserAction(input);
    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.name).toBe('Mariana Gestora');
    expect(res.user?.username).toBe('mariana.gestora');
    expect(res.user?.email).toBe('mariana@fazendasantafe.com.br');
    expect(res.user?.role).toBe('Gestor');
    expect(res.organization).toBeDefined();
    expect(res.organization?.name).toBe('Grupo Agrícola Santa Fé');
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it('rejects a username already paired with a different email', async () => {
    mocks.findUser.mockResolvedValue({
      id: 'another-user',
      username: 'mariana.gestora',
      email: 'other@example.com',
    });
    const res = await registerUserAction({
      name: 'Mariana Gestora',
      username: 'mariana.gestora',
      email: 'mariana@fazendasantafe.com.br',
      password: 'strongPassword2026',
      organizationName: 'Grupo Agrícola Santa Fé',
      role: 'Gestor',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('nome de usuário');
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('reports database errors instead of pretending registration succeeded', async () => {
    mocks.findUser.mockRejectedValue(new Error('database unavailable'));
    const res = await registerUserAction({
      name: 'Mariana Gestora',
      username: 'mariana.gestora',
      email: 'mariana@fazendasantafe.com.br',
      password: 'strongPassword2026',
      organizationName: 'Grupo Agrícola Santa Fé',
      role: 'Gestor',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Não foi possível finalizar o cadastro');
  });

  it('rejects registerUserAction with invalid input', async () => {
    const input = {
      name: 'M',
      username: 'm',
      email: 'invalid-email',
      password: '123',
      organizationName: '',
      role: 'Gestor' as const,
    };

    const res = await registerUserAction(input);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('retrieves auth session via getAuthSessionAction', async () => {
    const session = await getAuthSessionAction();
    expect(session).toBeDefined();
    expect(session.isAuthenticated).toBe(true);
    expect(session.user).toHaveProperty('id');
    expect(session.user).toHaveProperty('email');
  });

});
