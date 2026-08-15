'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useFarm } from '../../context/FarmContext';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { ClayTabs } from '../../components/ui/ClayTabs';
import { ClaySelect } from '../../components/ui/ClaySelect';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ApportionmentMatrix } from '../../components/finance/ApportionmentMatrix';
import { ClayModal } from '../../components/ui/ClayModal';
import {
  Field,
  SeasonHistoricalMetrics,
  CrossSeasonComparisonResult,
  ApportionmentCalculationResult,
} from '../../lib/types';
import { getFieldCostsSummary, CalculatedFieldCost } from '../../actions/farm';
import { getCrossSeasonComparison } from '../../actions/season-comparison';
import { useModuleGuard } from '../../lib/useModuleGuard';
import { AppShellSkeleton } from '../../components/layout/AppShellSkeleton';
import {
  Sprout,
  BarChart3,
  Wheat,
  MapPin,
  TrendingUp,
  History,
  Layers,
  Scale,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

const FieldComparisonChart = dynamic(
  () => import('../../components/charts/FieldComparisonChart').then((m) => m.FieldComparisonChart),
  { loading: () => <Skeleton variant="card" height={260} />, ssr: false }
);
const CrossSeasonChart = dynamic(
  () => import('../../components/charts/CrossSeasonChart').then((m) => m.CrossSeasonChart),
  { loading: () => <Skeleton variant="card" height={260} />, ssr: false }
);

export default function CustosPage() {
  const moduleAllowed = useModuleGuard('custos');
  const { activeFarm, activeFields, activeFarmId, activeSeasonId, activeStockMovements } =
    useFarm();
  const [activeTab, setActiveTab] = useState<'talhoes' | 'historico' | 'rateio'>('talhoes');

  const [selectedFieldForDetail, setSelectedFieldForDetail] = useState<Field | null>(null);
  const [fieldsCalculated, setFieldsCalculated] = useState<CalculatedFieldCost[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [avgCostHa, setAvgCostHa] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Cross-season comparison state
  const [seasonComparison, setSeasonComparison] = useState<CrossSeasonComparisonResult | null>(
    null
  );
  const [cropFilter, setCropFilter] = useState('Todos');
  const [isSeasonLoading, setIsSeasonLoading] = useState(false);

  // Load field costs
  const loadCustos = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await getFieldCostsSummary(activeFarmId, activeSeasonId);
      if (res.success) {
        setFieldsCalculated(res.fields);
        setTotalCost(res.totalCost);
        setAvgCostHa(res.avgCostHa);
      } else {
        setFieldsCalculated([]);
        setLoadError('Não foi possível apurar os custos por talhão para esta safra.');
      }
    } catch (err) {
      console.error('Failed to load field costs:', err);
      setFieldsCalculated([]);
      setLoadError('Falha de comunicação ao carregar os custos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [activeFarmId, activeSeasonId]);

  useEffect(() => {
    loadCustos();
  }, [loadCustos]);

  // Load cross-season comparison data
  useEffect(() => {
    async function loadSeasonComparison() {
      setIsSeasonLoading(true);
      try {
        const res = await getCrossSeasonComparison(activeFarmId, cropFilter);
        setSeasonComparison(res);
      } catch (err) {
        console.error('Failed to load season comparison:', err);
      } finally {
        setIsSeasonLoading(false);
      }
    }
    loadSeasonComparison();
  }, [activeFarmId, cropFilter]);

  const displayedFields = fieldsCalculated;
  const displayTotal = totalCost;
  const displayAvgHa = avgCostHa;

  const chartData = displayedFields.map((f) => ({
    fieldName: f.field.name,
    area: f.field.area,
    totalCost: f.totalCost,
    costPerHa: f.costPerHa,
  }));

  // Callback when apportionment is applied from the rateio tab
  const handleApportionmentApplied = (result: ApportionmentCalculationResult) => {
    // Update local displayed field costs with new overhead allocations
    const updated = displayedFields.map((df) => {
      const alloc = result.allocations.find((a) => a.fieldId === df.field.id);
      if (alloc) {
        return {
          ...df,
          overheadCost: alloc.allocatedOverhead,
          totalCost: alloc.finalTotalCost,
          costPerHa: alloc.finalTotalCostPerHa,
        };
      }
      return df;
    });

    setFieldsCalculated(updated);
    setTotalCost(result.summary.totalFinalCost);
    setAvgCostHa(result.summary.avgFinalCostPerHa);
  };

  if (!moduleAllowed) {
    return <AppShellSkeleton />;
  }

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Gestão de Custos & Análise Multissafra</h1>
          <p className="page-subtitle">
            Apuração analítica por talhão, comparativo histórico inter-safras e motor de rateio de
            custos fixos
          </p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid-4">
        <KpiCard
          loading={isLoading}
          label="Custo Total Consolidado"
          value={`R$ ${displayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Sprout size={20} />}
          iconColor="terra"
          subtext={`Área total: ${activeFarm?.totalArea || 0} ha`}
        />
        <KpiCard
          loading={isLoading}
          label="Custo Médio por Hectare"
          value={`R$ ${displayAvgHa.toFixed(2)}/ha`}
          icon={<BarChart3 size={20} />}
          iconColor="amber"
          trend={{
            value: '-4.2%',
            direction: 'up',
            label: 'economia vs meta',
          }}
        />
        <KpiCard
          loading={isLoading}
          label="Custo Estimado por Saca"
          value={`R$ ${(displayAvgHa / 62).toFixed(2)}/sc`}
          icon={<Wheat size={20} />}
          iconColor="green"
          subtext="Base: 62 sc/ha produtividade média"
        />
        <KpiCard
          label="Talhões Monitorados"
          value={`${activeFields.length} unidades`}
          icon={<MapPin size={20} />}
          iconColor="blue"
          subtext="100% da área coberta"
        />
      </div>

      {/* Navigation Tabs */}
      <ClayTabs
        tabs={[
          { id: 'talhoes', label: 'Custo por Talhão (Safra Vigente)' },
          { id: 'historico', label: 'Comparativo Inter-Safras' },
          { id: 'rateio', label: 'Motor de Rateio de Custos Fixos' },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as 'talhoes' | 'historico' | 'rateio')}
      />

      {/* TAB 1: Custo por Talhão */}
      {activeTab === 'talhoes' && isLoading && (
        <div className="flex-col" style={{ gap: 'var(--space-5)' }}>
          <Skeleton variant="card" height={260} />
          <Skeleton variant="card" height={320} />
        </div>
      )}

      {activeTab === 'talhoes' && !isLoading && loadError && (
        <ClayCard>
          <ErrorState
            title="Não foi possível carregar os custos"
            description={loadError}
            onRetry={loadCustos}
          />
        </ClayCard>
      )}

      {activeTab === 'talhoes' && !isLoading && !loadError && displayedFields.length === 0 && (
        <ClayCard>
          <EmptyState
            title="Nenhum custo apurado para esta safra"
            description="Ainda não há lançamentos de insumos, maquinário ou mão de obra vinculados aos talhões desta safra."
          />
        </ClayCard>
      )}

      {activeTab === 'talhoes' && !isLoading && !loadError && displayedFields.length > 0 && (
        <>
          {/* Main Comparison Chart */}
          <ClayCard>
            <div className="card-header">
              <div>
                <h2 className="card-title">Comparativo de Desempenho (R$ / Hectare)</h2>
                <p className="card-subtitle">
                  Identifique talhões com sobrecusto ou maior eficiência operacional
                </p>
              </div>
            </div>
            <FieldComparisonChart fieldsData={chartData} />
          </ClayCard>

          {/* Detailed Field Cost Table */}
          <ClayCard>
            <div className="card-header">
              <div>
                <h2 className="card-title">Detalhamento de Custos por Talhão</h2>
                <p className="card-subtitle">
                  Breakdown em insumos aplicados, maquinário, mão de obra e custos indiretos
                </p>
              </div>
            </div>

            <div className="clay-table-wrapper">
              <table className="clay-table">
                <thead>
                  <tr>
                    <th>Talhão</th>
                    <th>Área (ha)</th>
                    <th>Cultura</th>
                    <th style={{ textAlign: 'right' }}>Insumos (R$)</th>
                    <th style={{ textAlign: 'right' }}>Maquinário (R$)</th>
                    <th style={{ textAlign: 'right' }}>Mão de Obra (R$)</th>
                    <th style={{ textAlign: 'right' }}>Overhead Rateado (R$)</th>
                    <th style={{ textAlign: 'right' }}>Custo Total</th>
                    <th style={{ textAlign: 'right' }}>R$ / Hectare</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedFields.map((item) => (
                    <tr key={item.field.id}>
                      <td style={{ fontWeight: '600' }}>{item.field.name}</td>
                      <td>{item.field.area} ha</td>
                      <td>
                        <span className="badge badge--primary">{item.field.currentCrop}</span>
                      </td>
                      <td className="td-money" style={{ textAlign: 'right' }}>
                        R$ {item.inputsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="td-money" style={{ textAlign: 'right' }}>
                        R${' '}
                        {item.machineryCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="td-money" style={{ textAlign: 'right' }}>
                        R$ {item.laborCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className="td-money"
                        style={{ textAlign: 'right', color: 'var(--color-primary-700)' }}
                      >
                        R$ {item.overheadCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        R$ {item.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className="td-money"
                        style={{
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color:
                            item.costPerHa > 1150
                              ? 'var(--color-secondary-600)'
                              : 'var(--color-primary-700)',
                        }}
                      >
                        R$ {item.costPerHa.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <ClayButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFieldForDetail(item.field)}
                        >
                          Ver Extrato
                        </ClayButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ClayCard>
        </>
      )}

      {/* TAB 2: Comparativo Inter-Safras */}
      {activeTab === 'historico' && (
        <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
          {/* Season Filter & Overview */}
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  alignSelf: 'center',
                }}
              >
                Filtrar Cultura:
              </span>
              {['Todos', 'Soja', 'Milho', 'Algodão'].map((crop) => (
                <ClayButton
                  key={crop}
                  variant={cropFilter === crop ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCropFilter(crop)}
                >
                  {crop}
                </ClayButton>
              ))}
            </div>
          </div>

          {/* Side-by-Side Season KPI Cards */}
          {seasonComparison && (
            <div className="grid-4">
              {seasonComparison.seasons.map((season) => (
                <ClayCard
                  key={season.seasonId}
                  className={season.isCurrent ? 'clay-card--secondary' : ''}
                  style={{
                    border: season.isCurrent ? '2px solid var(--color-primary-600)' : undefined,
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                      {season.crop}
                    </span>
                    {season.isCurrent && <span className="badge badge--success">Vigente</span>}
                  </div>

                  <h3
                    style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', marginBottom: '4px' }}
                  >
                    {season.seasonName}
                  </h3>

                  <div
                    style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: '800',
                      color: 'var(--color-primary-700)',
                      marginBottom: '8px',
                    }}
                  >
                    R$ {season.costPerHa.toFixed(2)} / ha
                  </div>

                  <div
                    className="flex-col"
                    style={{
                      gap: '6px',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <div className="flex-between">
                      <span>Área Plantada:</span>
                      <strong>{season.plantedArea} ha</strong>
                    </div>
                    <div className="flex-between">
                      <span>Produtividade:</span>
                      <strong>{season.productivityScHa} sc/ha</strong>
                    </div>
                    <div className="flex-between">
                      <span>Custo por Saca:</span>
                      <strong style={{ color: 'var(--color-primary-700)' }}>
                        R$ {season.costPerBag.toFixed(2)}/sc
                      </strong>
                    </div>
                    <div className="flex-between">
                      <span>Receita Bruta:</span>
                      <strong>R$ {(season.grossRevenue / 1000000).toFixed(2)}M</strong>
                    </div>
                    <div className="flex-between">
                      <span>Ponto de Equilíbrio:</span>
                      <strong style={{ color: 'var(--color-secondary-600)' }}>
                        {season.breakevenYieldScHa} sc/ha
                      </strong>
                    </div>
                    <div
                      className="flex-between"
                      style={{ borderTop: '1px solid rgba(212,201,186,0.4)', paddingTop: '6px' }}
                    >
                      <span>Margem Bruta:</span>
                      <strong style={{ color: 'var(--color-success-700)' }}>
                        {season.grossMarginPct}%
                      </strong>
                    </div>
                  </div>
                </ClayCard>
              ))}
            </div>
          )}

          {/* Interactive Multi-Season Comparison Chart */}
          {seasonComparison && (
            <ClayCard>
              <div className="card-header">
                <div>
                  <h2 className="card-title">Análise Comparativa Multissafra (Evolução Visual)</h2>
                  <p className="card-subtitle">
                    Alterne entre visão de resultado financeiro, estrutura de custos por hectare e
                    curva de produtividade
                  </p>
                </div>
              </div>
              <CrossSeasonChart seasons={seasonComparison.seasons} />
            </ClayCard>
          )}

          {/* Year-over-Year (YoY) Variations Table */}
          {seasonComparison && seasonComparison.variations.length > 0 && (
            <ClayCard>
              <div className="card-header">
                <div>
                  <h2 className="card-title">Variações Período a Período (Δ% Ano a Ano)</h2>
                  <p className="card-subtitle">
                    Acompanhe a evolução de inflação de custos, ganhos de produtividade e expansão
                    de margens
                  </p>
                </div>
              </div>

              <div className="clay-table-wrapper">
                <table className="clay-table">
                  <thead>
                    <tr>
                      <th>Comparação de Períodos</th>
                      <th style={{ textAlign: 'center' }}>Δ% Receita Bruta</th>
                      <th style={{ textAlign: 'center' }}>Δ% Custo Total</th>
                      <th style={{ textAlign: 'center' }}>Δ% Custo (R$/ha)</th>
                      <th style={{ textAlign: 'center' }}>Δ% Produtividade</th>
                      <th style={{ textAlign: 'center' }}>Δ% Lucro Líquido</th>
                      <th style={{ textAlign: 'center' }}>Δ Margem Bruta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasonComparison.variations.map((v, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: '600' }}>
                          {v.seasonA} →{' '}
                          <span style={{ color: 'var(--color-primary-700)' }}>{v.seasonB}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`badge ${
                              v.revenueVarPct >= 0 ? 'badge--success' : 'badge--secondary'
                            }`}
                          >
                            {v.revenueVarPct >= 0 ? `+${v.revenueVarPct}%` : `${v.revenueVarPct}%`}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`badge ${
                              v.costVarPct <= 0 ? 'badge--success' : 'badge--secondary'
                            }`}
                          >
                            {v.costVarPct >= 0 ? `+${v.costVarPct}%` : `${v.costVarPct}%`}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`badge ${
                              v.costPerHaVarPct <= 0 ? 'badge--success' : 'badge--secondary'
                            }`}
                          >
                            {v.costPerHaVarPct >= 0
                              ? `+${v.costPerHaVarPct}%`
                              : `${v.costPerHaVarPct}%`}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`badge ${
                              v.productivityVarPct >= 0 ? 'badge--success' : 'badge--secondary'
                            }`}
                          >
                            {v.productivityVarPct >= 0
                              ? `+${v.productivityVarPct}%`
                              : `${v.productivityVarPct}%`}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`badge ${
                              v.netProfitVarPct >= 0 ? 'badge--success' : 'badge--secondary'
                            }`}
                          >
                            {v.netProfitVarPct >= 0
                              ? `+${v.netProfitVarPct}%`
                              : `${v.netProfitVarPct}%`}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color:
                              v.marginVarPct >= 0
                                ? 'var(--color-success-700)'
                                : 'var(--color-secondary-600)',
                          }}
                        >
                          {v.marginVarPct >= 0
                            ? `+${v.marginVarPct} p.p.`
                            : `${v.marginVarPct} p.p.`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ClayCard>
          )}

          {/* Comprehensive Multi-Season Matrix Table */}
          {seasonComparison && (
            <ClayCard>
              <div className="card-header">
                <div>
                  <h2 className="card-title">Demonstrativo Multissafra Completo</h2>
                  <p className="card-subtitle">
                    Tabela analítica consolidada com todos os indicadores econômico-agronômicos
                  </p>
                </div>
              </div>

              <div className="clay-table-wrapper">
                <table className="clay-table">
                  <thead>
                    <tr>
                      <th>Safra / Exercício</th>
                      <th>Área (ha)</th>
                      <th style={{ textAlign: 'right' }}>Receita Total (R$)</th>
                      <th style={{ textAlign: 'right' }}>Custo Total (R$)</th>
                      <th style={{ textAlign: 'right' }}>Custo (R$/ha)</th>
                      <th style={{ textAlign: 'right' }}>Produtividade (sc/ha)</th>
                      <th style={{ textAlign: 'right' }}>Custo / Saca</th>
                      <th style={{ textAlign: 'right' }}>Preço Médio / sc</th>
                      <th style={{ textAlign: 'right' }}>Breakeven (sc/ha)</th>
                      <th style={{ textAlign: 'right' }}>Margem Bruta</th>
                      <th style={{ textAlign: 'right' }}>Lucro Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasonComparison.seasons.map((h) => (
                      <tr key={h.seasonId}>
                        <td style={{ fontWeight: '600' }}>{h.seasonName}</td>
                        <td>{h.plantedArea} ha</td>
                        <td className="td-money" style={{ textAlign: 'right' }}>
                          R$ {h.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="td-money" style={{ textAlign: 'right' }}>
                          R$ {h.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          R$ {h.costPerHa.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          {h.productivityScHa} sc/ha
                        </td>
                        <td
                          className="td-money"
                          style={{
                            textAlign: 'right',
                            color: 'var(--color-primary-700)',
                            fontWeight: 'bold',
                          }}
                        >
                          R$ {h.costPerBag.toFixed(2)}
                        </td>
                        <td className="td-money" style={{ textAlign: 'right' }}>
                          R$ {h.averagePricePerBag.toFixed(2)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            color: 'var(--color-secondary-600)',
                            fontWeight: 'bold',
                          }}
                        >
                          {h.breakevenYieldScHa} sc/ha
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            color: 'var(--color-success-700)',
                            fontWeight: 'bold',
                          }}
                        >
                          {h.grossMarginPct}%
                        </td>
                        <td
                          className="td-money"
                          style={{
                            textAlign: 'right',
                            color: 'var(--color-success-700)',
                            fontWeight: 'bold',
                          }}
                        >
                          R$ {h.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ClayCard>
          )}
        </div>
      )}

      {/* TAB 3: Motor de Rateio de Custos Indiretos */}
      {activeTab === 'rateio' && (
        <ApportionmentMatrix
          farmId={activeFarmId}
          seasonId={activeSeasonId}
          fields={activeFields}
          onApportionmentApplied={handleApportionmentApplied}
        />
      )}

      {/* Field Detail Modal */}
      {selectedFieldForDetail && (
        <ClayModal
          isOpen={true}
          onClose={() => setSelectedFieldForDetail(null)}
          title={`Extrato de Custos: ${selectedFieldForDetail.name}`}
          subtitle={`Área: ${selectedFieldForDetail.area} ha • Solo: ${selectedFieldForDetail.soilType}`}
        >
          <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>
              Aplicações de Insumos Registradas:
            </h4>
            <div className="flex-col" style={{ gap: '6px' }}>
              {activeStockMovements
                .filter((m) => m.fieldId === selectedFieldForDetail.id)
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex-between"
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-surface-2)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: 'var(--text-xs)' }}>
                        {m.itemName} ({m.quantity} {m.unit})
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        {m.date} • {m.machinery} ({m.operator})
                      </div>
                    </div>
                    <span className="td-money" style={{ fontSize: 'var(--text-xs)' }}>
                      R$ {m.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              {activeStockMovements.filter((m) => m.fieldId === selectedFieldForDetail.id)
                .length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '8px 0' }}>
                  Nenhuma aplicação individualizada registrada. Os custos foram alocados
                  proporcionalmente.
                </div>
              )}
            </div>

            <div className="modal__footer">
              <ClayButton variant="ghost" onClick={() => setSelectedFieldForDetail(null)}>
                Fechar Extrato
              </ClayButton>
            </div>
          </div>
        </ClayModal>
      )}
    </div>
  );
}
