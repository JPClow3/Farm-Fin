'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { ClayTabs } from '../../components/ui/ClayTabs';
import { ClaySelect } from '../../components/ui/ClaySelect';
import { KpiCard } from '../../components/ui/KpiCard';
import { Skeleton, SkeletonKpiCard } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { calculateDRE, DREResult, FieldDREResult } from '../../actions/dre';
import { useModuleGuard } from '../../lib/useModuleGuard';
import { AppShellSkeleton } from '../../components/layout/AppShellSkeleton';
import {
  FileSpreadsheet,
  Printer,
  CircleDollarSign,
  Sprout,
  TrendingUp,
  Trophy,
  Download,
  Layers,
  Calendar,
  ArrowRight,
  Info,
  CheckCircle2,
  PieChart,
} from 'lucide-react';

export default function DrePage() {
  const moduleAllowed = useModuleGuard('dre');
  const { activeFarm, activeSeason, activeFarmId, activeSeasonId, activeFields } = useFarm();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'safra' | 'talhoes' | 'mensal'>('safra');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // '' = all year / season
  const [periodType, setPeriodType] = useState<'season' | 'annual' | 'monthly'>('season');

  const [dreData, setDreData] = useState<DREResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const loadDRE = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const monthNum = selectedMonth ? parseInt(selectedMonth, 10) : undefined;
      const res = await calculateDRE({
        farmId: activeFarmId || undefined,
        seasonId: activeSeasonId || undefined,
        fieldId: selectedFieldId || undefined,
        periodType: selectedMonth ? 'monthly' : periodType,
        year: selectedYear,
        month: monthNum,
      });

      if (res.success && res.data) {
        setDreData(res.data);
      } else {
        setDreData(null);
        if (!res.success) {
          setLoadError(res.error || 'Não foi possível apurar a DRE para o período selecionado.');
        }
      }
    } catch (err) {
      console.error('Failed to load DRE:', err);
      setDreData(null);
      setLoadError('Falha de comunicação ao calcular a DRE. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [activeFarmId, activeSeasonId, selectedFieldId, selectedYear, selectedMonth, periodType]);

  useEffect(() => {
    loadDRE();
  }, [loadDRE]);

  const grossRevenue = dreData?.grossRevenue ?? 0;
  const netRevenue = dreData?.netRevenue ?? 0;
  const taxesDeductions = dreData?.taxesDeductions ?? 0;
  const directCosts = dreData?.directCosts ?? {
    fertilizantes: 0,
    defensivos: 0,
    sementes: 0,
    combustivel: 0,
    maoDeObra: 0,
    manutencao: 0,
    total: 0,
  };
  const grossMargin = dreData?.grossMargin ?? 0;
  const grossMarginPct = dreData?.grossMarginPct ?? 0;
  const operatingExpenses = dreData?.operatingExpenses ?? {
    arrendamento: 0,
    seguroAgricola: 0,
    despesasAdm: 0,
    total: 0,
  };
  const ebitda = dreData?.ebitda ?? 0;
  const ebitdaPct = dreData?.ebitdaPct ?? 0;
  const financialExpenses = dreData?.financialExpenses ?? 0;
  const depreciation = dreData?.depreciation ?? 0;
  const netProfit = dreData?.netProfit ?? 0;
  const netProfitPct = dreData?.netProfitPct ?? 0;
  const revenueByCrop = dreData?.revenueByCrop ?? [];
  const fieldsDRE = dreData?.fieldsDRE ?? [];
  const monthlyBreakdown = dreData?.monthlyBreakdown ?? [];
  const totalPlantedArea = dreData?.totalPlantedArea ?? 0;

  const currentFieldObj = activeFields.find((f) => f.id === selectedFieldId);

  const getPeriodLabel = () => {
    if (selectedFieldId && currentFieldObj) {
      return `Talhão: ${currentFieldObj.name} (${currentFieldObj.area} ha)`;
    }
    if (selectedMonth) {
      const months = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ];
      return `${months[parseInt(selectedMonth, 10) - 1]} / ${selectedYear}`;
    }
    if (periodType === 'annual') {
      return `Ano Calendário ${selectedYear}`;
    }
    return activeSeason?.name || 'Safra 2025/2026';
  };

  const handleExportExcel = async () => {
    if (!dreData) return;
    setIsExporting(true);
    try {
      const { exportDREToExcel } = await import('../../lib/exportDREExcel');
      exportDREToExcel({
        dre: dreData,
        farmName: activeFarm?.name || 'Fazenda Modelo',
        seasonName: activeSeason?.name || 'Safra Atual',
        periodLabel: getPeriodLabel(),
      });

      addToast({
        type: 'success',
        title: 'Exportação Concluída!',
        message: `Planilha multi-abas da DRE (${getPeriodLabel()}) gerada em formato .xlsx com sucesso.`,
      });
    } catch (err) {
      console.error('Error exporting DRE to Excel:', err);
      addToast({
        type: 'error',
        title: 'Erro na Exportação',
        message: 'Não foi possível gerar a planilha Excel da DRE.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!dreData) return;
    setIsPrinting(true);
    try {
      const { generateDREPrintReport } = await import('../../lib/exportDREPdf');
      generateDREPrintReport({
        dre: dreData,
        farmName: activeFarm?.name || 'Fazenda Modelo',
        seasonName: activeSeason?.name || 'Safra Atual',
        periodLabel: getPeriodLabel(),
        farmCnpj: activeFarm?.cnpjCpf || '12.345.678/0001-90',
        farmCar: activeFarm?.carNumber || 'MT-5107909-XXXX.XXXX.XXXX',
        organizationName: 'Farm-Fin Gestão Agropecuária',
      });
    } catch (err) {
      console.error('Error generating DRE PDF report:', err);
      addToast({
        type: 'error',
        title: 'Erro ao Gerar Relatório',
        message: 'Não foi possível gerar o relatório de impressão da DRE.',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  if (!moduleAllowed) {
    return <AppShellSkeleton />;
  }

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">DRE Agrícola — {getPeriodLabel()}</h1>
          <p className="page-subtitle">
            Demonstrativo de Resultado do Exercício: Margem Bruta, EBITDA e Lucro Líquido apurados
            por Safra, Talhão (Field) e Período
          </p>
        </div>
        <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
          <ClayButton
            variant="ghost"
            onClick={handleExportExcel}
            loading={isExporting}
            disabled={!dreData}
          >
            <Download size={15} style={{ marginRight: '6px' }} />
            Exportar XLSX Multi-Abas
          </ClayButton>
          <ClayButton
            variant="primary"
            onClick={handlePrintPdf}
            loading={isPrinting}
            disabled={!dreData}
          >
            <Printer size={15} style={{ marginRight: '6px' }} />
            Imprimir / Relatório PDF
          </ClayButton>
        </div>
      </div>

      {/* Tabs for Navigation */}
      <ClayTabs
        tabs={[
          { id: 'safra', label: 'Demonstrativo Geral', icon: <Sprout size={16} /> },
          {
            id: 'talhoes',
            label: 'DRE por Talhão (Comparativo)',
            icon: <Layers size={16} />,
            count: fieldsDRE.length,
          },
          { id: 'mensal', label: 'Evolução Mensal (12 Meses)', icon: <Calendar size={16} /> },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* Filter Toolbar Strip */}
      <div
        className="clay-card"
        style={{
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          alignItems: 'center',
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Talhão (Field):
          </span>
          <select
            className="input select"
            style={{ padding: '4px 8px', fontSize: '13px', minWidth: '180px' }}
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
          >
            <option value="">Todos os Talhões (Fazenda Total)</option>
            {activeFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.area} ha - {f.currentCrop || 'Soja'})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Regime / Período:
          </span>
          <select
            className="input select"
            style={{ padding: '4px 8px', fontSize: '13px', minWidth: '150px' }}
            value={periodType}
            onChange={(e) => {
              setPeriodType(e.target.value as any);
              if (e.target.value === 'season') setSelectedMonth('');
            }}
          >
            <option value="season">Safra Completa (Ciclo)</option>
            <option value="annual">Ano Civil (12 Meses)</option>
            <option value="monthly">Mês Específico</option>
          </select>
        </div>

        {periodType === 'monthly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Mês:
            </span>
            <select
              className="input select"
              style={{ padding: '4px 8px', fontSize: '13px' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">Selecione o mês...</option>
              <option value="1">Janeiro</option>
              <option value="2">Fevereiro</option>
              <option value="3">Março</option>
              <option value="4">Abril</option>
              <option value="5">Maio</option>
              <option value="6">Junho</option>
              <option value="7">Julho</option>
              <option value="8">Agosto</option>
              <option value="9">Setembro</option>
              <option value="10">Outubro</option>
              <option value="11">Novembro</option>
              <option value="12">Dezembro</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Ano:
          </span>
          <select
            className="input select"
            style={{ padding: '4px 8px', fontSize: '13px' }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        {selectedFieldId && (
          <button
            type="button"
            onClick={() => setSelectedFieldId('')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary-600)',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Limpar Filtro de Talhão
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
          <div className="grid-4">
            <SkeletonKpiCard />
            <SkeletonKpiCard />
            <SkeletonKpiCard />
            <SkeletonKpiCard />
          </div>
          <Skeleton variant="card" height={360} />
        </div>
      ) : loadError ? (
        <ClayCard>
          <ErrorState
            title="Não foi possível carregar a DRE"
            description={loadError}
            onRetry={loadDRE}
            retrying={isLoading}
          />
        </ClayCard>
      ) : !dreData ? (
        <ClayCard>
          <EmptyState
            title="Nenhum dado disponível para este período"
            description="Não há lançamentos suficientes para apurar a DRE no período e talhão selecionados. Ajuste os filtros ou lance despesas e receitas na safra ativa."
          />
        </ClayCard>
      ) : (
        <>
          {/* Methodology Alert Banner */}
          <div
            style={{
              background: 'var(--color-primary-50)',
          borderLeft: '4px solid var(--color-primary-500)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
      >
        <Info size={18} style={{ color: 'var(--color-primary-700)', flexShrink: 0 }} />
        <div style={{ fontSize: '12.5px', color: 'var(--color-primary-900)' }}>
          <strong>Critério de Rateio Agronômico:</strong> Receitas de grãos são alocadas
          proporcionalmente à área plantada de cada cultura (sc/ha). Custos diretos são vinculados
          ao Talhão por apontamentos e insumos aplicados, e despesas fixas (arrendamento, seguro,
          adm) são rateadas por hectare total ({totalPlantedArea} ha).
        </div>
      </div>

      {/* KPIs Summary Strip */}
      <div className="grid-4">
        <KpiCard
          label="Receita Líquida Operacional"
          value={`R$ ${netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CircleDollarSign size={20} />}
          iconColor="blue"
          subtext={`R$ ${(totalPlantedArea > 0 ? netRevenue / totalPlantedArea : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / ha`}
        />
        <KpiCard
          label="Margem Bruta Agro"
          value={`${grossMarginPct.toFixed(1)}%`}
          icon={<Sprout size={20} />}
          iconColor="green"
          subtext={`R$ ${grossMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • R$ ${(totalPlantedArea > 0 ? grossMargin / totalPlantedArea : 0).toFixed(0)}/ha`}
        />
        <KpiCard
          label="EBITDA Agrícola"
          value={`${ebitdaPct.toFixed(1)}%`}
          icon={<TrendingUp size={20} />}
          iconColor="amber"
          subtext={`R$ ${ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • R$ ${(totalPlantedArea > 0 ? ebitda / totalPlantedArea : 0).toFixed(0)}/ha`}
        />
        <KpiCard
          label="Lucro Líquido da Safra"
          value={`R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Trophy size={20} />}
          iconColor="terra"
          subtext={`${netProfitPct.toFixed(1)}% • R$ ${(totalPlantedArea > 0 ? netProfit / totalPlantedArea : 0).toFixed(0)}/ha`}
        />
      </div>

      {/* TAB 1: SAFRA / DEMONSTRATIVO GERAL */}
      {activeTab === 'safra' && (
        <ClayCard>
          <div className="card-header">
            <div>
              <h2 className="card-title">Estrutura Contábil e Financeira da Safra</h2>
              <p className="card-subtitle">
                Propriedade: {activeFarm?.name || 'Fazenda'} ({totalPlantedArea} ha) • Regime:{' '}
                {getPeriodLabel()}
              </p>
            </div>
          </div>

          <div className="clay-table-wrapper">
            <table className="clay-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Conta Contábil / Descrição</th>
                  <th style={{ textAlign: 'right', width: '18%' }}>Valor (R$)</th>
                  <th style={{ textAlign: 'right', width: '16%' }}>% da Rec. Líquida</th>
                  <th style={{ textAlign: 'right', width: '16%' }}>Valor / ha (R$/ha)</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Receita Bruta */}
                <tr style={{ background: 'var(--bg-surface-2)' }}>
                  <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    (+) RECEITA OPERACIONAL BRUTA DA PRODUÇÃO
                  </td>
                  <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    R$ {grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {netRevenue > 0 ? ((grossRevenue / netRevenue) * 100).toFixed(1) : 0}%
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    R${' '}
                    {(totalPlantedArea > 0 ? grossRevenue / totalPlantedArea : 0).toLocaleString(
                      'pt-BR',
                      { minimumFractionDigits: 2 }
                    )}
                  </td>
                </tr>
                {revenueByCrop.map((rc: { crop: string; amount: number; percentage: number }) => (
                  <tr key={rc.crop}>
                    <td style={{ paddingLeft: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                      Venda de {rc.crop} (Contratos e Vendas Spot)
                    </td>
                    <td className="td-money" style={{ textAlign: 'right' }}>
                      R$ {rc.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>
                      {netRevenue > 0 ? ((rc.amount / netRevenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>
                      R${' '}
                      {(totalPlantedArea > 0 ? rc.amount / totalPlantedArea : 0).toLocaleString(
                        'pt-BR',
                        { minimumFractionDigits: 2 }
                      )}
                    </td>
                  </tr>
                ))}

                {/* Deduções */}
                <tr>
                  <td style={{ color: 'var(--color-danger-dark)' }}>
                    (-) Deduções e Contribuições (Funrural 1.5%, SENAR, Descontos Classificação)
                  </td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--color-danger)' }}
                  >
                    - R$ {taxesDeductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>-2.3%</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                    - R${' '}
                    {(totalPlantedArea > 0 ? taxesDeductions / totalPlantedArea : 0).toFixed(2)}
                  </td>
                </tr>

                {/* 2. Receita Líquida */}
                <tr style={{ background: 'var(--color-primary-50)' }}>
                  <td style={{ fontWeight: 'bold', color: 'var(--color-primary-900)' }}>
                    (=) RECEITA OPERACIONAL LÍQUIDA
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-primary-800)',
                    }}
                  >
                    R$ {netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-primary-800)',
                    }}
                  >
                    100.0%
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-primary-800)',
                    }}
                  >
                    R${' '}
                    {(totalPlantedArea > 0 ? netRevenue / totalPlantedArea : 0).toLocaleString(
                      'pt-BR',
                      { minimumFractionDigits: 2 }
                    )}
                  </td>
                </tr>

                {/* 3. Custos Diretos */}
                <tr style={{ background: 'var(--bg-surface-2)' }}>
                  <td style={{ fontWeight: 'bold', color: 'var(--color-secondary-900)' }}>
                    (-) CUSTOS DIRETOS DE PRODUÇÃO AGRÍCOLA (CPV)
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-secondary-700)',
                    }}
                  >
                    - R$ {directCosts.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-secondary-700)',
                    }}
                  >
                    -{netRevenue > 0 ? ((directCosts.total / netRevenue) * 100).toFixed(1) : 0}%
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-secondary-700)',
                    }}
                  >
                    - R${' '}
                    {(totalPlantedArea > 0 ? directCosts.total / totalPlantedArea : 0).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 'var(--space-8)' }}>
                    Fertilizantes, Corretivos e Adubação
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    - R${' '}
                    {directCosts.fertilizantes.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    -
                    {netRevenue > 0
                      ? ((directCosts.fertilizantes / netRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    - R${' '}
                    {(totalPlantedArea > 0
                      ? directCosts.fertilizantes / totalPlantedArea
                      : 0
                    ).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 'var(--space-8)' }}>
                    Defensivos Químicos (Herbicidas, Fungicidas, Inseticidas)
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    - R${' '}
                    {directCosts.defensivos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    -{netRevenue > 0 ? ((directCosts.defensivos / netRevenue) * 100).toFixed(1) : 0}
                    %
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    - R${' '}
                    {(totalPlantedArea > 0 ? directCosts.defensivos / totalPlantedArea : 0).toFixed(
                      2
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 'var(--space-8)' }}>
                    Sementes Certificadas e Tratamento
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    - R${' '}
                    {directCosts.sementes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    -{netRevenue > 0 ? ((directCosts.sementes / netRevenue) * 100).toFixed(1) : 0}%
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    - R${' '}
                    {(totalPlantedArea > 0 ? directCosts.sementes / totalPlantedArea : 0).toFixed(
                      2
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 'var(--space-8)' }}>
                    Combustíveis e Lubrificantes (Diesel S10)
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    - R${' '}
                    {directCosts.combustivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    -
                    {netRevenue > 0 ? ((directCosts.combustivel / netRevenue) * 100).toFixed(1) : 0}
                    %
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    - R${' '}
                    {(totalPlantedArea > 0
                      ? directCosts.combustivel / totalPlantedArea
                      : 0
                    ).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 'var(--space-8)' }}>
                    Mão de Obra Direta e Operadores de Campo
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    - R${' '}
                    {directCosts.maoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    -{netRevenue > 0 ? ((directCosts.maoDeObra / netRevenue) * 100).toFixed(1) : 0}%
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    - R${' '}
                    {(totalPlantedArea > 0 ? directCosts.maoDeObra / totalPlantedArea : 0).toFixed(
                      2
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 'var(--space-8)' }}>
                    Manutenção Preventiva de Tratores e Colheitadeiras
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    - R${' '}
                    {directCosts.manutencao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    -{netRevenue > 0 ? ((directCosts.manutencao / netRevenue) * 100).toFixed(1) : 0}
                    %
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    - R${' '}
                    {(totalPlantedArea > 0 ? directCosts.manutencao / totalPlantedArea : 0).toFixed(
                      2
                    )}
                  </td>
                </tr>

                {/* 4. Margem Bruta */}
                <tr style={{ background: 'var(--color-primary-100)' }}>
                  <td style={{ fontWeight: 'bold', color: 'var(--color-primary-900)' }}>
                    (=) MARGEM BRUTA DA SAFRA (LUCRO BRUTO)
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-primary-800)',
                    }}
                  >
                    R$ {grossMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-primary-800)',
                    }}
                  >
                    {grossMarginPct.toFixed(1)}%
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-primary-800)',
                    }}
                  >
                    R${' '}
                    {(totalPlantedArea > 0 ? grossMargin / totalPlantedArea : 0).toLocaleString(
                      'pt-BR',
                      { minimumFractionDigits: 2 }
                    )}
                  </td>
                </tr>

                {/* 5. Despesas Operacionais */}
                <tr style={{ background: 'var(--bg-surface-2)' }}>
                  <td style={{ fontWeight: 'bold' }}>
                    (-) DESPESAS OPERACIONAIS E ADMINISTRATIVAS (SG&A)
                  </td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}
                  >
                    - R${' '}
                    {operatingExpenses.total.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}
                  >
                    -
                    {netRevenue > 0 ? ((operatingExpenses.total / netRevenue) * 100).toFixed(1) : 0}
                    %
                  </td>
                  <td
                    style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}
                  >
                    - R${' '}
                    {(totalPlantedArea > 0
                      ? operatingExpenses.total / totalPlantedArea
                      : 0
                    ).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 'var(--space-8)' }}>Arrendamentos Rurais</td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    - R${' '}
                    {operatingExpenses.arrendamento.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    -
                    {netRevenue > 0
                      ? ((operatingExpenses.arrendamento / netRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    - R${' '}
                    {(totalPlantedArea > 0
                      ? operatingExpenses.arrendamento / totalPlantedArea
                      : 0
                    ).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 'var(--space-8)' }}>
                    Seguro Agrícola Paramétrico e Multirrisco
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    - R${' '}
                    {operatingExpenses.seguroAgricola.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    -
                    {netRevenue > 0
                      ? ((operatingExpenses.seguroAgricola / netRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    - R${' '}
                    {(totalPlantedArea > 0
                      ? operatingExpenses.seguroAgricola / totalPlantedArea
                      : 0
                    ).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingLeft: 'var(--space-8)' }}>
                    Despesas de Escritório, Contabilidade e Consultoria
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    - R${' '}
                    {operatingExpenses.despesasAdm.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    -
                    {netRevenue > 0
                      ? ((operatingExpenses.despesasAdm / netRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    - R${' '}
                    {(totalPlantedArea > 0
                      ? operatingExpenses.despesasAdm / totalPlantedArea
                      : 0
                    ).toFixed(2)}
                  </td>
                </tr>

                {/* 6. EBITDA */}
                <tr style={{ background: 'var(--color-accent-100)' }}>
                  <td style={{ fontWeight: 'bold', color: 'var(--color-accent-900)' }}>
                    (=) EBITDA AGRÍCOLA (RESULTADO OPERACIONAL)
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-accent-800)',
                    }}
                  >
                    R$ {ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-accent-800)',
                    }}
                  >
                    {ebitdaPct.toFixed(1)}%
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: 'var(--color-accent-800)',
                    }}
                  >
                    R${' '}
                    {(totalPlantedArea > 0 ? ebitda / totalPlantedArea : 0).toLocaleString(
                      'pt-BR',
                      { minimumFractionDigits: 2 }
                    )}
                  </td>
                </tr>

                {/* 7. Financeiro e Depreciação */}
                <tr>
                  <td>(-) Juros de Custeio e Financiamentos de Maquinário</td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--color-danger)' }}
                  >
                    - R$ {financialExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                    -{netRevenue > 0 ? ((financialExpenses / netRevenue) * 100).toFixed(1) : 0}%
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                    - R${' '}
                    {(totalPlantedArea > 0 ? financialExpenses / totalPlantedArea : 0).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td>(-) Depreciação Anual de Máquinas e Infraestrutura</td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--color-danger)' }}
                  >
                    - R$ {depreciation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                    -{netRevenue > 0 ? ((depreciation / netRevenue) * 100).toFixed(1) : 0}%
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                    - R$ {(totalPlantedArea > 0 ? depreciation / totalPlantedArea : 0).toFixed(2)}
                  </td>
                </tr>

                {/* 8. Lucro Líquido */}
                <tr
                  style={{
                    background: 'var(--color-primary-200)',
                    borderTop: '2px solid var(--color-primary-600)',
                  }}
                >
                  <td
                    style={{
                      fontWeight: 'bold',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-primary-900)',
                    }}
                  >
                    (=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO LÍQUIDO DA SAFRA)
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'extrabold',
                      fontSize: 'var(--text-lg)',
                      color: 'var(--color-primary-900)',
                    }}
                  >
                    R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      fontSize: 'var(--text-md)',
                      color: 'var(--color-primary-900)',
                    }}
                  >
                    {netProfitPct.toFixed(1)}%
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      fontSize: 'var(--text-md)',
                      color: 'var(--color-primary-900)',
                    }}
                  >
                    R${' '}
                    {(totalPlantedArea > 0 ? netProfit / totalPlantedArea : 0).toLocaleString(
                      'pt-BR',
                      { minimumFractionDigits: 2 }
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ClayCard>
      )}

      {/* TAB 2: DRE POR TALHÃO (COMPARATIVO) */}
      {activeTab === 'talhoes' && (
        <ClayCard>
          <div className="card-header">
            <div>
              <h2 className="card-title">Demonstrativo de Resultado por Talhão (Field)</h2>
              <p className="card-subtitle">
                Análise comparativa de margens agrícolas, custos por hectare e ponto de equilíbrio
                (break-even sc/ha)
              </p>
            </div>
          </div>

          <div className="clay-table-wrapper">
            <table className="clay-table">
              <thead>
                <tr>
                  <th>Talhão</th>
                  <th style={{ textAlign: 'right' }}>Área (ha)</th>
                  <th>Cultura</th>
                  <th style={{ textAlign: 'right' }}>Receita Rateada</th>
                  <th style={{ textAlign: 'right' }}>Custos CPV</th>
                  <th style={{ textAlign: 'right' }}>Margem Bruta</th>
                  <th style={{ textAlign: 'right' }}>EBITDA</th>
                  <th style={{ textAlign: 'right' }}>Lucro Líquido</th>
                  <th style={{ textAlign: 'right' }}>Margem / ha</th>
                  <th style={{ textAlign: 'right' }}>Lucro / ha</th>
                  <th style={{ textAlign: 'right' }}>Break-even (sc/ha)</th>
                  <th style={{ textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {fieldsDRE.map((f: FieldDREResult) => (
                  <tr
                    key={f.fieldId}
                    style={{
                      background:
                        selectedFieldId === f.fieldId ? 'var(--color-primary-50)' : undefined,
                    }}
                  >
                    <td style={{ fontWeight: 600 }}>
                      {f.fieldName}
                      {f.variety && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          Var: {f.variety}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>{f.area} ha</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: f.crop.toLowerCase().includes('soja')
                            ? 'var(--color-primary-100)'
                            : 'var(--color-accent-100)',
                          color: f.crop.toLowerCase().includes('soja')
                            ? 'var(--color-primary-800)'
                            : 'var(--color-accent-800)',
                          fontWeight: 600,
                        }}
                      >
                        {f.crop}
                      </span>
                    </td>
                    <td className="td-money" style={{ textAlign: 'right', fontWeight: 600 }}>
                      R$ {f.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </td>
                    <td
                      className="td-money"
                      style={{ textAlign: 'right', color: 'var(--color-secondary-700)' }}
                    >
                      - R${' '}
                      {f.directCosts.total.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </td>
                    <td
                      className="td-money"
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'var(--color-primary-800)',
                      }}
                    >
                      R$ {f.grossMargin.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      <span
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {f.grossMarginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td
                      className="td-money"
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'var(--color-accent-800)',
                      }}
                    >
                      R$ {f.ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </td>
                    <td
                      className="td-money"
                      style={{
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: 'var(--color-primary-900)',
                      }}
                    >
                      R$ {f.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      R$ {f.grossMarginPerHa.toFixed(0)}/ha
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: 'var(--color-primary-800)',
                      }}
                    >
                      R$ {f.netProfitPerHa.toFixed(0)}/ha
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {f.breakEvenScHa.toFixed(1)} sc/ha
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <ClayButton
                        size="sm"
                        variant={selectedFieldId === f.fieldId ? 'primary' : 'ghost'}
                        onClick={() => {
                          setSelectedFieldId(selectedFieldId === f.fieldId ? '' : f.fieldId);
                          setActiveTab('safra');
                        }}
                      >
                        {selectedFieldId === f.fieldId ? 'Ver Geral' : 'Ver DRE'}
                      </ClayButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ClayCard>
      )}

      {/* TAB 3: EVOLUÇÃO MENSAL (12 MESES) */}
      {activeTab === 'mensal' && (
        <ClayCard>
          <div className="card-header">
            <div>
              <h2 className="card-title">
                Matriz de Evolução Mensal da DRE — Exercício {selectedYear}
              </h2>
              <p className="card-subtitle">
                Acompanhamento mês a mês de faturamento, custos de safra, EBITDA e resultado líquido
              </p>
            </div>
          </div>

          <div className="clay-table-wrapper">
            <table className="clay-table">
              <thead>
                <tr>
                  <th>Mês / Período</th>
                  <th style={{ textAlign: 'right' }}>Receita Bruta</th>
                  <th style={{ textAlign: 'right' }}>Deduções</th>
                  <th style={{ textAlign: 'right' }}>Receita Líquida</th>
                  <th style={{ textAlign: 'right' }}>Custos Diretos (CPV)</th>
                  <th style={{ textAlign: 'right' }}>Margem Bruta</th>
                  <th style={{ textAlign: 'right' }}>Despesas SG&A</th>
                  <th style={{ textAlign: 'right' }}>EBITDA</th>
                  <th style={{ textAlign: 'right' }}>Lucro Líquido</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((m) => (
                  <tr key={m.monthIndex}>
                    <td style={{ fontWeight: 600 }}>{m.monthLabel}</td>
                    <td className="td-money" style={{ textAlign: 'right' }}>
                      {m.grossRevenue > 0
                        ? `R$ ${m.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                        : '—'}
                    </td>
                    <td
                      className="td-money"
                      style={{ textAlign: 'right', color: 'var(--color-danger)' }}
                    >
                      {m.taxesDeductions > 0
                        ? `- R$ ${m.taxesDeductions.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                        : '—'}
                    </td>
                    <td className="td-money" style={{ textAlign: 'right', fontWeight: 600 }}>
                      {m.netRevenue > 0
                        ? `R$ ${m.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                        : '—'}
                    </td>
                    <td
                      className="td-money"
                      style={{ textAlign: 'right', color: 'var(--color-secondary-700)' }}
                    >
                      - R$ {m.directCosts.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </td>
                    <td
                      className="td-money"
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color:
                          m.grossMargin >= 0 ? 'var(--color-primary-800)' : 'var(--color-danger)',
                      }}
                    >
                      R$ {m.grossMargin.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </td>
                    <td
                      className="td-money"
                      style={{ textAlign: 'right', color: 'var(--color-danger)' }}
                    >
                      - R${' '}
                      {m.operatingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </td>
                    <td
                      className="td-money"
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: m.ebitda >= 0 ? 'var(--color-accent-800)' : 'var(--color-danger)',
                      }}
                    >
                      R$ {m.ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </td>
                    <td
                      className="td-money"
                      style={{
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color:
                          m.netProfit >= 0 ? 'var(--color-primary-900)' : 'var(--color-danger)',
                      }}
                    >
                      R$ {m.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ClayCard>
      )}

        </>
      )}
    </div>
  );
}
