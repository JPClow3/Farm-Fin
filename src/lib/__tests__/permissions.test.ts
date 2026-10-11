// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  AppModule,
  PermissionLevel,
  getModulePermission,
  hasPermission,
  canViewModule,
  canManageModule,
  PermissionError,
  MODULE_LABELS,
} from '../permissions';
import { UserRoleType } from '@/lib/types';

describe('RBAC Permissions Matrix (src/lib/permissions.ts)', () => {
  const ALL_ROLES: UserRoleType[] = ['Produtor', 'Gestor', 'Financeiro', 'Contador', 'Operador'];
  const ALL_MODULES: AppModule[] = [
    'dashboard',
    'cadastros',
    'contas-a-pagar',
    'contas-a-receber',
    'fluxo-de-caixa',
    'conciliacao',
    'estoque',
    'custos',
    'dre',
    'lcdpr',
    'configuracoes',
    'processador-nf',
  ];

  // Expected 5x12 permission matrix definition
  const EXPECTED_PERMISSIONS: Record<UserRoleType, Record<AppModule, PermissionLevel>> = {
    Produtor: {
      dashboard: 'manage',
      cadastros: 'manage',
      'contas-a-pagar': 'manage',
      'contas-a-receber': 'manage',
      'fluxo-de-caixa': 'manage',
      conciliacao: 'manage',
      estoque: 'manage',
      custos: 'manage',
      dre: 'manage',
      lcdpr: 'manage',
      configuracoes: 'manage',
      'processador-nf': 'manage',
    },
    Gestor: {
      dashboard: 'manage',
      cadastros: 'manage',
      'contas-a-pagar': 'manage',
      'contas-a-receber': 'manage',
      'fluxo-de-caixa': 'manage',
      conciliacao: 'manage',
      estoque: 'manage',
      custos: 'manage',
      dre: 'manage',
      lcdpr: 'manage',
      configuracoes: 'view',
      'processador-nf': 'manage',
    },
    Financeiro: {
      dashboard: 'manage',
      cadastros: 'view',
      'contas-a-pagar': 'manage',
      'contas-a-receber': 'manage',
      'fluxo-de-caixa': 'manage',
      conciliacao: 'manage',
      estoque: 'view',
      custos: 'view',
      dre: 'manage',
      lcdpr: 'manage',
      configuracoes: 'none',
      'processador-nf': 'manage',
    },
    Contador: {
      dashboard: 'view',
      cadastros: 'view',
      'contas-a-pagar': 'view',
      'contas-a-receber': 'view',
      'fluxo-de-caixa': 'view',
      conciliacao: 'view',
      estoque: 'view',
      custos: 'view',
      dre: 'manage',
      lcdpr: 'manage',
      configuracoes: 'none',
      'processador-nf': 'view',
    },
    Operador: {
      dashboard: 'view',
      cadastros: 'view',
      'contas-a-pagar': 'none',
      'contas-a-receber': 'none',
      'fluxo-de-caixa': 'none',
      conciliacao: 'none',
      estoque: 'manage',
      custos: 'none',
      dre: 'none',
      lcdpr: 'none',
      configuracoes: 'none',
      'processador-nf': 'none',
    },
  };

  describe('1. Complete 5 Roles x 12 Modules Matrix Verification', () => {
    for (const role of ALL_ROLES) {
      describe(`Role: ${role}`, () => {
        for (const module of ALL_MODULES) {
          const expectedLevel = EXPECTED_PERMISSIONS[role][module];
          const expectedCanView = expectedLevel === 'view' || expectedLevel === 'manage';
          const expectedCanManage = expectedLevel === 'manage';

          it(`correctly resolves permission level "${expectedLevel}" for module "${module}"`, () => {
            expect(getModulePermission(role, module)).toBe(expectedLevel);
          });

          it(`correctly determines canViewModule=${expectedCanView} for module "${module}"`, () => {
            expect(canViewModule(role, module)).toBe(expectedCanView);
          });

          it(`correctly determines canManageModule=${expectedCanManage} for module "${module}"`, () => {
            expect(canManageModule(role, module)).toBe(expectedCanManage);
          });

          it(`correctly resolves hasPermission with level "${expectedLevel}"`, () => {
            expect(hasPermission(role, module, expectedLevel)).toBe(true);
            if (expectedLevel === 'none') {
              expect(hasPermission(role, module, 'view')).toBe(false);
              expect(hasPermission(role, module, 'manage')).toBe(false);
            } else if (expectedLevel === 'view') {
              expect(hasPermission(role, module, 'view')).toBe(true);
              expect(hasPermission(role, module, 'manage')).toBe(false);
            } else if (expectedLevel === 'manage') {
              expect(hasPermission(role, module, 'view')).toBe(true);
              expect(hasPermission(role, module, 'manage')).toBe(true);
            }
          });
        }
      });
    }
  });

  describe('2. Permission Invariants and Hierarchies', () => {
    it('enforces that manage permission always implies view permission across all roles and modules', () => {
      for (const role of ALL_ROLES) {
        for (const module of ALL_MODULES) {
          if (canManageModule(role, module)) {
            expect(canViewModule(role, module)).toBe(true);
          }
        }
      }
    });

    it('enforces that required="none" is satisfied by any permission level', () => {
      for (const role of ALL_ROLES) {
        for (const module of ALL_MODULES) {
          expect(hasPermission(role, module, 'none')).toBe(true);
        }
      }
    });

    it('defaults required level to "view" when omitted in hasPermission', () => {
      for (const role of ALL_ROLES) {
        for (const module of ALL_MODULES) {
          expect(hasPermission(role, module)).toBe(canViewModule(role, module));
        }
      }
    });

    it('returns "none" and denies access for invalid or unknown roles and modules', () => {
      expect(getModulePermission('Desconhecido' as UserRoleType, 'dashboard')).toBe('none');
      expect(getModulePermission('Produtor', 'unknown-module' as AppModule)).toBe('none');
      expect(canViewModule('Desconhecido' as UserRoleType, 'dashboard')).toBe(false);
      expect(canManageModule('Produtor', 'unknown-module' as AppModule)).toBe(false);
      expect(hasPermission('Desconhecido' as UserRoleType, 'dashboard', 'view')).toBe(false);
    });
  });

  describe('3. Role-Specific Business Logic Constraints', () => {
    it('grants Produtor full manage access across all 12 modules without exception', () => {
      for (const module of ALL_MODULES) {
        expect(canManageModule('Produtor', module)).toBe(true);
      }
    });

    it('restricts Gestor to view-only for configuracoes, while managing all other 11 modules', () => {
      expect(getModulePermission('Gestor', 'configuracoes')).toBe('view');
      expect(canViewModule('Gestor', 'configuracoes')).toBe(true);
      expect(canManageModule('Gestor', 'configuracoes')).toBe(false);

      const otherModules = ALL_MODULES.filter((m) => m !== 'configuracoes');
      for (const mod of otherModules) {
        expect(canManageModule('Gestor', mod)).toBe(true);
      }
    });

    it('denies Financeiro access to configuracoes, gives view to cadastros/estoque/custos, manage to financial modules', () => {
      expect(canViewModule('Financeiro', 'configuracoes')).toBe(false);
      expect(canManageModule('Financeiro', 'configuracoes')).toBe(false);

      expect(getModulePermission('Financeiro', 'cadastros')).toBe('view');
      expect(getModulePermission('Financeiro', 'estoque')).toBe('view');
      expect(getModulePermission('Financeiro', 'custos')).toBe('view');

      expect(canManageModule('Financeiro', 'contas-a-pagar')).toBe(true);
      expect(canManageModule('Financeiro', 'contas-a-receber')).toBe(true);
      expect(canManageModule('Financeiro', 'fluxo-de-caixa')).toBe(true);
      expect(canManageModule('Financeiro', 'conciliacao')).toBe(true);
      expect(canManageModule('Financeiro', 'dre')).toBe(true);
      expect(canManageModule('Financeiro', 'lcdpr')).toBe(true);
      expect(canManageModule('Financeiro', 'processador-nf')).toBe(true);
    });

    it('grants Contador manage access to DRE and LCDPR, view access to operational and finance data, and denies configuracoes', () => {
      expect(canManageModule('Contador', 'dre')).toBe(true);
      expect(canManageModule('Contador', 'lcdpr')).toBe(true);

      expect(canManageModule('Contador', 'contas-a-pagar')).toBe(false);
      expect(canViewModule('Contador', 'contas-a-pagar')).toBe(true);
      expect(canManageModule('Contador', 'conciliacao')).toBe(false);
      expect(canViewModule('Contador', 'conciliacao')).toBe(true);

      expect(canViewModule('Contador', 'configuracoes')).toBe(false);
    });

    it('isolates Operador strictly to field operations: manage estoque, view dashboard & cadastros, none for finances & configs', () => {
      expect(canManageModule('Operador', 'estoque')).toBe(true);
      expect(canViewModule('Operador', 'dashboard')).toBe(true);
      expect(canViewModule('Operador', 'cadastros')).toBe(true);
      expect(canManageModule('Operador', 'dashboard')).toBe(false);
      expect(canManageModule('Operador', 'cadastros')).toBe(false);

      const deniedModules: AppModule[] = [
        'contas-a-pagar',
        'contas-a-receber',
        'fluxo-de-caixa',
        'conciliacao',
        'custos',
        'dre',
        'lcdpr',
        'configuracoes',
        'processador-nf',
      ];
      for (const mod of deniedModules) {
        expect(canViewModule('Operador', mod)).toBe(false);
        expect(canManageModule('Operador', mod)).toBe(false);
        expect(getModulePermission('Operador', mod)).toBe('none');
      }
    });
  });

  describe('4. PermissionError Class', () => {
    it('creates an instance of Error with correct name and message for manage level', () => {
      const err = new PermissionError('contas-a-pagar', 'manage', 'Operador');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(PermissionError);
      expect(err.name).toBe('PermissionError');
      expect(err.message).toBe(
        'Acesso negado: seu perfil (Operador) não tem permissão para gerenciar o módulo "contas-a-pagar".'
      );
    });

    it('creates correct message for view level', () => {
      const err = new PermissionError('configuracoes', 'view', 'Financeiro');
      expect(err.message).toBe(
        'Acesso negado: seu perfil (Financeiro) não tem permissão para visualizar o módulo "configuracoes".'
      );
    });
  });

  describe('5. MODULE_LABELS Mapping', () => {
    it('contains friendly Portuguese labels for all 12 modules', () => {
      for (const mod of ALL_MODULES) {
        expect(MODULE_LABELS[mod]).toBeDefined();
        expect(typeof MODULE_LABELS[mod]).toBe('string');
        expect(MODULE_LABELS[mod].length).toBeGreaterThan(0);
      }
      expect(MODULE_LABELS['contas-a-pagar']).toBe('Contas a Pagar');
      expect(MODULE_LABELS['processador-nf']).toBe('Processador de NF (IA)');
      expect(MODULE_LABELS['dre']).toBe('DRE Agrícola');
    });
  });
});
