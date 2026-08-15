import { AppModule } from './permissions';

export interface NavRouteConfig {
  href: string;
  label: string;
  module: AppModule;
}

export interface NavSectionConfig {
  title: string;
  items: NavRouteConfig[];
}

// Single source of truth for "Section > Page" breadcrumb context. Mirrors
// Sidebar.tsx's section/label structure (kept separate since Sidebar's own
// list also carries icons and live badge counts).
export const NAV_SECTIONS: NavSectionConfig[] = [
  {
    title: 'Principal',
    items: [
      { href: '/', label: 'Dashboard', module: 'dashboard' },
      { href: '/fluxo-de-caixa', label: 'Fluxo de Caixa', module: 'fluxo-de-caixa' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { href: '/contas-a-pagar', label: 'Contas a Pagar', module: 'contas-a-pagar' },
      { href: '/contas-a-receber', label: 'Contas a Receber', module: 'contas-a-receber' },
      { href: '/conciliacao', label: 'Conciliação Bancária', module: 'conciliacao' },
    ],
  },
  {
    title: 'Operacional & Custos',
    items: [
      { href: '/estoque', label: 'Estoque de Insumos', module: 'estoque' },
      { href: '/custos', label: 'Custo por Talhão', module: 'custos' },
    ],
  },
  {
    title: 'Contábil & Fiscal',
    items: [
      { href: '/dre', label: 'DRE Agrícola', module: 'dre' },
      { href: '/lcdpr', label: 'LCDPR (Receita Federal)', module: 'lcdpr' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/cadastros', label: 'Cadastros Base', module: 'cadastros' },
      { href: '/configuracoes', label: 'Configurações', module: 'configuracoes' },
    ],
  },
];

export function findNavContext(pathname: string): { section: string; item: NavRouteConfig } | null {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((i) => i.href === pathname);
    if (item) return { section: section.title, item };
  }
  return null;
}
