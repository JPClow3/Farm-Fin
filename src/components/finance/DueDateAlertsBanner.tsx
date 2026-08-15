'use client';

import React, { useState } from 'react';
import { DueDateAlertCategory, DueDateAlertSummary } from '../../lib/types';
import { ClayButton } from '../ui/ClayButton';
import {
  AlertTriangle,
  Clock,
  Calendar,
  AlertCircle,
  BellRing,
  Send,
  CheckCircle2,
} from 'lucide-react';

interface DueDateAlertsBannerProps {
  summary: DueDateAlertSummary;
  activeFilter: DueDateAlertCategory | null;
  onFilterChange: (category: DueDateAlertCategory | null) => void;
  onDispatchAlerts?: (channel: 'email' | 'push' | 'whatsapp') => Promise<void>;
}

export const DueDateAlertsBanner: React.FC<DueDateAlertsBannerProps> = ({
  summary,
  activeFilter,
  onFilterChange,
  onDispatchAlerts,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [dispatchedMessage, setDispatchedMessage] = useState<string | null>(null);

  if (summary.totalAlerts === 0) {
    return null;
  }

  const handleDispatch = async (channel: 'email' | 'push' | 'whatsapp') => {
    if (!onDispatchAlerts) return;
    setIsSending(true);
    try {
      await onDispatchAlerts(channel);
      setDispatchedMessage(`Alertas disparados via ${channel.toUpperCase()} com sucesso!`);
      setTimeout(() => setDispatchedMessage(null), 4000);
    } finally {
      setIsSending(false);
    }
  };

  const alertTiers: {
    key: DueDateAlertCategory;
    label: string;
    sublabel: string;
    count: number;
    icon: React.ReactNode;
    bg: string;
    border: string;
    text: string;
    activeBorder: string;
  }[] = [
    {
      key: 'vencido',
      label: 'Vencidas',
      sublabel: 'Atraso imediato',
      count: summary.overdueCount,
      icon: <AlertCircle size={16} />,
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      activeBorder: '#dc2626',
    },
    {
      key: 'hoje',
      label: 'Vencem Hoje',
      sublabel: 'Limite de pagamento',
      count: summary.dueTodayCount,
      icon: <Clock size={16} />,
      bg: '#fff7ed',
      border: '#fed7aa',
      text: '#9a3412',
      activeBorder: '#ea580c',
    },
    {
      key: 'ate_3_dias',
      label: 'Próximos 3 Dias',
      sublabel: 'Janela crítica',
      count: summary.dueIn3DaysCount,
      icon: <AlertTriangle size={16} />,
      bg: '#fefce8',
      border: '#fef08a',
      text: '#854d0e',
      activeBorder: '#ca8a04',
    },
    {
      key: 'ate_7_dias',
      label: 'Próximos 7 Dias',
      sublabel: 'Planejamento semanal',
      count: summary.dueIn7DaysCount,
      icon: <Calendar size={16} />,
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af',
      activeBorder: '#2563eb',
    },
  ];

  return (
    <div
      style={{
        background: 'var(--bg-surface-1)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--clay-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {/* Banner Header */}
      <div className="flex-between flex-wrap" style={{ gap: 'var(--space-2)' }}>
        <div className="flex-row" style={{ alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <BellRing size={18} />
          </div>
          <div>
            <span
              style={{
                fontWeight: '700',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
              }}
            >
              Cockpit de Alertas de Vencimento
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {summary.totalAlerts} compromisso(s) exigem atenção (R${' '}
              {summary.totalAmountInAlert.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
            </span>
          </div>
        </div>

        {/* Dispatch Actions */}
        {onDispatchAlerts && (
          <div className="flex-row" style={{ alignItems: 'center', gap: '6px' }}>
            <ClayButton
              size="sm"
              variant="ghost"
              disabled={isSending}
              onClick={() => handleDispatch('email')}
              style={{ fontSize: '11px', height: '30px' }}
            >
              <Send size={13} style={{ marginRight: '4px' }} />
              Enviar por E-mail
            </ClayButton>
            <ClayButton
              size="sm"
              variant="ghost"
              disabled={isSending}
              onClick={() => handleDispatch('push')}
              style={{ fontSize: '11px', height: '30px' }}
            >
              <BellRing size={13} style={{ marginRight: '4px' }} />
              Push Notificação
            </ClayButton>
          </div>
        )}
      </div>

      {/* Dispatched confirmation message */}
      {dispatchedMessage && (
        <div
          style={{
            padding: '6px 12px',
            background: '#ecfdf5',
            color: '#065f46',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <CheckCircle2 size={14} />
          <span>{dispatchedMessage}</span>
        </div>
      )}

      {/* Alert Tier Chips */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-2)',
        }}
      >
        {alertTiers.map((tier) => {
          const isSelected = activeFilter === tier.key;

          return (
            <button
              key={tier.key}
              type="button"
              onClick={() => onFilterChange(isSelected ? null : tier.key)}
              style={{
                background: isSelected ? tier.bg : 'var(--bg-surface-2)',
                border: isSelected ? `2px solid ${tier.activeBorder}` : `1px solid ${tier.border}`,
                borderRadius: 'var(--radius-lg)',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                minWidth: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <span style={{ color: tier.text, flexShrink: 0, display: 'flex' }}>{tier.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: tier.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {tier.label}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-tertiary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {tier.sublabel}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: isSelected ? tier.text : tier.bg,
                  color: isSelected ? '#ffffff' : tier.text,
                  flexShrink: 0,
                }}
              >
                {tier.count}
              </span>
            </button>
          );
        })}
      </div>

      {activeFilter && (
        <div className="flex-between" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>
            Filtro ativo na lista:{' '}
            <strong>{alertTiers.find((t) => t.key === activeFilter)?.label}</strong>
          </span>
          <button
            type="button"
            onClick={() => onFilterChange(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary-600)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Limpar filtro de alerta
          </button>
        </div>
      )}
    </div>
  );
};
