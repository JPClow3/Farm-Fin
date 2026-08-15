import { UserRoleType } from '@/lib/types';

// NOTE: this module must stay free of server-only imports (e.g. next/headers via
// src/lib/session.ts) - it's imported by client components like Sidebar for nav
// filtering. The session-aware guard lives in src/lib/permissionGuard.ts instead.

export type AppModule =
  | 'dashboard'
  | 'cadastros'
  | 'contas-a-pagar'
  | 'contas-a-receber'
  | 'fluxo-de-caixa'
  | 'conciliacao'
  | 'estoque'
  | 'custos'
  | 'dre'
  | 'lcdpr'
  | 'configuracoes';

export type PermissionLevel = 'none' | 'view' | 'manage';

const LEVEL_RANK: Record<PermissionLevel, number> = { none: 0, view: 1, manage: 2 };

/**
 * Module access matrix by role. 'manage' implies 'view'.
 *
 * Produtor  - owner, full access everywhere.
 * Gestor    - operational + financial manager, no user/role administration.
 * Financeiro- manages the financial modules, read-only elsewhere.
 * Contador  - read-only everywhere (can still generate/export LCDPR & DRE, which are read operations).
 * Operador  - manages field/stock operations only, no access to financial modules.
 */
const PERMISSION_MATRIX: Record<UserRoleType, Record<AppModule, PermissionLevel>> = {
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
    dre: 'manage', // export/generate is allowed, it does not mutate business data
    lcdpr: 'manage',
    configuracoes: 'none',
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
  },
};

export function getModulePermission(role: UserRoleType, module: AppModule): PermissionLevel {
  return PERMISSION_MATRIX[role]?.[module] ?? 'none';
}

export function hasPermission(
  role: UserRoleType,
  module: AppModule,
  required: PermissionLevel = 'view'
): boolean {
  return LEVEL_RANK[getModulePermission(role, module)] >= LEVEL_RANK[required];
}

export function canViewModule(role: UserRoleType, module: AppModule): boolean {
  return hasPermission(role, module, 'view');
}

export function canManageModule(role: UserRoleType, module: AppModule): boolean {
  return hasPermission(role, module, 'manage');
}

export class PermissionError extends Error {
  constructor(module: AppModule, level: PermissionLevel, role: UserRoleType) {
    super(
      `Acesso negado: seu perfil (${role}) não tem permissão para ${
        level === 'manage' ? 'gerenciar' : 'visualizar'
      } o módulo "${module}".`
    );
    this.name = 'PermissionError';
  }
}

export const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: 'Dashboard',
  cadastros: 'Cadastros',
  'contas-a-pagar': 'Contas a Pagar',
  'contas-a-receber': 'Contas a Receber',
  'fluxo-de-caixa': 'Fluxo de Caixa',
  conciliacao: 'Conciliação Bancária',
  estoque: 'Estoque de Insumos',
  custos: 'Custos',
  dre: 'DRE Agrícola',
  lcdpr: 'LCDPR',
  configuracoes: 'Configurações',
};
