'use client';

import React from 'react';
import Link from 'next/link';
import { ClayCard } from '../ui/ClayCard';
import { ClayButton } from '../ui/ClayButton';
import {
  CreditCard,
  CircleDollarSign,
  PackagePlus,
  Receipt,
  FileSpreadsheet,
  Wheat,
  TrendingUp,
} from 'lucide-react';

interface QuickActionsWidgetProps {
  onOpenQuickNew?: () => void;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ onOpenQuickNew }) => {
  const actions = [
    {
      label: 'Novo Pagamento',
      desc: 'Lançar despesa ou insumo',
      icon: <CreditCard size={18} color="var(--color-danger)" />,
      onClick: onOpenQuickNew,
      href: onOpenQuickNew ? undefined : '/contas-a-pagar',
      badge: 'Contas a Pagar',
    },
    {
      label: 'Nova Venda / Contrato',
      desc: 'Registrar venda spot ou futura',
      icon: <CircleDollarSign size={18} color="var(--color-primary-600)" />,
      href: '/contas-a-receber',
      badge: 'Recebíveis',
    },
    {
      label: 'Movimentar Estoque',
      desc: 'Entrada ou aplicação de campo',
      icon: <PackagePlus size={18} color="#d97706" />,
      href: '/estoque',
      badge: 'Almoxarifado',
    },
    {
      label: 'Conciliação Bancária',
      desc: 'Importar extrato OFX/Pix',
      icon: <Receipt size={18} color="#7c3aed" />,
      href: '/conciliacao',
      badge: 'Bancos',
    },
    {
      label: 'DRE da Safra',
      desc: 'Demonstrativo e Margem EBITDA',
      icon: <FileSpreadsheet size={18} color="#059669" />,
      href: '/dre',
      badge: 'Resultados',
    },
    {
      label: 'Fluxo de Caixa',
      desc: 'Projeção diária e mensal',
      icon: <TrendingUp size={18} color="#2563eb" />,
      href: '/fluxo-de-caixa',
      badge: 'Tesouraria',
    },
  ];

  return (
    <ClayCard>
      <div className="card-header" style={{ marginBottom: 'var(--space-3)' }}>
        <div>
          <h2 className="card-title">Ações Rápidas do Produtor</h2>
          <p className="card-subtitle">Atalhos para as operações diárias mais frequentes</p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {actions.map((act, idx) => {
          const content = (
            <div
              key={idx}
              onClick={act.onClick}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--color-primary-300)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  flexShrink: 0,
                }}
              >
                {act.icon}
              </div>
              <div className="flex-col" style={{ gap: '2px', minWidth: 0 }}>
                <span
                  style={{
                    fontWeight: '600',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {act.label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {act.desc}
                </span>
              </div>
            </div>
          );

          if (act.href) {
            return (
              <Link key={idx} href={act.href} style={{ textDecoration: 'none' }}>
                {content}
              </Link>
            );
          }

          return content;
        })}
      </div>
    </ClayCard>
  );
};
