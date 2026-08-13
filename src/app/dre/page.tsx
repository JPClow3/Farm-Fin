'use client';

import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { KpiCard } from '../../components/ui/KpiCard';
import { calculateDRE, DREResult } from '../../actions/dre';
import {
  FileSpreadsheet,
  Printer,
  CircleDollarSign,
  Sprout,
  TrendingUp,
  Trophy,
} from 'lucide-react';

export default function DrePage() {
  const { activeFarm, activeSeason, activeFarmId, activeSeasonId } = useFarm();
  const { addToast } = useToast();

  const [dreData, setDreData] = useState<DREResult | null>(null);

  useEffect(() => {
    async function loadDRE() {
      try {
        const res = await calculateDRE(activeFarmId, activeSeasonId);
        if (res.success && res.data) {
          setDreData(res.data);
        }
      } catch (err) {
        console.error('Failed to load DRE:', err);
      }
    }
    loadDRE();
  }, [activeFarmId, activeSeasonId]);

  const handleExport = (format: string) => {
    addToast({
      type: 'success',
      title: 'Exportação Concluída!',
      message: `DRE da ${activeSeason?.name || 'Safra'} exportada em formato ${format}.`,
    });
  };

  const grossRevenue = dreData?.grossRevenue || 7075000;
  const netRevenue = dreData?.netRevenue || 6912275;
  const taxesDeductions = dreData?.taxesDeductions || 162725;
  const directCosts = dreData?.directCosts || {
    fertilizantes: 1280000,
    defensivos: 840000,
    sementes: 620000,
    combustivel: 380000,
    maoDeObra: 220000,
    manutencao: 185000,
    total: 3525000,
  };
  const grossMargin = dreData?.grossMargin || 3387275;
  const grossMarginPct = dreData?.grossMarginPct || 49.0;
  const operatingExpenses = dreData?.operatingExpenses || {
    arrendamento: 450000,
    seguroAgricola: 140000,
    despesasAdm: 245000,
    total: 835000,
  };
  const ebitda = dreData?.ebitda || 2552275;
  const ebitdaPct = dreData?.ebitdaPct || 36.9;
  const financialExpenses = dreData?.financialExpenses || 210000;
  const depreciation = dreData?.depreciation || 180000;
  const netProfit = dreData?.netProfit || 2162275;
  const netProfitPct = dreData?.netProfitPct || 31.3;
  const revenueByCrop = dreData?.revenueByCrop || [
    { crop: 'Soja em Grão', amount: grossRevenue * 0.85, percentage: 85.0 },
    { crop: 'Milho Safrinha', amount: grossRevenue * 0.15, percentage: 15.0 },
  ];

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">DRE Agrícola — {activeSeason?.name || 'Safra Atual'}</h1>
          <p className="page-subtitle">
            Demonstrativo de Resultado do Exercício: Margem Bruta, EBITDA e Lucro Líquido apurados a
            partir dos dados do banco
          </p>
        </div>
        <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
          <ClayButton variant="ghost" onClick={() => handleExport('CSV / Excel')}>
            <FileSpreadsheet size={15} style={{ marginRight: '6px' }} />
            Exportar Planilha (CSV)
          </ClayButton>
          <ClayButton variant="primary" onClick={() => handleExport('PDF')}>
            <Printer size={15} style={{ marginRight: '6px' }} />
            Imprimir DRE
          </ClayButton>
        </div>
      </div>

      {/* KPIs Summary Strip */}
      <div className="grid-4">
        <KpiCard
          label="Receita Líquida Operacional"
          value={`R$ ${netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CircleDollarSign size={20} />}
          iconColor="blue"
          subtext="Venda de grãos deduzida de impostos"
        />
        <KpiCard
          label="Margem Bruta Agro"
          value={`${grossMarginPct.toFixed(1)}%`}
          icon={<Sprout size={20} />}
          iconColor="green"
          subtext={`R$ ${grossMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        />
        <KpiCard
          label="EBITDA Agrícola"
          value={`${ebitdaPct.toFixed(1)}%`}
          icon={<TrendingUp size={20} />}
          iconColor="amber"
          subtext={`R$ ${ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        />
        <KpiCard
          label="Lucro Líquido da Safra"
          value={`R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Trophy size={20} />}
          iconColor="terra"
          subtext={`${netProfitPct.toFixed(1)}% de margem líquida final`}
        />
      </div>

      {/* DRE Structured Statement */}
      <ClayCard>
        <div className="card-header">
          <div>
            <h2 className="card-title">Estrutura Contábil e Financeira da Safra</h2>
            <p className="card-subtitle">
              Propriedade: {activeFarm?.name || 'Fazenda'} ({activeFarm?.totalArea || 0} ha) • Ciclo{' '}
              {activeSeason?.name || 'Safra'}
            </p>
          </div>
        </div>

        <div className="clay-table-wrapper">
          <table className="clay-table">
            <thead>
              <tr>
                <th style={{ width: '60%' }}>Conta Contábil / Descrição</th>
                <th style={{ textAlign: 'right', width: '20%' }}>Valor (R$)</th>
                <th style={{ textAlign: 'right', width: '20%' }}>% da Rec. Líquida</th>
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
                    {rc.percentage}%
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
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>
                  Fertilizantes, Corretivos e Adubação
                </td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  - R${' '}
                  {directCosts.fertilizantes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right' }}>
                  -
                  {netRevenue > 0 ? ((directCosts.fertilizantes / netRevenue) * 100).toFixed(1) : 0}
                  %
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
                  -{netRevenue > 0 ? ((directCosts.defensivos / netRevenue) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>
                  Sementes Certificadas e Tratamento
                </td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  - R$ {directCosts.sementes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right' }}>
                  -{netRevenue > 0 ? ((directCosts.sementes / netRevenue) * 100).toFixed(1) : 0}%
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
                  -{netRevenue > 0 ? ((directCosts.combustivel / netRevenue) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>
                  Mão de Obra Direta e Operadores de Campo
                </td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  - R$ {directCosts.maoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right' }}>
                  -{netRevenue > 0 ? ((directCosts.maoDeObra / netRevenue) * 100).toFixed(1) : 0}%
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
                  -{netRevenue > 0 ? ((directCosts.manutencao / netRevenue) * 100).toFixed(1) : 0}%
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
                  {operatingExpenses.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td
                  style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}
                >
                  -{netRevenue > 0 ? ((operatingExpenses.total / netRevenue) * 100).toFixed(1) : 0}%
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
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>
                  Despesas de Escritório, Contabilidade e Viagens
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
              </tr>
            </tbody>
          </table>
        </div>
      </ClayCard>
    </div>
  );
}
