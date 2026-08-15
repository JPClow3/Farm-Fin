'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useFarm } from '../../context/FarmContext';
import { ClayCard } from '../ui/ClayCard';
import { ClayButton } from '../ui/ClayButton';
import { StatusBadge } from '../ui/StatusBadge';
import { CircleDollarSign, Wheat, Scale, CheckCircle2 } from 'lucide-react';

export const UpcomingReceivablesWidget: React.FC = () => {
  const { activeReceivables } = useFarm();

  const upcomingReceivables = useMemo(() => {
    return activeReceivables
      .filter((r) => r.status === 'pendente' || r.status === 'vencido')
      .slice(0, 5);
  }, [activeReceivables]);

  return (
    <ClayCard>
      <div className="card-header">
        <div>
          <h2 className="card-title">Próximos Recebimentos & Grãos</h2>
          <p className="card-subtitle">Contratos de venda e entregas com recebimento previsto</p>
        </div>
        <Link href="/contas-a-receber">
          <ClayButton variant="ghost" size="sm">
            Ver Todos ({activeReceivables?.length || 0})
          </ClayButton>
        </Link>
      </div>

      <div className="flex-col" style={{ gap: 'var(--space-3)' }}>
        {upcomingReceivables.length === 0 ? (
          <p
            style={{
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)',
              textAlign: 'center',
              padding: 'var(--space-6)',
            }}
          >
            Nenhum recebimento pendente para esta safra/período.
          </p>
        ) : (
          upcomingReceivables.map((item) => (
            <div
              key={item.id}
              className="flex-between flex-wrap"
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-lg)',
                gap: '12px',
              }}
            >
              <div className="flex-col" style={{ gap: '2px', minWidth: 0, flex: 1 }}>
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
                  {item.description}
                </span>
                <div
                  className="flex-row"
                  style={{
                    gap: '8px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.customerName}
                  </span>
                  <span>•</span>
                  <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Vence em: {item.dueDate}
                  </span>
                  {item.contractType && (
                    <>
                      <span>•</span>
                      <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                        {item.contractType}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-row" style={{ gap: '12px', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div
                    className="td-money"
                    style={{
                      color: 'var(--color-primary-700)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: '700',
                    }}
                  >
                    R$ {item.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {(item.bagsQuantity || 0).toLocaleString('pt-BR')} sc • R${' '}
                    {item.unitPrice?.toFixed(2) || '0.00'}/sc
                  </div>
                </div>
                <Link href="/contas-a-receber">
                  <ClayButton variant="ghost" size="sm">
                    Detalhes
                  </ClayButton>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </ClayCard>
  );
};
