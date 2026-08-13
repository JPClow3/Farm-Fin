'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  CircleDollarSign,
  Building2,
  Package,
  Sprout,
  FileSpreadsheet,
  Landmark,
  FolderKanban,
  Settings,
  Tractor,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  href: string;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

interface NavSection {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { kpis } = useFarm();

  const sections: NavSection[] = [
    {
      title: 'Principal',
      items: [
        {
          href: '/',
          label: 'Dashboard',
          icon: <LayoutDashboard size={18} strokeWidth={2.2} />,
        },
        {
          href: '/fluxo-de-caixa',
          label: 'Fluxo de Caixa',
          icon: <TrendingUp size={18} strokeWidth={2.2} />,
        },
      ],
    },
    {
      title: 'Financeiro',
      items: [
        {
          href: '/contas-a-pagar',
          label: 'Contas a Pagar',
          icon: <CreditCard size={18} strokeWidth={2.2} />,
          badgeCount: kpis.overduePayablesCount > 0 ? kpis.overduePayablesCount : undefined,
        },
        {
          href: '/contas-a-receber',
          label: 'Contas a Receber',
          icon: <CircleDollarSign size={18} strokeWidth={2.2} />,
        },
        {
          href: '/conciliacao',
          label: 'Conciliação Bancária',
          icon: <Building2 size={18} strokeWidth={2.2} />,
        },
      ],
    },
    {
      title: 'Operacional & Custos',
      items: [
        {
          href: '/estoque',
          label: 'Estoque de Insumos',
          icon: <Package size={18} strokeWidth={2.2} />,
          badgeCount: kpis.lowStockCount > 0 ? kpis.lowStockCount : undefined,
        },
        {
          href: '/custos',
          label: 'Custo por Talhão',
          icon: <Sprout size={18} strokeWidth={2.2} />,
        },
      ],
    },
    {
      title: 'Contábil & Fiscal',
      items: [
        {
          href: '/dre',
          label: 'DRE Agrícola',
          icon: <FileSpreadsheet size={18} strokeWidth={2.2} />,
        },
        {
          href: '/lcdpr',
          label: 'LCDPR (Receita Federal)',
          icon: <Landmark size={18} strokeWidth={2.2} />,
        },
      ],
    },
    {
      title: 'Sistema',
      items: [
        {
          href: '/cadastros',
          label: 'Cadastros Base',
          icon: <FolderKanban size={18} strokeWidth={2.2} />,
        },
        {
          href: '/configuracoes',
          label: 'Configurações',
          icon: <Settings size={18} strokeWidth={2.2} />,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 'calc(var(--z-sticky) - 1)', backdropFilter: 'blur(3px)' }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <Tractor size={24} color="#ffffff" strokeWidth={2.2} />
          </div>
          <div>
            <div className="sidebar__logo-text">Farm-Fin</div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
              Gestão Financeira Agro
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
          {sections.map((sec) => (
            <div key={sec.title} className="flex-col" style={{ gap: '2px' }}>
              <div className="sidebar__section-label">{sec.title}</div>
              {sec.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="nav-item__icon">{item.icon}</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                    {item.badgeCount !== undefined && (
                      <span className="nav-item__badge" style={{ flexShrink: 0 }}>{item.badgeCount}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid rgba(212, 201, 186, 0.4)',
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
          }}
        >
          Farm-Fin v1.0 • Safra 25/26
        </div>
      </aside>
    </>
  );
};
