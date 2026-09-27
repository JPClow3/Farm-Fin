// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireModuleAccess } from '../permissionGuard';
import { PermissionError } from '../permissions';
import * as sessionModule from '@/lib/session';
import { UserRoleType } from '@/lib/types';

vi.mock('@/lib/session', () => ({
  getCurrentSession: vi.fn(),
}));

describe('Server Action Guard: requireModuleAccess (src/lib/permissionGuard.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockSessionWithRole(role: UserRoleType, userId: string = 'user-123', orgId: string = 'org-456') {
    vi.mocked(sessionModule.getCurrentSession).mockResolvedValue({
      user: {
        id: userId,
        organizationId: orgId,
        name: `Test ${role}`,
        email: `${role.toLowerCase()}@farm-fin.com`,
        role,
      },
      organizationId: orgId,
      role,
      isAuthenticated: true,
    });
  }

  it('allows Produtor to access any module at manage level and returns full session', async () => {
    mockSessionWithRole('Produtor');

    const session = await requireModuleAccess('contas-a-pagar', 'manage');
    expect(session).toBeDefined();
    expect(session.role).toBe('Produtor');
    expect(session.user.id).toBe('user-123');

    const configSession = await requireModuleAccess('configuracoes', 'manage');
    expect(configSession.organizationId).toBe('org-456');
  });

  it('defaults required level to "manage" when level is omitted', async () => {
    mockSessionWithRole('Operador');

    // Operador has 'view' on dashboard, but default is 'manage', so it should throw
    await expect(requireModuleAccess('dashboard')).rejects.toThrow(PermissionError);

    // Operador has 'manage' on estoque, so it should succeed
    const session = await requireModuleAccess('estoque');
    expect(session.role).toBe('Operador');
  });

  it('allows Gestor to manage operational/financial modules but blocks managing configuracoes', async () => {
    mockSessionWithRole('Gestor');

    const session = await requireModuleAccess('contas-a-receber', 'manage');
    expect(session.role).toBe('Gestor');

    // Gestor can view configuracoes
    const viewSession = await requireModuleAccess('configuracoes', 'view');
    expect(viewSession.role).toBe('Gestor');

    // Gestor cannot manage configuracoes
    await expect(requireModuleAccess('configuracoes', 'manage')).rejects.toThrow(
      'Acesso negado: seu perfil (Gestor) não tem permissão para gerenciar o módulo "configuracoes".'
    );
  });

  it('allows Financeiro to manage financial modules and blocks access to configuracoes', async () => {
    mockSessionWithRole('Financeiro');

    const session = await requireModuleAccess('fluxo-de-caixa', 'manage');
    expect(session.role).toBe('Financeiro');

    await expect(requireModuleAccess('configuracoes', 'view')).rejects.toThrow(PermissionError);
    await expect(requireModuleAccess('configuracoes', 'manage')).rejects.toThrow(PermissionError);
  });

  it('allows Contador to view financial modules, manage DRE/LCDPR, but blocks managing contas-a-pagar', async () => {
    mockSessionWithRole('Contador');

    // Contador can manage DRE and LCDPR
    const dreSession = await requireModuleAccess('dre', 'manage');
    expect(dreSession.role).toBe('Contador');

    const lcdprSession = await requireModuleAccess('lcdpr', 'manage');
    expect(lcdprSession.role).toBe('Contador');

    // Contador can view contas-a-pagar
    const viewSession = await requireModuleAccess('contas-a-pagar', 'view');
    expect(viewSession.role).toBe('Contador');

    // Contador cannot manage contas-a-pagar
    await expect(requireModuleAccess('contas-a-pagar', 'manage')).rejects.toThrow(
      'Acesso negado: seu perfil (Contador) não tem permissão para gerenciar o módulo "contas-a-pagar".'
    );
  });

  it('blocks Operador from accessing financial and tax modules', async () => {
    mockSessionWithRole('Operador');

    await expect(requireModuleAccess('contas-a-pagar', 'view')).rejects.toThrow(PermissionError);
    await expect(requireModuleAccess('contas-a-receber', 'manage')).rejects.toThrow(PermissionError);
    await expect(requireModuleAccess('fluxo-de-caixa', 'view')).rejects.toThrow(PermissionError);
    await expect(requireModuleAccess('conciliacao', 'manage')).rejects.toThrow(PermissionError);
    await expect(requireModuleAccess('dre', 'view')).rejects.toThrow(PermissionError);
    await expect(requireModuleAccess('lcdpr', 'view')).rejects.toThrow(PermissionError);
    await expect(requireModuleAccess('processador-nf', 'view')).rejects.toThrow(PermissionError);
  });

  it('throws a genuine PermissionError instance with exact attributes for auditing', async () => {
    mockSessionWithRole('Operador', 'usr-op-99', 'org-agro-1');

    try {
      await requireModuleAccess('conciliacao', 'manage');
      expect.unreachable('Should have thrown PermissionError');
    } catch (err) {
      expect(err).toBeInstanceOf(PermissionError);
      expect((err as PermissionError).name).toBe('PermissionError');
      expect((err as PermissionError).message).toContain('Operador');
      expect((err as PermissionError).message).toContain('conciliacao');
      expect((err as PermissionError).message).toContain('gerenciar');
    }
  });
});
