export type DashboardWidgetId =
  | 'kpi_cards'
  | 'alerts_panel'
  | 'cash_flow_chart'
  | 'cost_breakdown_chart'
  | 'upcoming_payables'
  | 'upcoming_receivables'
  | 'farm_fields'
  | 'quick_actions';

export type WidgetCategory = 'kpi' | 'alerts' | 'charts' | 'tables' | 'operations';

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  title: string;
  description: string;
  category: WidgetCategory;
  isVisible: boolean;
  order: number;
  columnSpan: 'full' | 'half';
  isDraggable?: boolean;
}

export const WIDGET_STORAGE_KEY = 'farmfin_dashboard_widgets_v2';

export const DEFAULT_WIDGET_CONFIGS: DashboardWidgetConfig[] = [
  {
    id: 'kpi_cards',
    title: 'Indicadores Chave (KPIs)',
    description: 'Resumo executivo de contas a receber, a pagar, saldo em caixa e margem agrícola.',
    category: 'kpi',
    isVisible: true,
    order: 0,
    columnSpan: 'full',
  },
  {
    id: 'alerts_panel',
    title: 'Painel de Alertas Prioritários (Top 5)',
    description: 'Alertas críticos consolidados de vencimentos, aprovações, estoque e fixação.',
    category: 'alerts',
    isVisible: true,
    order: 1,
    columnSpan: 'full',
  },
  {
    id: 'cash_flow_chart',
    title: 'Fluxo de Caixa Mensal',
    description: 'Comparativo de entradas vs saídas e projeção de liquidez.',
    category: 'charts',
    isVisible: true,
    order: 2,
    columnSpan: 'half',
  },
  {
    id: 'cost_breakdown_chart',
    title: 'Alocação de Custos',
    description: 'Distribuição percentual de despesas por categoria na safra.',
    category: 'charts',
    isVisible: true,
    order: 3,
    columnSpan: 'half',
  },
  {
    id: 'quick_actions',
    title: 'Ações Rápidas',
    description: 'Atalhos operacionais diretos para lançamentos, vendas e estoque.',
    category: 'operations',
    isVisible: true,
    order: 4,
    columnSpan: 'full',
  },
  {
    id: 'upcoming_payables',
    title: 'Próximos Vencimentos a Pagar',
    description: 'Contas com vencimento imediato e atalho para baixa direta.',
    category: 'tables',
    isVisible: true,
    order: 5,
    columnSpan: 'half',
  },
  {
    id: 'upcoming_receivables',
    title: 'Próximos Recebimentos & Grãos',
    description: 'Contratos futuros, vendas spot e status de fixação/barter.',
    category: 'tables',
    isVisible: true,
    order: 6,
    columnSpan: 'half',
  },
  {
    id: 'farm_fields',
    title: 'Talhões da Propriedade',
    description: 'Visão dos talhões cadastrados, área total e culturas semeadas.',
    category: 'tables',
    isVisible: true,
    order: 7,
    columnSpan: 'full',
  },
];

/**
 * Loads saved widget configurations from localStorage, falling back to defaults
 * and preserving any newly introduced widgets.
 */
export function loadDashboardWidgetConfigs(): DashboardWidgetConfig[] {
  if (typeof window === 'undefined') {
    return DEFAULT_WIDGET_CONFIGS;
  }

  try {
    const raw = localStorage.getItem(WIDGET_STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGET_CONFIGS;

    const saved: Partial<DashboardWidgetConfig>[] = JSON.parse(raw);
    if (!Array.isArray(saved)) return DEFAULT_WIDGET_CONFIGS;

    // Merge saved configs with default registry
    const defaultMap = new Map(DEFAULT_WIDGET_CONFIGS.map((w) => [w.id, w]));
    const merged: DashboardWidgetConfig[] = [];

    saved.forEach((item) => {
      if (item.id && defaultMap.has(item.id as DashboardWidgetId)) {
        const def = defaultMap.get(item.id as DashboardWidgetId)!;
        merged.push({
          ...def,
          isVisible: item.isVisible !== undefined ? Boolean(item.isVisible) : def.isVisible,
          order: typeof item.order === 'number' ? item.order : def.order,
          columnSpan: item.columnSpan || def.columnSpan,
        });
        defaultMap.delete(item.id as DashboardWidgetId);
      }
    });

    // Append any newly added default widgets that weren't in localStorage
    defaultMap.forEach((def) => {
      merged.push({ ...def, order: merged.length });
    });

    return merged.sort((a, b) => a.order - b.order);
  } catch (e) {
    console.warn('[dashboardWidgets] Error loading configs from localStorage:', e);
    return DEFAULT_WIDGET_CONFIGS;
  }
}

/**
 * Persists widget configurations into localStorage.
 */
export function saveDashboardWidgetConfigs(configs: DashboardWidgetConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(configs));
  } catch (e) {
    console.error('[dashboardWidgets] Failed to save widget configs:', e);
  }
}

/**
 * Resets widget configurations back to factory defaults.
 */
export function resetDashboardWidgetConfigs(): DashboardWidgetConfig[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(WIDGET_STORAGE_KEY);
    } catch {}
  }
  return DEFAULT_WIDGET_CONFIGS;
}
