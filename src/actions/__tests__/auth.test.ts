import { describe, it, expect } from 'vitest';
import { registerUserAction, registerSchema, getAuthSessionAction } from '../auth';

describe('Auth Server Actions', () => {
  it('validates registerSchema successfully with valid data', () => {
    const validData = {
      name: 'João Produtor',
      email: 'joao@fazendanova.com.br',
      password: 'password123',
      organizationName: 'Fazenda Nova Esperança',
      role: 'Produtor' as const,
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects registerSchema with invalid email and short password', () => {
    const invalidData = {
      name: 'J',
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

  it('executes registerUserAction and returns tenant user and organization', async () => {
    const input = {
      name: 'Mariana Gestora',
      email: 'mariana@fazendasantafe.com.br',
      password: 'strongPassword2026',
      organizationName: 'Grupo Agrícola Santa Fé',
      role: 'Gestor' as const,
    };

    const res = await registerUserAction(input);
    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.name).toBe('Mariana Gestora');
    expect(res.user?.email).toBe('mariana@fazendasantafe.com.br');
    expect(res.user?.role).toBe('Gestor');
    expect(res.organization).toBeDefined();
    expect(res.organization?.name).toBe('Grupo Agrícola Santa Fé');
  });

  it('retrieves auth session via getAuthSessionAction', async () => {
    const session = await getAuthSessionAction();
    expect(session).toBeDefined();
    expect(session.isAuthenticated).toBe(true);
    expect(session.user).toHaveProperty('id');
    expect(session.user).toHaveProperty('email');
  });
});
