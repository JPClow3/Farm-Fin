'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useFarm, GlobalPeriodFilterType } from '../context/FarmContext';
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
  DashboardWidgetConfig,
  DashboardWidgetId,
  loadDashboardWidgetConfigs,
  saveDashboardWidgetConfigs,
} from '../lib/dashboardWidgets';
import { ExecutiveAlertsPanel } from '../components/dashboard/ExecutiveAlertsPanel';
import { QuickActionsWidget } from '../components/dashboard/QuickActionsWidget';
import { UpcomingReceivablesWidget } from '../components/dashboard/UpcomingReceivablesWidget';
import { CustomizeDashboardModal } from '../components/dashboard/CustomizeDashboardModal';
import {
  TrendingUp,
  CreditCard,
  CircleDollarSign,
  Building2,
  Sprout,
  SlidersHorizontal,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Check,
  Calendar,
  Layers,
  Wheat,
  RotateCcw,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    activeFarm,
    activeSeason,
    activePayables,
    periodFilteredPayables,
    activeFields,
    bankAccounts,
    payPayable,
    activeFarmId,
    periodFilter,
    setPeriodFilter,
    currentPeriodInfo,
    kpis,
  } = useFarm();

  const { addToast } = useToast();
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Widget Configuration State
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>([]);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<DashboardWidgetId | null>(null);

  useEffect(() => {
    setWidgets(loadDashboardWidgetConfigs());
  }, []);

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
    const sourceList = periodFilteredPayables || activePayables;
    return sourceList.filter((p) => p.status === 'pendente' || p.status === 'vencido').slice(0, 5);
  }, [periodFilteredPayables, activePayables]);

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

  const handleOpenPayFromAlert = (payableId: string) => {
    const item = activePayables.find((p) => p.id === payableId);
    if (item) {
      setSelectedPayable(item);
      setPaymentAccount(bankAccounts[0]?.id || '');
      setPaymentDate(todayStr);
    }
  };

  // Reorder and Drag-and-Drop Handlers
  const handleMoveWidget = (id: DashboardWidgetId, direction: 'up' | 'down') => {
    const activeList = [...widgets].sort((a, b) => a.order - b.order);
    const index = activeList.findIndex((w) => w.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeList.length) return;

    const temp = activeList[index];
    activeList[index] = activeList[targetIndex];
    activeList[targetIndex] = temp;

    const reordered = activeList.map((w, idx) => ({ ...w, order: idx }));
    setWidgets(reordered);
    saveDashboardWidgetConfigs(reordered);
  };

  const handleDragStart = (id: DashboardWidgetId) => {
    setDraggedWidgetId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: DashboardWidgetId) => {
    if (!draggedWidgetId || draggedWidgetId === targetId) return;

    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const sourceIndex = sorted.findIndex((w) => w.id === draggedWidgetId);
    const targetIndex = sorted.findIndex((w) => w.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [moved] = sorted.splice(sourceIndex, 1);
    sorted.splice(targetIndex, 0, moved);

    const reordered = sorted.map((w, idx) => ({ ...w, order: idx }));
    setWidgets(reordered);
    saveDashboardWidgetConfigs(reordered);
    setDraggedWidgetId(null);
  };

  // Period Filter Pills Options
  const periodFilterOptions: { key: GlobalPeriodFilterType; label: string }[] = [
    { key: 'safra', label: `Safra (${activeSeason?.name || 'Atual'})` },
    { key: 'mes_atual', label: 'Mês Atual' },
    { key: 'proximos_30_dias', label: 'Próximos 30 Dias' },
    { key: 'trimestre', label: 'Trimestre' },
    { key: 'ano_atual', label: 'Ano Calendário' },
    { key: 'personalizado', label: 'Personalizado' },
  ];

  // Render individual widget component by ID
  const renderWidgetContent = (widget: DashboardWidgetConfig) => {
    switch (widget.id) {
      case 'kpi_cards':
        return (
          <div className="grid-4">
            <KpiCard
              label="Contas a Receber (Período)"
              value={`R$ ${liveKpis.totalReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<CircleDollarSign size={20} />}
              iconColor="green"
              trend={{
                value: `Receita no Mês: R$ ${liveKpis.totalReceitasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                direction: 'up',
              }}
            />
            <KpiCard
              label="Contas a Pagar (Período)"
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
              label="Margem Líquida Estimada"
              value={`${kpis?.estimatedCropMargin?.toFixed(1) || '0.0'}%`}
              icon={<Sprout size={20} />}
              iconColor="amber"
              subtext={`Custo Médio: R$ ${kpis?.averageCostPerHectare?.toFixed(2) || '0.00'}/ha`}
            />
          </div>
        );

      case 'alerts_panel':
        return <ExecutiveAlertsPanel onPayPayable={handleOpenPayFromAlert} />;

      case 'cash_flow_chart':
        return (
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
        );

      case 'cost_breakdown_chart':
        return (
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
        );

      case 'quick_actions':
        return <QuickActionsWidget />;

      case 'upcoming_payables':
        return (
          <ClayCard>
            <div className="card-header">
              <div>
                <h2 className="card-title">Próximos Vencimentos a Pagar</h2>
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
                          {item.supplierName}
                        </span>
                        <span>•</span>
                        <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                          Vence em: {item.dueDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex-row" style={{ gap: '12px', flexShrink: 0 }}>
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
        );

      case 'upcoming_receivables':
        return <UpcomingReceivablesWidget />;

      case 'farm_fields':
        return (
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--space-3)',
              }}
            >
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
                      {field.name}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      Solo: {field.soilType}
                    </span>
                  </div>
                  <div className="flex-row" style={{ gap: '8px', flexShrink: 0 }}>
                    <span className="badge badge--primary">{field.currentCrop}</span>
                    <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                      {field.area} ha
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ClayCard>
        );

      default:
        return null;
    }
  };

  const visibleWidgets = useMemo(() => {
    return [...widgets].filter((w) => w.isVisible).sort((a, b) => a.order - b.order);
  }, [widgets]);

  return (
    <div className="flex-col" style={{ gap: 'var(--space-5)' }}>
      {/* Page Header with Executive Title and Customization Actions */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-title-group">
          <div className="flex-row items-center" style={{ gap: '8px' }}>
            <h1 className="page-title">Painel Executivo — {activeFarm?.name || 'Fazenda'}</h1>
            <span
              className="badge badge--primary"
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '12px',
              }}
            >
              {activeSeason?.name || 'Safra Atual'}
            </span>
          </div>
          <p className="page-subtitle">
            Gestão financeira consolidada • Período ativo:{' '}
            <strong>{currentPeriodInfo.label}</strong> ({currentPeriodInfo.startDate} até{' '}
            {currentPeriodInfo.endDate})
          </p>
        </div>

        <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
          <ClayButton
            variant={isEditMode ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            title="Alternar modo de reordenação direta de widgets"
          >
            <Layers size={15} style={{ marginRight: '6px' }} />
            {isEditMode ? 'Concluir Edição' : 'Organizar Widgets'}
          </ClayButton>

          <ClayButton
            variant="secondary"
            size="sm"
            onClick={() => setShowCustomizeModal(true)}
            title="Abrir configurações de visibilidade e layout dos widgets"
          >
            <SlidersHorizontal size={15} style={{ marginRight: '6px' }} />
            Personalizar Painel
          </ClayButton>
        </div>
      </div>

      {/* Global Period Filter Toolbar */}
      <div
        className="flex-between flex-wrap"
        style={{
          padding: '10px 14px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--clay-shadow-xs)',
        }}
      >
        <div className="flex-row items-center flex-wrap" style={{ gap: '8px' }}>
          <div
            className="flex-row items-center"
            style={{
              gap: '6px',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
              fontWeight: '600',
              marginRight: '6px',
            }}
          >
            <Calendar size={15} color="var(--color-primary-600)" />
            <span>Filtro de Período:</span>
          </div>

          <div className="filter-pills">
            {periodFilterOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`filter-pill ${periodFilter === opt.key ? 'active' : ''}`}
                onClick={() => setPeriodFilter(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="hide-mobile"
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Wheat size={14} color="var(--color-secondary-600)" />
          <span>
            {activeFarm?.totalArea || 0} ha cadastrados • Safra {activeSeason?.name}
          </span>
        </div>
      </div>

      {/* Edit Mode Notification Banner */}
      {isEditMode && (
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--color-primary-100)',
            border: '1px solid var(--color-primary-300)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-primary-900)',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex-row items-center" style={{ gap: '8px' }}>
            <Layers size={18} color="var(--color-primary-700)" />
            <span>
              <strong>Modo de Edição Ativo:</strong> Arraste os blocos pelos ícones de pegada ou use
              as setas para reorganizar seu painel.
            </span>
          </div>
          <ClayButton size="sm" variant="primary" onClick={() => setIsEditMode(false)}>
            <Check size={14} style={{ marginRight: '4px' }} />
            Finalizar
          </ClayButton>
        </div>
      )}

      {/* Dynamic Widget Grid / Container */}
      <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
        {visibleWidgets.map((widget, index) => (
          <div
            key={widget.id}
            draggable={isEditMode}
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(widget.id)}
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
              border: isEditMode ? '2px dashed var(--color-primary-400)' : 'none',
              padding: isEditMode ? '8px' : '0',
              background: isEditMode ? 'rgba(76, 175, 80, 0.03)' : 'transparent',
            }}
          >
            {/* Edit Mode Widget Header Controls */}
            {isEditMode && (
              <div
                className="flex-between"
                style={{
                  marginBottom: '8px',
                  padding: '4px 10px',
                  background: 'var(--bg-surface-2)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div className="flex-row items-center" style={{ gap: '6px' }}>
                  <GripVertical
                    size={16}
                    color="var(--text-secondary)"
                    style={{ cursor: 'grab' }}
                  />
                  <span
                    style={{
                      fontWeight: '600',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Widget #{index + 1}: {widget.title}
                  </span>
                </div>

                <div className="flex-row items-center" style={{ gap: '4px' }}>
                  <ClayButton
                    size="sm"
                    variant="ghost"
                    iconOnly
                    onClick={() => handleMoveWidget(widget.id, 'up')}
                    disabled={index === 0}
                    title="Mover para cima"
                  >
                    <ArrowUp size={14} />
                  </ClayButton>
                  <ClayButton
                    size="sm"
                    variant="ghost"
                    iconOnly
                    onClick={() => handleMoveWidget(widget.id, 'down')}
                    disabled={index === visibleWidgets.length - 1}
                    title="Mover para baixo"
                  >
                    <ArrowDown size={14} />
                  </ClayButton>
                </div>
              </div>
            )}

            {/* Widget Inner Content */}
            {renderWidgetContent(widget)}
          </div>
        ))}
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

      {/* Customize Dashboard Modal */}
      <CustomizeDashboardModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        widgets={widgets}
        onSave={(newWidgets) => {
          setWidgets(newWidgets);
          addToast({
            type: 'success',
            title: 'Layout Atualizado!',
            message: 'As preferências de widgets do painel executivo foram salvas com sucesso.',
          });
        }}
      />
    </div>
  );
}
