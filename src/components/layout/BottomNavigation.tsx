'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';
import {
  LayoutDashboard,
  CreditCard,
  CircleDollarSign,
  TrendingUp,
  Menu,
} from 'lucide-react';

interface BottomNavigationProps {
  onOpenSidebar: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ onOpenSidebar }) => {
  const pathname = usePathname();
  const { kpis } = useFarm();

  const navItems = [
    {
      href: '/',
      label: 'Painel',
      icon: <LayoutDashboard size={20} strokeWidth={2.2} />,
      badge: undefined,
    },
    {
      href: '/contas-a-pagar',
      label: 'A Pagar',
      icon: <CreditCard size={20} strokeWidth={2.2} />,
      badge: kpis.overduePayablesCount > 0 ? kpis.overduePayablesCount : undefined,
    },
    {
      href: '/contas-a-receber',
      label: 'A Receber',
      icon: <CircleDollarSign size={20} strokeWidth={2.2} />,
      badge: undefined,
    },
    {
      href: '/fluxo-de-caixa',
      label: 'Fluxo',
      icon: <TrendingUp size={20} strokeWidth={2.2} />,
      badge: undefined,
    },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegação Principal Mobile">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav__item ${isActive ? 'active' : ''}`}
          >
            <div className="bottom-nav__icon-box">{item.icon}</div>
            <span className="bottom-nav__label">{item.label}</span>
            {item.badge !== undefined && (
              <span className="bottom-nav__badge">{item.badge}</span>
            )}
          </Link>
        );
      })}

      {/* Menu / Drawer Trigger */}
      <button
        type="button"
        className="bottom-nav__item"
        onClick={onOpenSidebar}
        aria-label="Abrir Menu Completo"
      >
        <div className="bottom-nav__icon-box">
          <Menu size={20} strokeWidth={2.2} />
        </div>
        <span className="bottom-nav__label">Menu</span>
      </button>
    </nav>
  );
};
