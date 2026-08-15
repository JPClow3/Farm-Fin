import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_WIDGET_CONFIGS,
  loadDashboardWidgetConfigs,
  saveDashboardWidgetConfigs,
  resetDashboardWidgetConfigs,
  WIDGET_STORAGE_KEY,
  DashboardWidgetConfig,
} from '../dashboardWidgets';

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof global.localStorage === 'undefined' || !global.localStorage?.clear) {
  Object.defineProperty(global, 'localStorage', {
    value: storageMock,
    writable: true,
  });
}

describe('Dashboard Widgets Registry & Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default widget configs when localStorage is empty', () => {
    const configs = loadDashboardWidgetConfigs();
    expect(configs).toBeDefined();
    expect(configs.length).toBe(DEFAULT_WIDGET_CONFIGS.length);
    expect(configs.map((c) => c.id)).toContain('kpi_cards');
    expect(configs.map((c) => c.id)).toContain('alerts_panel');
    expect(configs.map((c) => c.id)).toContain('quick_actions');
  });

  it('saves and loads custom widget configurations', () => {
    const customConfigs: DashboardWidgetConfig[] = [
      {
        id: 'alerts_panel',
        title: 'Painel de Alertas Prioritários (Top 5)',
        description: 'Alertas críticos',
        category: 'alerts',
        isVisible: true,
        order: 0,
        columnSpan: 'full',
      },
      {
        id: 'kpi_cards',
        title: 'Indicadores Chave (KPIs)',
        description: 'Resumo executivo',
        category: 'kpi',
        isVisible: false,
        order: 1,
        columnSpan: 'half',
      },
    ];

    saveDashboardWidgetConfigs(customConfigs);

    const loaded = loadDashboardWidgetConfigs();
    expect(loaded[0].id).toBe('alerts_panel');
    expect(loaded[0].order).toBe(0);

    const kpiWidget = loaded.find((w) => w.id === 'kpi_cards');
    expect(kpiWidget?.isVisible).toBe(false);
    expect(kpiWidget?.columnSpan).toBe('half');
  });

  it('resets widget configurations back to defaults', () => {
    const customConfigs: DashboardWidgetConfig[] = [
      {
        id: 'alerts_panel',
        title: 'Alerts',
        description: 'Desc',
        category: 'alerts',
        isVisible: false,
        order: 0,
        columnSpan: 'half',
      },
    ];

    saveDashboardWidgetConfigs(customConfigs);
    expect(localStorage.getItem(WIDGET_STORAGE_KEY)).not.toBeNull();

    const resetResult = resetDashboardWidgetConfigs();
    expect(resetResult).toEqual(DEFAULT_WIDGET_CONFIGS);
    expect(localStorage.getItem(WIDGET_STORAGE_KEY)).toBeNull();
  });
});
