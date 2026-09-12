'use client';

import React, { useState, useMemo } from 'react';
import { Payable, Receivable, AgingBucketKey, AgingSummary } from '../../lib/types';
import { calculateAgingSummary } from '../../lib/agingUtils';
import { ClayCard } from '../ui/ClayCard';
import { ClayButton } from '../ui/ClayButton';
import { StatusBadge } from '../ui/StatusBadge';
import { calculateDateDifferenceDays, getTodayDateString } from '../../lib/dateUtils';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  TrendingDown,
  Layers,
} from 'lucide-react';

interface AgingAnalysisViewProps<T extends Payable | Receivable> {
  items: T[];
  type: 'payable' | 'receivable';
  title?: string;
  onSelectAction?: (item: T) => void;
}

export function AgingAnalysisView<T extends Payable | Receivable>({
  items,
  type,
  title,
  onSelectAction,
}: AgingAnalysisViewProps<T>) {
  const todayStr = useMemo(() => getTodayDateString(), []);
  const [selectedBucket, setSelectedBucket] = useState<AgingBucketKey | 'todos'>('todos');

  const agingSummary: AgingSummary<T> = useMemo(() => {
    return calculateAgingSummary(items, { baseDate: todayStr });
  }, [items, todayStr]);

  const bucketKeys: AgingBucketKey[] = ['a_vencer', '1_30', '31_60', '61_90', '90_plus'];

  const bucketColors: Record<
    AgingBucketKey,
    { bg: string; text: string; border: string; bar: string }
  > = {
    a_vencer: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', bar: '#10b981' },
    '1_30': { bg: '#fefce8', text: '#854d0e', border: '#fef08a', bar: '#eab308' },
    '31_60': { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa', bar: '#f97316' },
    '61_90': { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', bar: '#ef4444' },
    '90_plus': { bg: '#450a0a', text: '#ffffff', border: '#7f1d1d', bar: '#991b1b' },
  };

  const displayedItems = useMemo(() => {
    if (selectedBucket === 'todos') {
      return items.filter((i) => i.status !== 'pago' && i.status !== 'cancelado');
    }
    return agingSummary.buckets[selectedBucket].items;
  }, [selectedBucket, agingSummary, items]);

  const overdueTotal =
    agingSummary.buckets['1_30'].totalAmount +
    agingSummary.buckets['31_60'].totalAmount +
    agingSummary.buckets['61_90'].totalAmount +
    agingSummary.buckets['90_plus'].totalAmount;

  const partyHeader = type === 'payable' ? 'Fornecedor' : 'Comprador / Cliente';
  const amountHeader = type === 'payable' ? 'Valor a Pagar' : 'Valor a Receber';

  return (
    <div className="flex-col" style={{ gap: 'var(--space-5)' }}>
      {/* Header Info */}
      <div className="flex-between flex-wrap" style={{ gap: 'var(--space-3)' }}>
        <div>
          <h2
            style={{ fontSize: 'var(--text-lg)', fontWeight: '700', color: 'var(--text-primary)' }}
          >
            {title ||
              (type === 'payable'
                ? 'Aging List de Contas a Pagar'
                : 'Aging List de Contas a Receber')}
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Classificação das obrigações por faixa de vencimento e maturidade da dívida em aberto
          </p>
        </div>

        <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-color)',
              fontWeight: '600',
            }}
          >
            Total em Aberto: R${' '}
            {agingSummary.totalOpenAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          {overdueTotal > 0 && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: '#fee2e2',
                color: '#991b1b',
                fontWeight: '600',
                border: '1px solid #fecaca',
              }}
            >
              Em Atraso: R$ {overdueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>

      {/* Aging Progress Distribution Bar */}
      <div
        style={{
          background: 'var(--bg-surface-1)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--clay-shadow-sm)',
        }}
      >
        <div className="flex-between" style={{ marginBottom: '8px' }}>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: '600',
              color: 'var(--text-secondary)',
            }}
          >
            Distribuição da Carteira por Faixa
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {agingSummary.totalCount} título(s) ativos
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            height: '14px',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            background: 'var(--bg-surface-2)',
            gap: '2px',
          }}
        >
          {bucketKeys.map((key) => {
            const bucket = agingSummary.buckets[key];
            if (bucket.percentage <= 0) return null;
            return (
              <div
                key={key}
                title={`${bucket.label}: R$ ${bucket.totalAmount.toLocaleString('pt-BR')} (${bucket.percentage}%)`}
                style={{
                  width: `${bucket.percentage}%`,
                  background: bucketColors[key].bar,
                  transition: 'width 0.3s ease',
                }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div
          className="flex-row flex-wrap"
          style={{
            gap: 'var(--space-4)',
            marginTop: 'var(--space-3)',
            justifyContent: 'space-between',
          }}
        >
          {bucketKeys.map((key) => {
            const bucket = agingSummary.buckets[key];
            return (
              <div key={key} className="flex-row" style={{ alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: bucketColors[key].bar,
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {bucket.label}: <strong>{bucket.percentage}%</strong>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5 Aging Bucket Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {bucketKeys.map((key) => {
          const bucket = agingSummary.buckets[key];
          const isSelected = selectedBucket === key;
          const colors = bucketColors[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedBucket(selectedBucket === key ? 'todos' : key)}
              style={{
                background: isSelected ? colors.bg : 'var(--bg-surface-1)',
                border: isSelected ? `2px solid ${colors.bar}` : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-3) var(--space-4)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.08)' : 'var(--clay-shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: 0,
              }}
            >
              <div className="flex-between" style={{ width: '100%', gap: '4px' }}>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: '700',
                    color: isSelected ? colors.text : 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {bucket.label}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: colors.bg,
                    color: colors.text,
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  {bucket.count}
                </span>
              </div>

              <div
                className="tabular-nums"
                style={{
                  fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
                  fontWeight: '800',
                  color: isSelected ? colors.text : 'var(--text-primary)',
                  marginTop: '4px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                R$ {bucket.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {bucket.rangeDescription}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bucket Filter Indicator & Reset */}
      {selectedBucket !== 'todos' && (
        <div
          className="flex-between"
          style={{
            padding: '8px 14px',
            background: 'var(--bg-surface-2)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <span>
            Filtrando por: <strong>{agingSummary.buckets[selectedBucket].label}</strong> (
            {displayedItems.length} título(s))
          </span>
          <button
            type="button"
            onClick={() => setSelectedBucket('todos')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary-600)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
            }}
          >
            Limpar Filtro de Faixa
          </button>
        </div>
      )}

      {/* Drill-down Table for the Selected Aging Bucket */}
      <div
        className="clay-table-wrapper"
        style={{
          background: 'var(--bg-surface-1)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--clay-shadow-md)',
        }}
      >
        <table className="clay-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Documento / Descrição</th>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>{partyHeader}</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Vencimento</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Dias de Atraso</th>
              <th style={{ textAlign: 'right', padding: '12px 16px' }}>{amountHeader}</th>
              <th style={{ textAlign: 'center', padding: '12px 16px' }}>Status</th>
              {onSelectAction && <th style={{ textAlign: 'right', padding: '12px 16px' }}>Ação</th>}
            </tr>
          </thead>
          <tbody>
            {displayedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={onSelectAction ? 7 : 6}
                  style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}
                >
                  Nenhum título encontrado nesta faixa de vencimento.
                </td>
              </tr>
            ) : (
              displayedItems.map((item) => {
                const diffDays = calculateDateDifferenceDays(item.dueDate, todayStr);
                const delayDays = diffDays < 0 ? Math.abs(diffDays) : 0;
                const isOverdue = diffDays < 0;
                const partyName =
                  'supplierName' in item
                    ? item.supplierName
                    : 'customerName' in item
                      ? item.customerName
                      : '-';
                const amount =
                  'totalAmount' in item ? Number(item.totalAmount) : Number(item.amount) || 0;

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex-col" style={{ gap: '2px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {item.description}
                        </span>
                        {'category' in item && (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            {item.category}
                          </span>
                        )}
                        {'crop' in item && (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            Cultura: {item.crop}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{partyName}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: isOverdue ? 'bold' : 'normal',
                          color: isOverdue ? 'var(--color-danger)' : undefined,
                        }}
                      >
                        {item.dueDate}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {delayDays > 0 ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background:
                              delayDays > 60 ? '#fee2e2' : delayDays > 30 ? '#fff7ed' : '#fefce8',
                            color:
                              delayDays > 60 ? '#991b1b' : delayDays > 30 ? '#9a3412' : '#854d0e',
                          }}
                        >
                          +{delayDays} dia(s)
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--color-success-dark)',
                            fontWeight: '600',
                          }}
                        >
                          No prazo
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>
                      R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <StatusBadge status={item.status} />
                    </td>
                    {onSelectAction && (
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <ClayButton size="sm" variant="ghost" onClick={() => onSelectAction(item)}>
                          Detalhes
                        </ClayButton>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
