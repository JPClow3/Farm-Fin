'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';
import { ClayCard } from '../ui/ClayCard';
import { ClayButton } from '../ui/ClayButton';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  ShieldAlert,
  Package,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Receipt,
  Wheat,
} from 'lucide-react';

export interface AlertItemData {
  id: string;
  type: 'overdue' | 'due_today' | 'due_soon' | 'approval' | 'stock' | 'barter_fix' | 'reconcile';
  severity: 'critical' | 'high' | 'warning' | 'info';
  title: string;
  subtitle: string;
  amountOrQuantity?: string;
  actionLabel: string;
  actionRoute?: string;
  onAction?: () => void;
  icon: React.ReactNode;
}

interface ExecutiveAlertsPanelProps {
  onPayPayable?: (payableId: string) => void;
}

export const ExecutiveAlertsPanel: React.FC<ExecutiveAlertsPanelProps> = ({ onPayPayable }) => {
  const router = useRouter();
  const { activePayables, activeReceivables, activeStockItems, bankStatements, approvePayable } =
    useFarm();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const topAlerts = useMemo<AlertItemData[]>(() => {
    const alerts: (AlertItemData & { priorityScore: number })[] = [];

    // 1. Contas Vencidas (Priority 100 - Critical)
    const overduePayables = activePayables.filter(
      (p) => p.status === 'vencido' || (p.status === 'pendente' && p.dueDate < todayStr)
    );
    overduePayables.forEach((p) => {
      alerts.push({
        id: `overdue-${p.id}`,
        type: 'overdue',
        severity: 'critical',
        priorityScore: 100,
        title: `Conta Vencida: ${p.description}`,
        subtitle: `Fornecedor: ${p.supplierName} • Venceu em: ${p.dueDate}`,
        amountOrQuantity: `R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        actionLabel: 'Pagar Agora',
        onAction: () => {
          if (onPayPayable) onPayPayable(p.id);
          else router.push('/contas-a-pagar');
        },
        icon: <AlertCircle size={18} color="var(--color-danger)" />,
      });
    });

    // 2. Contas que vencem hoje (Priority 90 - High)
    const dueTodayPayables = activePayables.filter(
      (p) => (p.status === 'pendente' || p.status === 'vencido') && p.dueDate === todayStr
    );
    dueTodayPayables.forEach((p) => {
      alerts.push({
        id: `today-${p.id}`,
        type: 'due_today',
        severity: 'high',
        priorityScore: 90,
        title: `Vence Hoje: ${p.description}`,
        subtitle: `Fornecedor: ${p.supplierName} • Vencimento imediato`,
        amountOrQuantity: `R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        actionLabel: 'Pagar Parcela',
        onAction: () => {
          if (onPayPayable) onPayPayable(p.id);
          else router.push('/contas-a-pagar');
        },
        icon: <Clock size={18} color="#ea580c" />,
      });
    });

    // 3. Despesas aguardando aprovação da diretoria (Priority 85 - High)
    const pendingApprovals = activePayables.filter(
      (p) =>
        p.requiresApproval &&
        p.approvalStatus !== 'aprovado' &&
        p.status !== 'pago' &&
        p.status !== 'cancelado'
    );
    pendingApprovals.forEach((p) => {
      alerts.push({
        id: `approval-${p.id}`,
        type: 'approval',
        severity: 'high',
        priorityScore: 85,
        title: `Aprovação Pendente: ${p.description}`,
        subtitle: `Requer liberação da diretoria • ${p.supplierName}`,
        amountOrQuantity: `R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        actionLabel: 'Aprovar',
        onAction: async () => {
          await approvePayable(p.id, 'Diretoria Financeira');
        },
        icon: <ShieldAlert size={18} color="#b45309" />,
      });
    });

    // 4. Insumos abaixo do estoque mínimo (Priority 80 - Warning)
    const lowStock = activeStockItems.filter((s) => s.quantity <= s.minQuantity);
    lowStock.forEach((s) => {
      alerts.push({
        id: `stock-${s.id}`,
        type: 'stock',
        severity: 'warning',
        priorityScore: 80,
        title: `Estoque Crítico: ${s.name}`,
        subtitle: `Saldo: ${s.quantity} ${s.unit} (Mínimo: ${s.minQuantity} ${s.unit})`,
        amountOrQuantity: `${s.quantity} / ${s.minQuantity} ${s.unit}`,
        actionLabel: 'Repor Insumo',
        actionRoute: '/estoque',
        onAction: () => router.push('/estoque'),
        icon: <Package size={18} color="#ca8a04" />,
      });
    });

    // 5. Contas a vencer nos próximos 3 dias (Priority 70 - Warning)
    const dueIn3Days = activePayables.filter((p) => {
      if (p.status === 'pago' || p.status === 'cancelado') return false;
      const pParts = p.dueDate.split('-');
      const tParts = todayStr.split('-');
      if (pParts.length === 3 && tParts.length === 3) {
        const pUtc = Date.UTC(
          parseInt(pParts[0], 10),
          parseInt(pParts[1], 10) - 1,
          parseInt(pParts[2], 10)
        );
        const tUtc = Date.UTC(
          parseInt(tParts[0], 10),
          parseInt(tParts[1], 10) - 1,
          parseInt(tParts[2], 10)
        );
        const diff = Math.round((pUtc - tUtc) / (1000 * 60 * 60 * 24));
        return diff >= 1 && diff <= 3;
      }
      return false;
    });
    dueIn3Days.forEach((p) => {
      alerts.push({
        id: `due3-${p.id}`,
        type: 'due_soon',
        severity: 'warning',
        priorityScore: 70,
        title: `A Vencer em Breve: ${p.description}`,
        subtitle: `Vence em: ${p.dueDate} (${p.supplierName})`,
        amountOrQuantity: `R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        actionLabel: 'Visualizar',
        actionRoute: '/contas-a-pagar',
        onAction: () => router.push('/contas-a-pagar'),
        icon: <Clock size={18} color="#ca8a04" />,
      });
    });

    // 6. Contratos de Grãos a Fixar / Barter Aberto (Priority 60 - Info)
    const openFixings = activeReceivables.filter(
      (r) =>
        r.status === 'pendente' &&
        (r.priceFixingStatus === 'a_fixar' || r.barterStatus === 'aberto')
    );
    openFixings.forEach((r) => {
      alerts.push({
        id: `fix-${r.id}`,
        type: 'barter_fix',
        severity: 'info',
        priorityScore: 60,
        title: `Contrato a Fixar: ${r.description}`,
        subtitle: `Comprador: ${r.customerName} • ${r.bagsQuantity || 0} sacas`,
        amountOrQuantity: `${(r.bagsQuantity || 0).toLocaleString('pt-BR')} sc`,
        actionLabel: 'Fixar Preço',
        actionRoute: '/contas-a-receber',
        onAction: () => router.push('/contas-a-receber'),
        icon: <Wheat size={18} color="var(--color-primary-600)" />,
      });
    });

    // 7. Extratos pendentes de conciliação bancária (Priority 50 - Info)
    const unmatchedStmts = bankStatements.filter((stmt) => !stmt.matched);
    if (unmatchedStmts.length > 0) {
      alerts.push({
        id: 'unmatched-stmts-group',
        type: 'reconcile',
        severity: 'info',
        priorityScore: 50,
        title: `${unmatchedStmts.length} Transações Bancárias Não Conciliadas`,
        subtitle: 'Extrato OFX/API com lançamentos pendentes de validação',
        amountOrQuantity: `${unmatchedStmts.length} itens`,
        actionLabel: 'Conciliar',
        actionRoute: '/conciliacao',
        onAction: () => router.push('/conciliacao'),
        icon: <Receipt size={18} color="#7c3aed" />,
      });
    }

    // Sort by priorityScore desc
    alerts.sort((a, b) => b.priorityScore - a.priorityScore);

    // Limit to Top 5
    return alerts.slice(0, 5);
  }, [
    activePayables,
    activeReceivables,
    activeStockItems,
    bankStatements,
    todayStr,
    onPayPayable,
    router,
    approvePayable,
  ]);

  const severityBadgeMap = {
    critical: { label: 'Crítico', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
    high: { label: 'Alto', bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' },
    warning: { label: 'Atenção', bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
    info: { label: 'Informativo', bg: '#e0f2fe', color: '#075985', border: '#bae6fd' },
  };

  return (
    <ClayCard>
      <div className="card-header">
        <div className="flex-row items-center" style={{ gap: '10px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '8px',
              background: topAlerts.length > 0 ? '#fee2e2' : 'var(--color-primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {topAlerts.length > 0 ? (
              <AlertTriangle size={20} color="#b91c1c" />
            ) : (
              <CheckCircle2 size={20} color="var(--color-primary-700)" />
            )}
          </div>
          <div>
            <div className="flex-row items-center" style={{ gap: '8px' }}>
              <h2 className="card-title" style={{ margin: 0 }}>
                Painel de Alertas Prioritários
              </h2>
              {topAlerts.length > 0 && (
                <span
                  className="badge badge--danger"
                  style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}
                >
                  Top {topAlerts.length}
                </span>
              )}
            </div>
            <p className="card-subtitle" style={{ margin: 0 }}>
              Visão consolidada dos pontos de atenção imediata na gestão agropecuária
            </p>
          </div>
        </div>

        <div className="flex-row" style={{ gap: '8px' }}>
          <Link href="/contas-a-pagar">
            <ClayButton variant="ghost" size="sm">
              Ver Todos →
            </ClayButton>
          </Link>
        </div>
      </div>

      {topAlerts.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            background: 'var(--bg-surface-2)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <CheckCircle2
            size={32}
            color="var(--color-primary-600)"
            style={{ margin: '0 auto 8px', display: 'block' }}
          />
          <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Nenhum alerta crítico ativo no momento!
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
            Todas as contas, estoques e contratos estão regulares para a fazenda e safra
            selecionada.
          </p>
        </div>
      ) : (
        <div className="flex-col" style={{ gap: 'var(--space-2)' }}>
          {topAlerts.map((alert) => {
            const badge = severityBadgeMap[alert.severity];
            return (
              <div
                key={alert.id}
                className="flex-between flex-wrap"
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-surface-2)',
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: `4px solid ${badge.color}`,
                  gap: '12px',
                  transition: 'background var(--transition-fast)',
                }}
              >
                <div
                  className="flex-row items-center"
                  style={{ gap: '12px', minWidth: 'min(240px, 100%)', flex: 1 }}
                >
                  <div style={{ flexShrink: 0 }}>{alert.icon}</div>
                  <div className="flex-col" style={{ gap: '3px', minWidth: 0, flex: 1 }}>
                    <div className="flex-row items-center flex-wrap" style={{ gap: '6px' }}>
                      <span
                        style={{
                          fontWeight: '600',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-primary)',
                          lineHeight: 'var(--leading-snug)',
                        }}
                      >
                        {alert.title}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          flexShrink: 0,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        lineHeight: 'var(--leading-snug)',
                      }}
                    >
                      {alert.subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex-row items-center" style={{ gap: '12px', flexShrink: 0, marginLeft: 'auto' }}>
                  {alert.amountOrQuantity && (
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                        textAlign: 'right',
                      }}
                    >
                      {alert.amountOrQuantity}
                    </div>
                  )}
                  <ClayButton
                    variant={alert.severity === 'critical' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={alert.onAction}
                  >
                    {alert.actionLabel}
                  </ClayButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ClayCard>
  );
};
