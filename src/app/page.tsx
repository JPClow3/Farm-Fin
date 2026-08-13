'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import { KpiCard } from '../components/ui/KpiCard';
import { ClayCard } from '../components/ui/ClayCard';
import { ClayButton } from '../components/ui/ClayButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CashFlowChart } from '../components/charts/CashFlowChart';
import { CostBreakdownChart } from '../components/charts/CostBreakdownChart';
import { ClayModal } from '../components/ui/ClayModal';
import { ClaySelect } from '../components/ui/ClaySelect';
import { ClayInput } from '../components/ui/ClayInput';
import { Payable } from '../lib/types';
import { getDashboardKPIs } from '../actions/analytics';
import { getTodayDateString } from '../lib/dateUtils';
import {
  TrendingUp,
  CreditCard,
  CircleDollarSign,
  Building2,
  Sprout,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    activeFarm,
    activeSeason,
    activePayables,
    activeFields,
    bankAccounts,
    payPayable,
    activeFarmId,
    kpis,
  } = useFarm();

  const { addToast } = useToast();
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Payment Modal State
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [paymentAccount, setPaymentAccount] = useState<string>(bankAccounts[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);

  // Live KPIs State
  const [liveKpis, setLiveKpis] = useState({
    totalPayables: 0,
    totalReceivables: 0,
    totalDespesasMes: 0,
    totalReceitasMes: 0,
  });

  useEffect(() => {
    async function loadLiveKpis() {
      const res = await getDashboardKPIs(activeFarmId);
      if (res.success && res.data) {
        setLiveKpis(res.data);
      }
    }
    loadLiveKpis();
  }, [activeFarmId]);

  const upcomingPayables = useMemo(() => {
    return activePayables
      .filter((p) => p.status === 'pendente' || p.status === 'vencido')
      .slice(0, 5);
  }, [activePayables]);

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable) return;

    const bankId = paymentAccount || bankAccounts[0]?.id;
    await payPayable(selectedPayable.id, bankId, selectedPayable.amount, paymentDate);

    addToast({
      type: 'success',
      title: 'Pagamento Realizado!',
      message: `Baixa de R$ ${selectedPayable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrada com sucesso no banco.`,
    });
    setSelectedPayable(null);
  };

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Painel Executivo — {activeFarm?.name || 'Fazenda'}</h1>
          <p className="page-subtitle">
            Visão financeira e operacional consolidada para a {activeSeason?.name || 'Safra Atual'}
          </p>
        </div>
        <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
          <Link href="/fluxo-de-caixa">
            <ClayButton variant="ghost" size="sm">
              <TrendingUp size={15} style={{ marginRight: '6px' }} />
              Ver Fluxo Completo
            </ClayButton>
          </Link>
          <Link href="/contas-a-pagar">
            <ClayButton variant="secondary" size="sm">
              <CreditCard size={15} style={{ marginRight: '6px' }} />
              Contas a Pagar
            </ClayButton>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (4 Cards) */}
      <div className="grid-4">
        <KpiCard
          label="Contas a Receber (Venc./Mês)"
          value={`R$ ${liveKpis.totalReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CircleDollarSign size={20} />}
          iconColor="green"
          trend={{
            value: `Receita no Mês: R$ ${liveKpis.totalReceitasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            direction: 'up',
          }}
        />
        <KpiCard
          label="Contas a Pagar (Venc./Mês)"
          value={`R$ ${liveKpis.totalPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CreditCard size={20} />}
          iconColor="red"
          trend={{
            value: `Despesa no Mês: R$ ${liveKpis.totalDespesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            direction: 'down',
          }}
        />
        <KpiCard
          label="Saldo Consolidado em Caixa"
          value={`R$ ${kpis?.totalBankBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
          icon={<Building2 size={20} />}
          iconColor="blue"
          subtext={`${bankAccounts?.length || 0} contas bancárias ativas`}
        />
        <KpiCard
          label="Margem Líquida da Safra"
          value={`${kpis?.estimatedCropMargin?.toFixed(1) || '0.0'}%`}
          icon={<Sprout size={20} />}
          iconColor="amber"
          subtext={`Custo Médio: R$ ${kpis?.averageCostPerHectare?.toFixed(2) || '0.00'}/ha`}
        />
      </div>

      {/* Main Charts & Allocation Section */}
      <div className="grid-2-1">
        {/* Cash Flow Evolution */}
        <ClayCard>
          <div className="card-header">
            <div>
              <h2 className="card-title">Fluxo de Caixa Mensal</h2>
              <p className="card-subtitle">
                Comparativo de Entradas vs Saídas e Projeção de Liquidez
              </p>
            </div>
            <Link href="/fluxo-de-caixa">
              <ClayButton variant="ghost" size="sm">
                Detalhes →
              </ClayButton>
            </Link>
          </div>
          <CashFlowChart />
        </ClayCard>

        {/* Cost Breakdown */}
        <ClayCard>
          <div className="card-header">
            <div>
              <h2 className="card-title">Alocação de Custos</h2>
              <p className="card-subtitle">Despesas por Categoria na Safra</p>
            </div>
            <Link href="/custos">
              <ClayButton variant="ghost" size="sm">
                Ver Custos →
              </ClayButton>
            </Link>
          </div>
          <CostBreakdownChart />
        </ClayCard>
      </div>

      {/* Upcoming Bills & Farm Fields Section */}
      <div className="grid-2">
        {/* Próximos Vencimentos */}
        <ClayCard>
          <div className="card-header">
            <div>
              <h2 className="card-title">Próximos Vencimentos</h2>
              <p className="card-subtitle">Contas com vencimento imediato</p>
            </div>
            <Link href="/contas-a-pagar">
              <ClayButton variant="ghost" size="sm">
                Ver Todas ({activePayables?.length || 0})
              </ClayButton>
            </Link>
          </div>

          <div className="flex-col" style={{ gap: 'var(--space-3)' }}>
            {upcomingPayables.length === 0 ? (
              <p
                style={{
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--text-sm)',
                  textAlign: 'center',
                  padding: 'var(--space-6)',
                }}
              >
                Nenhuma conta pendente para este período.
              </p>
            ) : (
              upcomingPayables.map((item) => (
                <div
                  key={item.id}
                  className="flex-between"
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <div className="flex-col" style={{ gap: '2px' }}>
                    <span
                      style={{
                        fontWeight: '600',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
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
                      <span>{item.supplierName}</span>
                      <span>•</span>
                      <span>Vence em: {item.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex-row" style={{ gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        className="td-money"
                        style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}
                      >
                        R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.status !== 'pago' && (
                      <ClayButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedPayable(item);
                          setPaymentAccount(bankAccounts[0]?.id || '');
                        }}
                      >
                        Pagar
                      </ClayButton>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ClayCard>

        {/* Resumo dos Talhões */}
        <ClayCard>
          <div className="card-header">
            <div>
              <h2 className="card-title">Talhões da Propriedade</h2>
              <p className="card-subtitle">Área total: {activeFarm?.totalArea || 0} hectares</p>
            </div>
            <Link href="/cadastros">
              <ClayButton variant="ghost" size="sm">
                Gerenciar →
              </ClayButton>
            </Link>
          </div>

          <div className="flex-col" style={{ gap: 'var(--space-3)' }}>
            {(activeFields || []).map((field) => (
              <div
                key={field.id}
                className="flex-between"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-surface-2)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <div className="flex-col" style={{ gap: '2px' }}>
                  <span
                    style={{
                      fontWeight: '600',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {field.name}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    Solo: {field.soilType}
                  </span>
                </div>
                <div className="flex-row" style={{ gap: '12px' }}>
                  <span className="badge badge--primary">{field.currentCrop}</span>
                  <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                    {field.area} ha
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ClayCard>
      </div>

      {/* Pay Modal */}
      {selectedPayable && (
        <ClayModal
          isOpen={true}
          onClose={() => setSelectedPayable(null)}
          title="Baixa de Pagamento"
          subtitle={`Confirmar quitação de "${selectedPayable.description}"`}
        >
          <form
            onSubmit={handleConfirmPayment}
            className="flex-col"
            style={{ gap: 'var(--space-4)' }}
          >
            <div
              style={{
                padding: 'var(--space-4)',
                background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Fornecedor:
                </span>
                <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                  {selectedPayable.supplierName}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Valor da Parcela:
                </span>
                <span
                  className="td-money"
                  style={{ fontSize: 'var(--text-lg)', color: 'var(--color-primary-700)' }}
                >
                  R$ {selectedPayable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <ClaySelect
              label="Conta Bancária de Débito"
              options={bankAccounts.map((b) => ({
                value: b.id,
                label: `${b.bankName} (Saldo: R$ ${b.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
              }))}
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
              required
            />

            <ClayInput
              label="Data Efetiva do Pagamento"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />

            <div className="modal__footer">
              <ClayButton type="button" variant="ghost" onClick={() => setSelectedPayable(null)}>
                Cancelar
              </ClayButton>
              <ClayButton type="submit" variant="primary">
                Confirmar Quitação
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}
    </div>
  );
}
