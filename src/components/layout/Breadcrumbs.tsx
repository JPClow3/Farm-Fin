'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
import { findNavContext } from '../../lib/navigation';

export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const context = findNavContext(pathname || '/');

  if (!context || context.item.href === '/') {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex-row items-center"
      style={{
        gap: '6px',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)',
        marginBottom: 'var(--space-3)',
      }}
    >
      <Link
        href="/"
        className="flex-row items-center"
        style={{ gap: '4px', color: 'var(--text-tertiary)', textDecoration: 'none' }}
      >
        <LayoutDashboard size={12} />
        <span>Dashboard</span>
      </Link>
      <ChevronRight size={12} />
      <span>{context.section}</span>
      <ChevronRight size={12} />
      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{context.item.label}</span>
    </nav>
  );
};
