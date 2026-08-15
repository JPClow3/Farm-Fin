import * as XLSX from 'xlsx';
import { CashFlowRow } from '@/actions/finance';
import { BankAccount } from '@/lib/types';

export interface ScenarioSimulationParams {
  id: 'realista' | 'otimista' | 'pessimista' | 'personalizado';
  label: string;
  inflowMultiplier: number; // e.g. 1.15 for +15%
  outflowMultiplier: number; // e.g. 1.08 for +8%
  grainPriceDeltaPct: number; // e.g. +10%
  receivablesDelayDays: number; // e.g. 15
  defaultRatePct: number; // e.g. 2%
  notes?: string;
}

export interface CashFlowExportOptions {
  rows: CashFlowRow[];
  farmName?: string;
  bankAccountName?: string;
  scenario: ScenarioSimulationParams;
  periodTypeLabel: string;
  bankAccounts?: BankAccount[];
  totalInflows?: number;
  totalOutflows?: number;
  minBalance?: { value: number; period: string };
}

/**
 * Generates and downloads a multi-sheet native .XLSX Excel workbook for Cash Flow Projections.
 */
export function exportCashFlowToExcel(options: CashFlowExportOptions): void {
  const {
    rows,
    farmName = 'Todas as Fazendas',
    bankAccountName = 'Todas as Contas (Consolidado)',
    scenario,
    periodTypeLabel,
    bankAccounts = [],
    totalInflows = 0,
    totalOutflows = 0,
    minBalance,
  } = options;

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Demonstrativo de Fluxo de Caixa
  // -------------------------------------------------------------
  const sheet1Data: (string | number)[][] = [
    ['FARM-FIN - SISTEMA DE GESTÃO FINANCEIRA E AGRONÔMICA'],
    ['DEMONSTRATIVO DE FLUXO DE CAIXA E PROJEÇÕES DE LIQUIDEZ'],
    [''],
    ['Fazenda:', farmName, '', 'Conta Bancária:', bankAccountName],
    [
      'Periodicidade:',
      periodTypeLabel,
      '',
      'Cenário de Simulação:',
      `${scenario.label} (${scenario.notes || ''})`,
    ],
    ['Data de Emissão:', new Date().toLocaleString('pt-BR')],
    [''],
    [
      'Período',
      'Saldo Inicial (R$)',
      '(+) Entradas (R$)',
      '(-) Saídas (R$)',
      '(=) Resultado Líquido (R$)',
      'Saldo Final Projetado (R$)',
      'Classificação',
    ],
  ];

  rows.forEach((r) => {
    sheet1Data.push([
      r.period,
      r.initialBalance,
      r.inflows,
      r.outflows,
      r.netFlow,
      r.finalBalance,
      r.isProjected ? 'Projeção Futura' : 'Realizado / Atual',
    ]);
  });

  // Totals Row
  sheet1Data.push(['']);
  sheet1Data.push([
    'TOTAIS / MÉTRICAS',
    '',
    totalInflows || rows.reduce((s, r) => s + r.inflows, 0),
    totalOutflows || rows.reduce((s, r) => s + r.outflows, 0),
    (totalInflows || rows.reduce((s, r) => s + r.inflows, 0)) -
      (totalOutflows || rows.reduce((s, r) => s + r.outflows, 0)),
    rows.length > 0 ? rows[rows.length - 1].finalBalance : 0,
    minBalance
      ? `Menor Saldo: R$ ${minBalance.value.toLocaleString('pt-BR')} (${minBalance.period})`
      : '',
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Column widths for sheet 1
  ws1['!cols'] = [
    { wch: 26 }, // Period
    { wch: 20 }, // Initial Balance
    { wch: 20 }, // Inflows
    { wch: 20 }, // Outflows
    { wch: 22 }, // Net Flow
    { wch: 24 }, // Final Balance
    { wch: 24 }, // Classification
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Fluxo de Caixa');

  // -------------------------------------------------------------
  // Sheet 2: Parâmetros do Cenário & Stress Testing
  // -------------------------------------------------------------
  const sheet2Data: (string | number)[][] = [
    ['FARM-FIN - MOTOR DE SIMULAÇÃO DE CENÁRIOS AGRÍCOLAS'],
    ['CONFIGURAÇÃO DOS PARÂMETROS DE STRESS TESTING'],
    [''],
    ['Parâmetro', 'Valor Aplicado', 'Impacto Financeiro'],
    ['Cenário Selecionado', scenario.label, scenario.notes || 'Configuração padrão'],
    [
      'Variação de Receitas / Entradas (%)',
      `${((scenario.inflowMultiplier - 1) * 100).toFixed(1)}%`,
      scenario.inflowMultiplier >= 1
        ? 'Acréscimo de receita projetada'
        : 'Redução por frustração/mercado',
    ],
    [
      'Variação de Custos / Saídas (%)',
      `${((scenario.outflowMultiplier - 1) * 100).toFixed(1)}%`,
      scenario.outflowMultiplier <= 1
        ? 'Economia / Descontos'
        : 'Aumento de custos de insumos/combustível',
    ],
    [
      'Variação no Preço da Saca de Grãos (%)',
      `${scenario.grainPriceDeltaPct >= 0 ? '+' : ''}${scenario.grainPriceDeltaPct}%`,
      'Sensibilidade de cotação CBOT/B3',
    ],
    [
      'Atraso Médio de Recebimento (Dias)',
      `${scenario.receivablesDelayDays} dias`,
      scenario.receivablesDelayDays > 0
        ? 'Deslocamento de liquidez para períodos seguintes'
        : 'Pontualidade total',
    ],
    [
      'Taxa Estimada de Inadimplência / Glosa (%)',
      `${scenario.defaultRatePct}%`,
      'Dedução preventiva sobre recebíveis spot',
    ],
    [''],
    ['MÉTRICAS RESULTANTES DA SIMULAÇÃO'],
    ['Saldo Inicial Consolidado (R$)', rows.length > 0 ? rows[0].initialBalance : 0],
    ['Saldo Final no Cenário Base (R$)', rows.length > 0 ? rows[rows.length - 1].finalBalance : 0],
    [
      'Ponto Crítico de Liquidez (Menor Saldo)',
      minBalance ? `R$ ${minBalance.value.toLocaleString('pt-BR')} (${minBalance.period})` : 'N/A',
    ],
    [
      'Status de Liquidez',
      (minBalance?.value ?? 0) >= 0
        ? 'SUSTENTÁVEL (Sem necessidade de aporte)'
        : 'ALERTA DE ILIQUIDEZ (Exige crédito ou remanejamento)',
    ],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [{ wch: 38 }, { wch: 25 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Parâmetros do Cenário');

  // -------------------------------------------------------------
  // Sheet 3: Posição das Contas Bancárias
  // -------------------------------------------------------------
  if (bankAccounts.length > 0) {
    const sheet3Data: (string | number)[][] = [
      ['FARM-FIN - CONTAS BANCÁRIAS E DISPONIBILIDADES'],
      ['POSIÇÃO FINANCEIRA POR CONTA'],
      [''],
      ['Instituição Bancária', 'Tipo de Conta', 'Agência', 'Número da Conta', 'Saldo Atual (R$)'],
    ];

    bankAccounts.forEach((b) => {
      sheet3Data.push([b.bankName, b.type, b.agency, b.accountNumber, Number(b.balance)]);
    });

    const totalBalance = bankAccounts.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
    sheet3Data.push(['']);
    sheet3Data.push(['SALDO TOTAL CONSOLIDADO', '', '', '', totalBalance]);

    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
    ws3['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Posição Bancária');
  }

  // Trigger Download
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  const nowStr = new Date().toISOString().split('T')[0];
  const cleanFarm = farmName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanScenario = scenario.id;
  const fileName = `Fluxo_de_Caixa_${cleanFarm}_${cleanScenario}_${nowStr}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
