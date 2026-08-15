'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';
import { getAuthSessionAction } from '../../actions/auth';
import { canViewModule, AppModule } from '../../lib/permissions';
import { UserRoleType } from '../../lib/types';
import { Skeleton } from '../ui/Skeleton';
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
  module: AppModule;
}

interface NavSection {
  title: string;
  items: NavItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { kpis } = useFarm();
  const [role, setRole] = useState<UserRoleType | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAuthSessionAction()
      .then((session) => {
        if (!cancelled) setRole(session.role);
      })
      .catch(() => {
        if (!cancelled) setRole('Produtor');
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const allSections: NavSection[] = [
    {
      title: 'Principal',
      items: [
        {
          href: '/',
          label: 'Dashboard',
          icon: <LayoutDashboard size={18} strokeWidth={2.2} />,
          module: 'dashboard',
        },
        {
          href: '/fluxo-de-caixa',
          label: 'Fluxo de Caixa',
          icon: <TrendingUp size={18} strokeWidth={2.2} />,
          module: 'fluxo-de-caixa',
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
          module: 'contas-a-pagar',
        },
        {
          href: '/contas-a-receber',
          label: 'Contas a Receber',
          icon: <CircleDollarSign size={18} strokeWidth={2.2} />,
          module: 'contas-a-receber',
        },
        {
          href: '/conciliacao',
          label: 'Conciliação Bancária',
          icon: <Building2 size={18} strokeWidth={2.2} />,
          module: 'conciliacao',
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
          module: 'estoque',
        },
        {
          href: '/custos',
          label: 'Custo por Talhão',
          icon: <Sprout size={18} strokeWidth={2.2} />,
          module: 'custos',
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
          module: 'dre',
        },
        {
          href: '/lcdpr',
          label: 'LCDPR (Receita Federal)',
          icon: <Landmark size={18} strokeWidth={2.2} />,
          module: 'lcdpr',
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
          module: 'cadastros',
        },
        {
          href: '/configuracoes',
          label: 'Configurações',
          icon: <Settings size={18} strokeWidth={2.2} />,
          module: 'configuracoes',
        },
      ],
    },
  ];

  // Until the role resolves we don't know which modules are visible, so we
  // render neutral skeleton placeholders below instead of flashing every
  // item (then hiding some) or flashing an empty sidebar.
  const sections: NavSection[] = role
    ? allSections
        .map((sec) => ({
          ...sec,
          items: sec.items.filter((item) => canViewModule(role, item.module)),
        }))
        .filter((sec) => sec.items.length > 0)
    : [];

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
          {role === null &&
            Array.from({ length: 4 }).map((_, secIdx) => (
              <div key={secIdx} className="flex-col" style={{ gap: '8px' }}>
                <Skeleton variant="text" width="70px" height={10} />
                {Array.from({ length: secIdx === 0 ? 2 : 2 }).map((_, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex-row items-center"
                    style={{ gap: '10px', padding: '8px 12px' }}
                  >
                    <Skeleton variant="circle" width={18} height={18} />
                    <Skeleton variant="text" width="65%" height={12} />
                  </div>
                ))}
              </div>
            ))}

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
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.label}
                    </span>
                    {item.badgeCount !== undefined && (
                      <span className="nav-item__badge" style={{ flexShrink: 0 }}>
                        {item.badgeCount}
                      </span>
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
