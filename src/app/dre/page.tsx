'use client';

import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { KpiCard } from '../../components/ui/KpiCard';

export default function DrePage() {
  const { activeFarm, activeSeason, activeReceivables, activePayables } = useFarm();
  const { addToast } = useToast();

  // Dynamic DRE Calculations
  const grossRevenue = activeReceivables.reduce((sum, r) => sum + r.totalAmount, 0) || 7075000;
  const taxesDeductions = grossRevenue * 0.023; // Funrural 1.5% + SENAR + descontos
  const netRevenue = grossRevenue - taxesDeductions;

  // Direct Costs
  const fertilizantes = 1280000;
  const defensivos = 840000;
  const sementes = 620000;
  const combustivel = 380000;
  const maoDeObraDireta = 220000;
  const manutencaoMaquinas = 185000;
  const totalDirectCosts =
    fertilizantes + defensivos + sementes + combustivel + maoDeObraDireta + manutencaoMaquinas;

  // Gross Margin
  const grossMargin = netRevenue - totalDirectCosts;
  const grossMarginPct = (grossMargin / netRevenue) * 100;

  // Operating Expenses
  const arrendamento = 450000;
  const despesasAdm = 180000;
  const seguroAgricola = 140000;
  const energiaOutros = 65000;
  const totalOperatingExpenses = arrendamento + despesasAdm + seguroAgricola + energiaOutros;

  // EBITDA
  const ebitda = grossMargin - totalOperatingExpenses;
  const ebitdaPct = (ebitda / netRevenue) * 100;

  // Financial & Depreciation
  const jurosFinanciamento = 210000;
  const depreciacao = 180000;

  // Net Profit
  const netProfit = ebitda - jurosFinanciamento - depreciacao;
  const netProfitPct = (netProfit / netRevenue) * 100;

  const handleExport = (format: string) => {
    addToast({
      type: 'success',
      title: 'Exportação Concluída!',
      message: `DRE da ${activeSeason.name} exportada em formato ${format}.`,
    });
  };

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">DRE Agrícola — {activeSeason.name}</h1>
          <p className="page-subtitle">
            Demonstrativo de Resultado do Exercício: Margem Bruta, EBITDA e Lucro Líquido
          </p>
        </div>
        <div className="flex-row">
          <ClayButton variant="ghost" onClick={() => handleExport('CSV / Excel')}>
            📊 Exportar Planilha (CSV)
          </ClayButton>
          <ClayButton variant="primary" onClick={() => handleExport('PDF')}>
            🖨️ Imprimir DRE
          </ClayButton>
        </div>
      </div>

      {/* KPIs Summary Strip */}
      <div className="grid-4">
        <KpiCard
          label="Receita Líquida Operacional"
          value={`R$ ${netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="💰"
          iconColor="blue"
          subtext="Venda de grãos deduzida de impostos"
        />
        <KpiCard
          label="Margem Bruta Agro"
          value={`${grossMarginPct.toFixed(1)}%`}
          icon="🌱"
          iconColor="green"
          subtext={`R$ ${grossMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        />
        <KpiCard
          label="EBITDA Agrícola"
          value={`${ebitdaPct.toFixed(1)}%`}
          icon="📈"
          iconColor="amber"
          subtext={`R$ ${ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        />
        <KpiCard
          label="Lucro Líquido da Safra"
          value={`R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="🏆"
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
              Propriedade: {activeFarm.name} ({activeFarm.totalArea} ha) • Ciclo {activeSeason.name}
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
                  {((grossRevenue / netRevenue) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                  Venda de Soja em Grão (Contratos Futuros e Físico)
                </td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  R$ {(grossRevenue * 0.85).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>85.0%</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                  Venda de Milho Safrinha
                </td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  R$ {(grossRevenue * 0.15).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>15.0%</td>
              </tr>

              {/* Deduções */}
              <tr>
                <td style={{ color: 'var(--color-danger-dark)' }}>
                  (-) Deduções e Contribuições (Funrural 1.5%, SENAR, Descontos Classificação)
                </td>
                <td className="td-money" style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                  - R$ {taxesDeductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>-2.3%</td>
              </tr>

              {/* 2. Receita Líquida */}
              <tr style={{ background: 'var(--color-primary-50)' }}>
                <td style={{ fontWeight: 'bold', color: 'var(--color-primary-900)' }}>
                  (=) RECEITA OPERACIONAL LÍQUIDA
                </td>
                <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary-800)' }}>
                  R$ {netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary-800)' }}>
                  100.0%
                </td>
              </tr>

              {/* 3. Custos Diretos */}
              <tr style={{ background: 'var(--bg-surface-2)' }}>
                <td style={{ fontWeight: 'bold', color: 'var(--color-secondary-900)' }}>
                  (-) CUSTOS DIRETOS DE PRODUÇÃO AGRÍCOLA (CPV)
                </td>
                <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-secondary-700)' }}>
                  - R$ {totalDirectCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-secondary-700)' }}>
                  -{((totalDirectCosts / netRevenue) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>Fertilizantes, Corretivos e Adubação</td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  - R$ {fertilizantes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right' }}>-{((fertilizantes / netRevenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>Defensivos Químicos (Herbicidas, Fungicidas, Inseticidas)</td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  - R$ {defensivos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right' }}>-{((defensivos / netRevenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>Sementes Certificadas e Tratamento</td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  - R$ {sementes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right' }}>-{((sementes / netRevenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>Combustíveis e Lubrificantes (Diesel S10)</td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  - R$ {combustivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right' }}>-{((combustivel / netRevenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>Mão de Obra Direta e Operadores de Campo</td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  - R$ {maoDeObraDireta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right' }}>-{((maoDeObraDireta / netRevenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>Manutenção Preventiva de Tratores e Colheitadeiras</td>
                <td className="td-money" style={{ textAlign: 'right' }}>
                  - R$ {manutencaoMaquinas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right' }}>-{((manutencaoMaquinas / netRevenue) * 100).toFixed(1)}%</td>
              </tr>

              {/* 4. Margem Bruta */}
              <tr style={{ background: 'var(--color-primary-100)' }}>
                <td style={{ fontWeight: 'bold', color: 'var(--color-primary-900)' }}>
                  (=) MARGEM BRUTA DA SAFRA (LUCRO BRUTO)
                </td>
                <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary-800)' }}>
                  R$ {grossMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary-800)' }}>
                  {grossMarginPct.toFixed(1)}%
                </td>
              </tr>

              {/* 5. Despesas Operacionais */}
              <tr style={{ background: 'var(--bg-surface-2)' }}>
                <td style={{ fontWeight: 'bold' }}>
                  (-) DESPESAS OPERACIONAIS E ADMINISTRATIVAS (SG&A)
                </td>
                <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                  - R$ {totalOperatingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-danger)' }}>
                  -{((totalOperatingExpenses / netRevenue) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>Arrendamentos Rurais</td>
                <td className="td-money" style={{ textAlign: 'right' }}>- R$ {arrendamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right' }}>-{((arrendamento / netRevenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>Seguro Agrícola Paramétrico e Multirrisco</td>
                <td className="td-money" style={{ textAlign: 'right' }}>- R$ {seguroAgricola.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right' }}>-{((seguroAgricola / netRevenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: 'var(--space-8)' }}>Despesas de Escritório, Contabilidade e Viagens</td>
                <td className="td-money" style={{ textAlign: 'right' }}>- R$ {despesasAdm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td style={{ textAlign: 'right' }}>-{((despesasAdm / netRevenue) * 100).toFixed(1)}%</td>
              </tr>

              {/* 6. EBITDA */}
              <tr style={{ background: 'var(--color-accent-100)' }}>
                <td style={{ fontWeight: 'bold', color: 'var(--color-accent-900)' }}>
                  (=) EBITDA AGRÍCOLA (RESULTADO OPERACIONAL)
                </td>
                <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-accent-800)' }}>
                  R$ {ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-accent-800)' }}>
                  {ebitdaPct.toFixed(1)}%
                </td>
              </tr>

              {/* 7. Financeiro e Depreciação */}
              <tr>
                <td>(-) Juros de Custeio e Financiamentos de Maquinário</td>
                <td className="td-money" style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                  - R$ {jurosFinanciamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>-{((jurosFinanciamento / netRevenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td>(-) Depreciação Anual de Máquinas e Infraestrutura</td>
                <td className="td-money" style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                  - R$ {depreciacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>-{((depreciacao / netRevenue) * 100).toFixed(1)}%</td>
              </tr>

              {/* 8. Lucro Líquido */}
              <tr style={{ background: 'var(--color-primary-200)', borderTop: '2px solid var(--color-primary-600)' }}>
                <td style={{ fontWeight: 'bold', fontSize: 'var(--text-base)', color: 'var(--color-primary-900)' }}>
                  (=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO LÍQUIDO DA SAFRA)
                </td>
                <td className="td-money" style={{ textAlign: 'right', fontWeight: 'extrabold', fontSize: 'var(--text-lg)', color: 'var(--color-primary-900)' }}>
                  R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 'var(--text-md)', color: 'var(--color-primary-900)' }}>
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
