'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { ClayTabs } from '../../components/ui/ClayTabs';
import { ClayModal } from '../../components/ui/ClayModal';
import { CashFlowChart } from '../../components/charts/CashFlowChart';
import { getCashFlowReport, CashFlowRow } from '../../actions/finance';
import { exportCashFlowToExcel, ScenarioSimulationParams } from '../../lib/exportExcel';
import { useModuleGuard } from '../../lib/useModuleGuard';
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
  SlidersHorizontal,
  GitCompare,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertCircle,
  Layers,
  RotateCcw,
} from 'lucide-react';

interface CustomScenarioState {
  id: 'realista' | 'otimista' | 'pessimista' | 'personalizado';
  label: string;
  inflowVariationPct: number; // e.g. 15 for +15%
  outflowVariationPct: number; // e.g. -5 for -5%
  grainPriceDeltaPct: number; // e.g. 10 for +10%
  receivablesDelayDays: number; // e.g. 15
  defaultRatePct: number; // e.g. 2%
  notes: string;
}

const PRESET_SCENARIOS: Record<'realista' | 'otimista' | 'pessimista', CustomScenarioState> = {
  realista: {
    id: 'realista',
    label: 'Realista (Base)',
    inflowVariationPct: 0,
    outflowVariationPct: 0,
    grainPriceDeltaPct: 0,
    receivablesDelayDays: 0,
    defaultRatePct: 0,
    notes: 'Projeção base calculada a partir de vencimentos e contratos vigentes',
  },
  otimista: {
    id: 'otimista',
    label: 'Otimista (+15% Rec, -5% Custos)',
    inflowVariationPct: 15,
    outflowVariationPct: -5,
    grainPriceDeltaPct: 10,
    receivablesDelayDays: 0,
    defaultRatePct: 0,
    notes: 'Premissa de valorização da saca de soja/milho (+10%) e descontos em insumos (-5%)',
  },
  pessimista: {
    id: 'pessimista',
    label: 'Pessimista (-15% Rec, +8% Custos)',
    inflowVariationPct: -15,
    outflowVariationPct: 8,
    grainPriceDeltaPct: -10,
    receivablesDelayDays: 15,
    defaultRatePct: 2.5,
    notes:
      'Stress test com frustração de safra (-15%), alta de combustível/adubos (+8%) e 15 dias de atraso',
  },
};

export default function FluxoDeCaixaPage() {
  useModuleGuard('fluxo-de-caixa');
  const { bankAccounts, activeFarm, activeFarmId } = useFarm();
  const { addToast } = useToast();

  // Filters State
  const [periodTab, setPeriodTab] = useState<'diaria' | 'semanal' | 'mensal' | 'anual'>('mensal');
  const [selectedBankId, setSelectedBankId] = useState<string>('all');
  const [reportRows, setReportRows] = useState<CashFlowRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Scenario Simulation State
  const [scenarioState, setScenarioState] = useState<CustomScenarioState>(
    PRESET_SCENARIOS.realista
  );
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState<boolean>(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Draft state inside modal
  const [draftScenario, setDraftScenario] = useState<CustomScenarioState>(
    PRESET_SCENARIOS.realista
  );

  // Load Cash Flow Report from Server Action
  useEffect(() => {
    async function loadCashFlow() {
      setIsLoading(true);
      try {
        const res = await getCashFlowReport(periodTab, activeFarmId, selectedBankId);
        if (res.success && res.data && res.data.length > 0) {
          setReportRows(res.data);
        }
      } catch (e) {
        console.error('Failed to load cash flow from DB:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadCashFlow();
  }, [activeFarmId, periodTab, selectedBankId]);

  // Compute Active Multipliers
  const inflowMult = useMemo(() => {
    const directMult = 1 + scenarioState.inflowVariationPct / 100;
    const priceEffect = 1 + (scenarioState.grainPriceDeltaPct / 100) * 0.6; // grain price contributes ~60% to revenue delta
    const lossEffect = 1 - scenarioState.defaultRatePct / 100;
    return directMult * priceEffect * lossEffect;
  }, [scenarioState]);

  const outflowMult = useMemo(() => {
    return 1 + scenarioState.outflowVariationPct / 100;
  }, [scenarioState]);

  // Compute Adjusted Rows
  const adjustedRows = useMemo(() => {
    let running = reportRows.length > 0 ? reportRows[0].initialBalance : 1420000;
    return reportRows.map((row) => {
      const adjIn = row.inflows * inflowMult;
      const adjOut = row.outflows * outflowMult;
      const adjNet = adjIn - adjOut;
      const finalBal = running + adjNet;
      const r: CashFlowRow = {
        ...row,
        initialBalance: Math.round(running),
        inflows: Math.round(adjIn),
        outflows: Math.round(adjOut),
        netFlow: Math.round(adjNet),
        finalBalance: Math.round(finalBal),
      };
      running = finalBal;
      return r;
    });
  }, [reportRows, inflowMult, outflowMult]);

  // Baseline Rows (Realista) for comparison
  const baselineRows = useMemo(() => {
    let running = reportRows.length > 0 ? reportRows[0].initialBalance : 1420000;
    return reportRows.map((row) => {
      const adjIn = row.inflows;
      const adjOut = row.outflows;
      const adjNet = adjIn - adjOut;
      const finalBal = running + adjNet;
      const r: CashFlowRow = {
        ...row,
        initialBalance: Math.round(running),
        inflows: Math.round(adjIn),
        outflows: Math.round(adjOut),
        netFlow: Math.round(adjNet),
        finalBalance: Math.round(finalBal),
      };
      running = finalBal;
      return r;
    });
  }, [reportRows]);

  // Key Aggregated Metrics
  const totalInflows = useMemo(
    () => adjustedRows.reduce((sum, r) => sum + r.inflows, 0),
    [adjustedRows]
  );
  const totalOutflows = useMemo(
    () => adjustedRows.reduce((sum, r) => sum + r.outflows, 0),
    [adjustedRows]
  );
  const finalProjectedBalance = useMemo(
    () => (adjustedRows.length > 0 ? adjustedRows[adjustedRows.length - 1].finalBalance : 0),
    [adjustedRows]
  );
  const baselineFinalBalance = useMemo(
    () => (baselineRows.length > 0 ? baselineRows[baselineRows.length - 1].finalBalance : 0),
    [baselineRows]
  );
  const scenarioDelta = finalProjectedBalance - baselineFinalBalance;

  // Minimum Projected Balance during the timeline
  const minBalanceInfo = useMemo(() => {
    if (adjustedRows.length === 0) return { value: 0, period: 'N/A' };
    let minVal = adjustedRows[0].finalBalance;
    let minPer = adjustedRows[0].period;
    for (const r of adjustedRows) {
      if (r.finalBalance < minVal) {
        minVal = r.finalBalance;
        minPer = r.period;
      }
    }
    return { value: minVal, period: minPer };
  }, [adjustedRows]);

  // Transform for chart
  const chartData = useMemo(() => {
    return adjustedRows.map((r) => ({
      month: r.period.replace(' (Atual)', '').replace(' (Proj)', '').replace(' (Hoje)', ''),
      inflow: r.inflows,
      outflow: r.outflows,
      balance: r.finalBalance,
    }));
  }, [adjustedRows]);

  // Preset switch handler
  const handleSelectPreset = (presetKey: 'realista' | 'otimista' | 'pessimista') => {
    setScenarioState(PRESET_SCENARIOS[presetKey]);
  };

  // Open Custom Simulator Modal
  const handleOpenSimulator = () => {
    setDraftScenario({ ...scenarioState });
    setIsSimulatorModalOpen(true);
  };

  // Apply Custom Simulator
  const handleApplyDraftScenario = () => {
    setScenarioState({
      ...draftScenario,
      id:
        draftScenario.inflowVariationPct === 0 &&
        draftScenario.outflowVariationPct === 0 &&
        draftScenario.grainPriceDeltaPct === 0 &&
        draftScenario.receivablesDelayDays === 0 &&
        draftScenario.defaultRatePct === 0
          ? 'realista'
          : 'personalizado',
      label:
        draftScenario.inflowVariationPct === 0 &&
        draftScenario.outflowVariationPct === 0 &&
        draftScenario.grainPriceDeltaPct === 0 &&
        draftScenario.receivablesDelayDays === 0 &&
        draftScenario.defaultRatePct === 0
          ? 'Realista (Base)'
          : `Simulação Personalizada (${draftScenario.inflowVariationPct >= 0 ? '+' : ''}${draftScenario.inflowVariationPct}% Rec / ${draftScenario.outflowVariationPct >= 0 ? '+' : ''}${draftScenario.outflowVariationPct}% Custos)`,
    });
    setIsSimulatorModalOpen(false);
    addToast({
      type: 'info',
      title: 'Cenário de Simulação Aplicado',
      message: 'O fluxo de caixa e os gráficos foram recalculados com os novos parâmetros.',
    });
  };

  // Export to .XLSX
  const handleExportXLSX = () => {
    const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);
    const params: ScenarioSimulationParams = {
      id: scenarioState.id,
      label: scenarioState.label,
      inflowMultiplier: Number(inflowMult.toFixed(3)),
      outflowMultiplier: Number(outflowMult.toFixed(3)),
      grainPriceDeltaPct: scenarioState.grainPriceDeltaPct,
      receivablesDelayDays: scenarioState.receivablesDelayDays,
      defaultRatePct: scenarioState.defaultRatePct,
      notes: scenarioState.notes,
    };

    const periodLabels: Record<string, string> = {
      diaria: 'Diário (14 dias)',
      semanal: 'Semanal (8 semanas)',
      mensal: 'Mensal (8 meses)',
      anual: 'Safra Anual (5 Safras)',
    };

    exportCashFlowToExcel({
      rows: adjustedRows,
      farmName: activeFarm?.name || 'Todas as Fazendas',
      bankAccountName: selectedBank
        ? `${selectedBank.bankName} (${selectedBank.accountNumber})`
        : 'Todas as Contas (Consolidado)',
      scenario: params,
      periodTypeLabel: periodLabels[periodTab] || 'Mensal',
      bankAccounts,
      totalInflows,
      totalOutflows,
      minBalance: minBalanceInfo,
    });

    addToast({
      type: 'success',
      title: 'Planilha Excel (.XLSX) Gerada!',
      message: 'O download da planilha completa de fluxo de caixa foi concluído com sucesso.',
    });
  };

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Fluxo de Caixa & Projeções</h1>
          <p className="page-subtitle">
            Análise de liquidez em tempo real, saldo projetado por conta bancária e motor analítico
            de simulação de cenários de safra
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex-row flex-wrap" style={{ gap: 'var(--space-2)' }}>
          <ClayButton variant="ghost" size="sm" onClick={() => setIsCompareModalOpen(true)}>
            <GitCompare size={15} style={{ marginRight: '6px' }} />
            Comparar Cenários
          </ClayButton>

          <ClayButton variant="ghost" size="sm" onClick={handleOpenSimulator}>
            <SlidersHorizontal size={15} style={{ marginRight: '6px' }} />
            Simulador Avançado
          </ClayButton>

          <ClayButton variant="primary" size="sm" onClick={handleExportXLSX}>
            <FileSpreadsheet size={15} style={{ marginRight: '6px' }} />
            Exportar .XLSX (Excel)
          </ClayButton>
        </div>
      </div>

      {/* Filter Strip: Bank Accounts Selector */}
      <ClayCard size="sm">
        <div className="flex-between flex-wrap" style={{ gap: 'var(--space-3)' }}>
          <div className="flex-row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'bold',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginRight: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Building2 size={13} />
              Conta Bancária:
            </span>

            <button
              type="button"
              className={`filter-pill ${selectedBankId === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedBankId('all')}
            >
              Todas as Contas (Consolidado)
            </button>

            {bankAccounts.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`filter-pill ${selectedBankId === b.id ? 'active' : ''}`}
                onClick={() => setSelectedBankId(b.id)}
              >
                {b.bankName} • R${' '}
                {Number(b.balance).toLocaleString('pt-BR', { notation: 'compact' })}
              </button>
            ))}
          </div>

          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontWeight: '600' }}>Disponibilidade Atual:</span>
            <span
              style={{
                fontWeight: 'bold',
                color: 'var(--color-primary-700)',
                fontSize: 'var(--text-sm)',
              }}
            >
              R${' '}
              {(selectedBank
                ? Number(selectedBank.balance)
                : bankAccounts.reduce((sum, b) => sum + (Number(b.balance) || 0), 0)
              ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </ClayCard>

      {/* Top Bank Accounts Strip (Clickable cards to filter) */}
      <div className="grid-3">
        {bankAccounts.map((b) => {
          const isSelected = selectedBankId === b.id;
          return (
            <ClayCard
              key={b.id}
              size="sm"
              style={{
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--color-primary-500)' : '1px solid transparent',
                background: isSelected ? 'var(--color-primary-50)' : 'var(--bg-surface-1)',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => setSelectedBankId(isSelected ? 'all' : b.id)}
            >
              <div className="flex-between" style={{ marginBottom: '4px' }}>
                <div className="flex-row" style={{ gap: '6px' }}>
                  <Building2
                    size={14}
                    color={isSelected ? 'var(--color-primary-600)' : 'var(--text-tertiary)'}
                  />
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: '700',
                      color: isSelected ? 'var(--color-primary-800)' : 'var(--text-primary)',
                    }}
                  >
                    {b.bankName}
                  </span>
                </div>
                <div className="flex-row" style={{ gap: '4px' }}>
                  <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                    {b.type}
                  </span>
                  {isSelected && <CheckCircle2 size={13} color="var(--color-primary-600)" />}
                </div>
              </div>
              <div
                className="td-money"
                style={{
                  fontSize: 'var(--text-xl)',
                  color: isSelected ? 'var(--color-primary-800)' : 'var(--text-primary)',
                  fontWeight: 'bold',
                }}
              >
                R$ {Number(b.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  Ag: {b.agency} • CC: {b.accountNumber}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    color: isSelected ? 'var(--color-primary-600)' : 'var(--text-tertiary)',
                  }}
                >
                  {isSelected ? '● Filtrado' : 'Clique para filtrar'}
                </span>
              </div>
            </ClayCard>
          );
        })}
      </div>

      {/* Scenario Simulation Controller Bar & Stress Testing Metrics */}
      <ClayCard>
        <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <div className="flex-between flex-wrap" style={{ gap: 'var(--space-3)' }}>
            {/* Scenario Buttons */}
            <div className="flex-row flex-wrap" style={{ gap: 'var(--space-2)' }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'bold',
                  color: 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Layers size={13} />
                Cenário de Simulação:
              </span>

              <button
                type="button"
                className={`filter-pill ${scenarioState.id === 'realista' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('realista')}
              >
                Realista (Base)
              </button>
              <button
                type="button"
                className={`filter-pill ${scenarioState.id === 'otimista' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('otimista')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Sparkles size={13} />
                Otimista (+15%)
              </button>
              <button
                type="button"
                className={`filter-pill ${scenarioState.id === 'pessimista' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('pessimista')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <AlertTriangle size={13} />
                Pessimista (-15%)
              </button>
              {scenarioState.id === 'personalizado' && (
                <button
                  type="button"
                  className="filter-pill active"
                  onClick={handleOpenSimulator}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--color-accent-600)',
                  }}
                >
                  <SlidersHorizontal size={13} />
                  Personalizado (Ativo)
                </button>
              )}
            </div>

            <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={handleOpenSimulator}
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-primary-700)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <SlidersHorizontal size={12} />
                Ajustar Parâmetros de Stress
              </button>
            </div>
          </div>

          {/* Scenario Impact Banner Strip */}
          <div
            style={{
              background:
                scenarioState.id === 'pessimista'
                  ? 'rgba(212, 83, 59, 0.08)'
                  : scenarioState.id === 'otimista'
                    ? 'rgba(74, 133, 76, 0.08)'
                    : 'var(--bg-surface-2)',
              border:
                scenarioState.id === 'pessimista'
                  ? '1px solid rgba(212, 83, 59, 0.2)'
                  : scenarioState.id === 'otimista'
                    ? '1px solid rgba(74, 133, 76, 0.2)'
                    : '1px solid rgba(212, 201, 186, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div className="flex-row" style={{ gap: 'var(--space-3)' }}>
              {scenarioState.id === 'pessimista' ? (
                <AlertCircle size={20} color="var(--color-danger)" />
              ) : scenarioState.id === 'otimista' ? (
                <Sparkles size={20} color="var(--color-primary-600)" />
              ) : (
                <ShieldCheck size={20} color="var(--text-secondary)" />
              )}
              <div>
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                  }}
                >
                  {scenarioState.label} — {scenarioState.notes}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Multiplicador Entradas: <strong>{(inflowMult * 100).toFixed(0)}%</strong> •
                  Multiplicador Saídas: <strong>{(outflowMult * 100).toFixed(0)}%</strong> •
                  Sensibilidade Grãos:{' '}
                  <strong>
                    {scenarioState.grainPriceDeltaPct >= 0 ? '+' : ''}
                    {scenarioState.grainPriceDeltaPct}%
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex-row" style={{ gap: 'var(--space-4)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Ponto Mínimo de Caixa
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'bold',
                    color:
                      minBalanceInfo.value >= 0 ? 'var(--text-primary)' : 'var(--color-danger)',
                  }}
                >
                  R$ {minBalanceInfo.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  <span
                    style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: '4px' }}
                  >
                    ({minBalanceInfo.period.split(' ')[0]})
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  Delta vs Base Realista
                </div>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'bold',
                    color: scenarioDelta >= 0 ? 'var(--color-primary-700)' : 'var(--color-danger)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  {scenarioDelta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {scenarioDelta >= 0 ? '+' : ''} R${' '}
                  {scenarioDelta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ClayCard>

      {/* Main Chart Card */}
      <ClayCard>
        <div className="card-header flex-between flex-wrap" style={{ gap: 'var(--space-4)' }}>
          <div>
            <h2 className="card-title">
              Evolução do Fluxo de Caixa —{' '}
              {periodTab === 'mensal'
                ? 'Visão Mensal'
                : periodTab === 'semanal'
                  ? 'Visão Semanal'
                  : periodTab === 'diaria'
                    ? 'Visão Diária'
                    : 'Visão Safra Anual'}
            </h2>
            <p className="card-subtitle">
              Entradas vs Saídas apuradas com projeção de saldo conforme o cenário selecionado
            </p>
          </div>

          <ClayTabs
            tabs={[
              { id: 'diaria', label: 'Diário' },
              { id: 'semanal', label: 'Semanal' },
              { id: 'mensal', label: 'Mensal' },
              { id: 'anual', label: 'Safra Anual' },
            ]}
            activeTab={periodTab}
            onChange={(tab) => setPeriodTab(tab as 'diaria' | 'semanal' | 'mensal' | 'anual')}
            style={{ maxWidth: '380px' }}
          />
        </div>

        <CashFlowChart
          data={chartData.length > 0 ? chartData : undefined}
          scenario={scenarioState.id}
          isPreCalculated={true}
        />
      </ClayCard>

      {/* Detailed Cash Flow Ledger Table */}
      <ClayCard>
        <div className="card-header flex-between flex-wrap" style={{ gap: 'var(--space-3)' }}>
          <div>
            <h2 className="card-title">Demonstrativo Detalhado de Fluxo de Caixa</h2>
            <p className="card-subtitle">
              Valores expressos em Reais (R$) calculados a partir das contas bancárias e baixas do
              sistema
            </p>
          </div>

          <ClayButton variant="ghost" size="sm" onClick={handleExportXLSX}>
            <FileSpreadsheet size={14} style={{ marginRight: '6px' }} />
            Baixar .XLSX
          </ClayButton>
        </div>

        <div className="clay-table-wrapper">
          <table className="clay-table">
            <thead>
              <tr>
                <th>Período</th>
                <th style={{ textAlign: 'right' }}>Saldo Inicial</th>
                <th style={{ textAlign: 'right' }}>(+) Entradas</th>
                <th style={{ textAlign: 'right' }}>(-) Saídas</th>
                <th style={{ textAlign: 'right' }}>(=) Resultado Líquido</th>
                <th style={{ textAlign: 'right' }}>Saldo Final Projetado</th>
              </tr>
            </thead>
            <tbody>
              {adjustedRows.map((row) => (
                <tr key={row.period}>
                  <td style={{ fontWeight: '600' }}>
                    {row.period}
                    {row.isProjected && (
                      <span
                        className="badge badge--neutral"
                        style={{ marginLeft: '8px', fontSize: '10px' }}
                      >
                        Projeção
                      </span>
                    )}
                  </td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--text-secondary)' }}
                  >
                    R$ {row.initialBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--color-primary-700)' }}
                  >
                    + R$ {row.inflows.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--color-secondary-600)' }}
                  >
                    - R$ {row.outflows.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: row.netFlow >= 0 ? 'var(--color-primary-700)' : 'var(--color-danger)',
                    }}
                  >
                    {row.netFlow >= 0 ? '+' : ''} R${' '}
                    {row.netFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: row.finalBalance >= 0 ? 'var(--text-primary)' : 'var(--color-danger)',
                    }}
                  >
                    R$ {row.finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {adjustedRows.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}
                  >
                    Nenhum lançamento encontrado para o período e conta selecionados.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totals Summary Footer */}
            {adjustedRows.length > 0 && (
              <tfoot>
                <tr style={{ background: 'var(--bg-surface-2)', fontWeight: 'bold' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>TOTAL DO PERÍODO</td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    R${' '}
                    {adjustedRows[0].initialBalance.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-primary-700)' }}>
                    + R$ {totalInflows.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-secondary-600)' }}>
                    - R$ {totalOutflows.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color:
                        totalInflows - totalOutflows >= 0
                          ? 'var(--color-primary-700)'
                          : 'var(--color-danger)',
                    }}
                  >
                    {totalInflows - totalOutflows >= 0 ? '+' : ''} R${' '}
                    {(totalInflows - totalOutflows).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-primary)' }}>
                    R$ {finalProjectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </ClayCard>

      {/* MODAL 1: Simulador Avançado de Cenários */}
      <ClayModal
        isOpen={isSimulatorModalOpen}
        onClose={() => setIsSimulatorModalOpen(false)}
        title="Simulador Avançado de Cenários Agrícolas"
        subtitle="Ajuste fino de premissas de mercado, produtividade e stress testing de liquidez"
        maxWidth="640px"
        footer={
          <div className="flex-between w-full" style={{ width: '100%' }}>
            <ClayButton
              variant="ghost"
              size="sm"
              onClick={() => setDraftScenario(PRESET_SCENARIOS.realista)}
            >
              <RotateCcw size={14} style={{ marginRight: '6px' }} />
              Resetar para Base
            </ClayButton>
            <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
              <ClayButton variant="ghost" size="sm" onClick={() => setIsSimulatorModalOpen(false)}>
                Cancelar
              </ClayButton>
              <ClayButton variant="primary" size="sm" onClick={handleApplyDraftScenario}>
                Aplicar Cenário
              </ClayButton>
            </div>
          </div>
        }
      >
        <div className="flex-col" style={{ gap: 'var(--space-5)' }}>
          {/* Quick Presets Inside Modal */}
          <div>
            <label
              className="form-label"
              style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}
            >
              Carregar Preset Rápido
            </label>
            <div className="flex-row flex-wrap" style={{ gap: 'var(--space-2)', marginTop: '4px' }}>
              <button
                type="button"
                className={`filter-pill ${draftScenario.id === 'realista' ? 'active' : ''}`}
                onClick={() => setDraftScenario(PRESET_SCENARIOS.realista)}
              >
                Realista (0%)
              </button>
              <button
                type="button"
                className={`filter-pill ${draftScenario.id === 'otimista' ? 'active' : ''}`}
                onClick={() => setDraftScenario(PRESET_SCENARIOS.otimista)}
              >
                Otimista (+15% / -5%)
              </button>
              <button
                type="button"
                className={`filter-pill ${draftScenario.id === 'pessimista' ? 'active' : ''}`}
                onClick={() => setDraftScenario(PRESET_SCENARIOS.pessimista)}
              >
                Pessimista (-15% / +8%)
              </button>
            </div>
          </div>

          {/* Slider 1: Receitas */}
          <div>
            <div className="flex-between" style={{ marginBottom: '4px' }}>
              <label
                className="form-label"
                style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}
              >
                Variação de Receitas & Entradas
              </label>
              <span className="badge badge--primary" style={{ fontWeight: 'bold' }}>
                {draftScenario.inflowVariationPct >= 0 ? '+' : ''}
                {draftScenario.inflowVariationPct}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={draftScenario.inflowVariationPct}
              onChange={(e) =>
                setDraftScenario({
                  ...draftScenario,
                  inflowVariationPct: Number(e.target.value),
                  id: 'personalizado',
                })
              }
              style={{ width: '100%', accentColor: 'var(--color-primary-500)' }}
            />
            <div
              className="flex-between"
              style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}
            >
              <span>-50% (Quebra Severa)</span>
              <span>0% (Base)</span>
              <span>+50% (Super Safra)</span>
            </div>
          </div>

          {/* Slider 2: Custos */}
          <div>
            <div className="flex-between" style={{ marginBottom: '4px' }}>
              <label
                className="form-label"
                style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}
              >
                Variação de Custos Operacionais & Insumos
              </label>
              <span
                className="badge"
                style={{
                  fontWeight: 'bold',
                  background:
                    draftScenario.outflowVariationPct > 0
                      ? 'var(--color-danger-light)'
                      : 'var(--color-success-light)',
                  color:
                    draftScenario.outflowVariationPct > 0
                      ? 'var(--color-danger-dark)'
                      : 'var(--color-success-dark)',
                }}
              >
                {draftScenario.outflowVariationPct >= 0 ? '+' : ''}
                {draftScenario.outflowVariationPct}%
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="2"
              value={draftScenario.outflowVariationPct}
              onChange={(e) =>
                setDraftScenario({
                  ...draftScenario,
                  outflowVariationPct: Number(e.target.value),
                  id: 'personalizado',
                })
              }
              style={{ width: '100%', accentColor: 'var(--color-secondary-500)' }}
            />
            <div
              className="flex-between"
              style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}
            >
              <span>-40% (Economia/Descontos)</span>
              <span>0% (Base)</span>
              <span>+40% (Inflação de Insumos)</span>
            </div>
          </div>

          {/* Slider 3: Sensibilidade de Preço do Grão */}
          <div>
            <div className="flex-between" style={{ marginBottom: '4px' }}>
              <label
                className="form-label"
                style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}
              >
                Sensibilidade de Cotação da Saca (Soja/Milho)
              </label>
              <span className="badge badge--neutral" style={{ fontWeight: 'bold' }}>
                {draftScenario.grainPriceDeltaPct >= 0 ? '+' : ''}
                {draftScenario.grainPriceDeltaPct}%
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={draftScenario.grainPriceDeltaPct}
              onChange={(e) =>
                setDraftScenario({
                  ...draftScenario,
                  grainPriceDeltaPct: Number(e.target.value),
                  id: 'personalizado',
                })
              }
              style={{ width: '100%', accentColor: 'var(--color-accent-500)' }}
            />
            <div
              className="flex-between"
              style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}
            >
              <span>-30% (Queda CBOT)</span>
              <span>0% (Spot Atual)</span>
              <span>+30% (Alta Chicago)</span>
            </div>
          </div>

          {/* Slider 4: Inadimplência / Glosa */}
          <div>
            <div className="flex-between" style={{ marginBottom: '4px' }}>
              <label
                className="form-label"
                style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}
              >
                Taxa de Risco de Glosa / Inadimplência
              </label>
              <span className="badge badge--danger" style={{ fontWeight: 'bold' }}>
                {draftScenario.defaultRatePct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={draftScenario.defaultRatePct}
              onChange={(e) =>
                setDraftScenario({
                  ...draftScenario,
                  defaultRatePct: Number(e.target.value),
                  id: 'personalizado',
                })
              }
              style={{ width: '100%', accentColor: 'var(--color-danger)' }}
            />
          </div>
        </div>
      </ClayModal>

      {/* MODAL 2: Comparador de Cenários Lado a Lado */}
      <ClayModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Comparativo de Cenários de Fluxo de Caixa"
        subtitle="Visão lado a lado do comportamento de liquidez sob diferentes condições de safra"
        maxWidth="780px"
        footer={
          <ClayButton variant="primary" size="sm" onClick={() => setIsCompareModalOpen(false)}>
            Fechar Comparativo
          </ClayButton>
        }
      >
        <div className="clay-table-wrapper">
          <table className="clay-table">
            <thead>
              <tr>
                <th>Cenário</th>
                <th style={{ textAlign: 'right' }}>(+) Entradas</th>
                <th style={{ textAlign: 'right' }}>(-) Saídas</th>
                <th style={{ textAlign: 'right' }}>Resultado Líquido</th>
                <th style={{ textAlign: 'right' }}>Saldo Final</th>
                <th style={{ textAlign: 'center' }}>Viabilidade</th>
              </tr>
            </thead>
            <tbody>
              {/* Realista */}
              <tr>
                <td style={{ fontWeight: 'bold' }}>
                  <div className="flex-row" style={{ gap: '6px' }}>
                    <ShieldCheck size={16} color="var(--text-secondary)" />
                    <span>Realista (Base)</span>
                  </div>
                </td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  R$ {baselineRows.reduce((s, r) => s + r.inflows, 0).toLocaleString('pt-BR')}
                </td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  R$ {baselineRows.reduce((s, r) => s + r.outflows, 0).toLocaleString('pt-BR')}
                </td>
                <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  R${' '}
                  {(
                    baselineRows.reduce((s, r) => s + r.inflows, 0) -
                    baselineRows.reduce((s, r) => s + r.outflows, 0)
                  ).toLocaleString('pt-BR')}
                </td>
                <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  R$ {baselineFinalBalance.toLocaleString('pt-BR')}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="badge badge--success">Equilibrado</span>
                </td>
              </tr>

              {/* Otimista */}
              <tr>
                <td style={{ fontWeight: 'bold' }}>
                  <div className="flex-row" style={{ gap: '6px' }}>
                    <Sparkles size={16} color="var(--color-primary-600)" />
                    <span>Otimista (+15%)</span>
                  </div>
                </td>
                <td
                  className="td-money"
                  style={{ textAlign: 'right', color: 'var(--color-primary-700)' }}
                >
                  R${' '}
                  {(baselineRows.reduce((s, r) => s + r.inflows, 0) * 1.21).toLocaleString(
                    'pt-BR',
                    { maximumFractionDigits: 0 }
                  )}
                </td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  R${' '}
                  {(baselineRows.reduce((s, r) => s + r.outflows, 0) * 0.95).toLocaleString(
                    'pt-BR',
                    { maximumFractionDigits: 0 }
                  )}
                </td>
                <td
                  className="td-money"
                  style={{
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: 'var(--color-primary-700)',
                  }}
                >
                  + R${' '}
                  {(
                    baselineRows.reduce((s, r) => s + r.inflows, 0) * 1.21 -
                    baselineRows.reduce((s, r) => s + r.outflows, 0) * 0.95
                  ).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </td>
                <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  R${' '}
                  {(
                    baselineFinalBalance +
                    baselineRows.reduce((s, r) => s + r.inflows, 0) * 0.21 +
                    baselineRows.reduce((s, r) => s + r.outflows, 0) * 0.05
                  ).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="badge badge--primary">Superávit Alto</span>
                </td>
              </tr>

              {/* Pessimista */}
              <tr>
                <td style={{ fontWeight: 'bold' }}>
                  <div className="flex-row" style={{ gap: '6px' }}>
                    <AlertTriangle size={16} color="var(--color-danger)" />
                    <span>Pessimista (-15%)</span>
                  </div>
                </td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  R${' '}
                  {(baselineRows.reduce((s, r) => s + r.inflows, 0) * 0.78).toLocaleString(
                    'pt-BR',
                    { maximumFractionDigits: 0 }
                  )}
                </td>
                <td
                  className="td-money"
                  style={{ textAlign: 'right', color: 'var(--color-danger)' }}
                >
                  R${' '}
                  {(baselineRows.reduce((s, r) => s + r.outflows, 0) * 1.08).toLocaleString(
                    'pt-BR',
                    { maximumFractionDigits: 0 }
                  )}
                </td>
                <td
                  className="td-money"
                  style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}
                >
                  R${' '}
                  {(
                    baselineRows.reduce((s, r) => s + r.inflows, 0) * 0.78 -
                    baselineRows.reduce((s, r) => s + r.outflows, 0) * 1.08
                  ).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </td>
                <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  R${' '}
                  {(
                    baselineFinalBalance -
                    baselineRows.reduce((s, r) => s + r.inflows, 0) * 0.22 -
                    baselineRows.reduce((s, r) => s + r.outflows, 0) * 0.08
                  ).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="badge badge--danger">Stress de Caixa</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ClayModal>
    </div>
  );
}
