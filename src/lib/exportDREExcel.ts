import * as XLSX from 'xlsx';
import { DREResult } from '@/actions/dre';

export interface DREExportOptions {
  dre: DREResult;
  farmName?: string;
  seasonName?: string;
  periodLabel?: string;
}

/**
 * Generates and downloads an executive multi-sheet native .XLSX Excel workbook for Agricultural DRE.
 * Includes:
 * 1. DRE Analítica & Sintética (Full Structured Financial Statement)
 * 2. DRE por Talhão (Field-by-field comparative metrics & margins/ha)
 * 3. DRE Mensal (12-month evolution matrix)
 * 4. Detalhamento de Insumos & Grãos
 */
export function exportDREToExcel(options: DREExportOptions): void {
  const { dre, farmName = 'Todas as Fazendas', seasonName = 'Safra Atual', periodLabel } = options;

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: DRE Analítica
  // -------------------------------------------------------------
  const sheet1Data: (string | number)[][] = [
    ['FARM-FIN - SISTEMA DE GESTÃO FINANCEIRA E AGRONÔMICA'],
    ['DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO (DRE AGRÍCOLA)'],
    [''],
    ['Fazenda:', farmName, '', 'Safra / Exercício:', seasonName],
    [
      'Período de Apuração:',
      periodLabel || dre.periodType?.toUpperCase() || 'SAFRA INTEGRAL',
      '',
      'Data de Emissão:',
      new Date().toLocaleString('pt-BR'),
    ],
    [
      'Método de Rateio de Receita:',
      dre.revenueAllocationMethod || 'Proporcional por Área da Cultura (sc/ha e R$/ha)',
    ],
    ['Área Total Considerada (ha):', dre.totalPlantedArea || 2000],
    [''],
    [
      'CONTA / RUBRICA CONTÁBIL',
      'VALOR (R$)',
      '% SOBRE REC. LÍQUIDA',
      'VALOR / HA (R$/ha)',
      'NATUREZA',
    ],
    [
      '1. (+) RECEITA OPERACIONAL BRUTA',
      dre.grossRevenue,
      dre.netRevenue > 0 ? `${((dre.grossRevenue / dre.netRevenue) * 100).toFixed(1)}%` : '0.0%',
      dre.totalPlantedArea ? dre.grossRevenue / dre.totalPlantedArea : 0,
      'Receita Bruta',
    ],
  ];

  // Revenue by crop sub-items
  (dre.revenueByCrop || []).forEach((c) => {
    sheet1Data.push([
      `   (+) Comercialização de ${c.crop}`,
      c.amount,
      dre.netRevenue > 0 ? `${((c.amount / dre.netRevenue) * 100).toFixed(1)}%` : '0.0%',
      dre.totalPlantedArea ? c.amount / dre.totalPlantedArea : 0,
      'Venda de Grãos',
    ]);
  });

  sheet1Data.push([
    '2. (-) DEDUÇÕES DA RECEITA BRUTA (Funrural 1.5%, SENAR, Impostos/Taxas)',
    -dre.taxesDeductions,
    dre.netRevenue > 0 ? `${((-dre.taxesDeductions / dre.netRevenue) * 100).toFixed(1)}%` : '0.0%',
    dre.totalPlantedArea ? -dre.taxesDeductions / dre.totalPlantedArea : 0,
    'Dedução Legal',
  ]);

  sheet1Data.push([
    '3. (=) RECEITA OPERACIONAL LÍQUIDA',
    dre.netRevenue,
    '100.0%',
    dre.totalPlantedArea ? dre.netRevenue / dre.totalPlantedArea : 0,
    'Subtotal',
  ]);

  sheet1Data.push(['']);
  sheet1Data.push([
    '4. (-) CUSTOS DIRETOS DE PRODUÇÃO AGRÍCOLA (CPV)',
    -(dre.directCosts?.total || 0),
    dre.netRevenue > 0
      ? `${((-(dre.directCosts?.total || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.directCosts?.total || 0) / dre.totalPlantedArea : 0,
    'Custo Direto',
  ]);

  sheet1Data.push([
    '   (-) Fertilizantes, Corretivos & Adubação',
    -(dre.directCosts?.fertilizantes || 0),
    dre.netRevenue > 0
      ? `${((-(dre.directCosts?.fertilizantes || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.directCosts?.fertilizantes || 0) / dre.totalPlantedArea : 0,
    'Insumo',
  ]);
  sheet1Data.push([
    '   (-) Defensivos Agrícolas (Fungicidas, Herbicidas, Inseticidas)',
    -(dre.directCosts?.defensivos || 0),
    dre.netRevenue > 0
      ? `${((-(dre.directCosts?.defensivos || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.directCosts?.defensivos || 0) / dre.totalPlantedArea : 0,
    'Insumo',
  ]);
  sheet1Data.push([
    '   (-) Sementes Certificadas & Tratamento',
    -(dre.directCosts?.sementes || 0),
    dre.netRevenue > 0
      ? `${((-(dre.directCosts?.sementes || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.directCosts?.sementes || 0) / dre.totalPlantedArea : 0,
    'Insumo',
  ]);
  sheet1Data.push([
    '   (-) Combustíveis & Lubrificantes (Diesel S10)',
    -(dre.directCosts?.combustivel || 0),
    dre.netRevenue > 0
      ? `${((-(dre.directCosts?.combustivel || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.directCosts?.combustivel || 0) / dre.totalPlantedArea : 0,
    'Operacional',
  ]);
  sheet1Data.push([
    '   (-) Mão de Obra Direta de Campo & Operadores',
    -(dre.directCosts?.maoDeObra || 0),
    dre.netRevenue > 0
      ? `${((-(dre.directCosts?.maoDeObra || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.directCosts?.maoDeObra || 0) / dre.totalPlantedArea : 0,
    'Pessoal',
  ]);
  sheet1Data.push([
    '   (-) Manutenção de Maquinários, Tratores & Implementos',
    -(dre.directCosts?.manutencao || 0),
    dre.netRevenue > 0
      ? `${((-(dre.directCosts?.manutencao || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.directCosts?.manutencao || 0) / dre.totalPlantedArea : 0,
    'Manutenção',
  ]);

  sheet1Data.push(['']);
  sheet1Data.push([
    '5. (=) MARGEM BRUTA DA SAFRA (LUCRO BRUTO)',
    dre.grossMargin,
    `${dre.grossMarginPct.toFixed(1)}%`,
    dre.totalPlantedArea ? dre.grossMargin / dre.totalPlantedArea : 0,
    'Margem Agro',
  ]);

  sheet1Data.push(['']);
  sheet1Data.push([
    '6. (-) DESPESAS OPERACIONAIS E ADMINISTRATIVAS (SG&A)',
    -(dre.operatingExpenses?.total || 0),
    dre.netRevenue > 0
      ? `${((-(dre.operatingExpenses?.total || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.operatingExpenses?.total || 0) / dre.totalPlantedArea : 0,
    'Despesa Indireta',
  ]);
  sheet1Data.push([
    '   (-) Arrendamentos Rurais de Terras',
    -(dre.operatingExpenses?.arrendamento || 0),
    dre.netRevenue > 0
      ? `${((-(dre.operatingExpenses?.arrendamento || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.operatingExpenses?.arrendamento || 0) / dre.totalPlantedArea : 0,
    'Fixa',
  ]);
  sheet1Data.push([
    '   (-) Seguro Agrícola & Proteção Climática',
    -(dre.operatingExpenses?.seguroAgricola || 0),
    dre.netRevenue > 0
      ? `${((-(dre.operatingExpenses?.seguroAgricola || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.operatingExpenses?.seguroAgricola || 0) / dre.totalPlantedArea : 0,
    'Fixa',
  ]);
  sheet1Data.push([
    '   (-) Despesas Administrativas, TI, Escritório & Consultoria',
    -(dre.operatingExpenses?.despesasAdm || 0),
    dre.netRevenue > 0
      ? `${((-(dre.operatingExpenses?.despesasAdm || 0) / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -(dre.operatingExpenses?.despesasAdm || 0) / dre.totalPlantedArea : 0,
    'Administrativa',
  ]);

  sheet1Data.push(['']);
  sheet1Data.push([
    '7. (=) EBITDA AGRÍCOLA (LAJIDA - GERAÇÃO OPERACIONAL)',
    dre.ebitda,
    `${dre.ebitdaPct.toFixed(1)}%`,
    dre.totalPlantedArea ? dre.ebitda / dre.totalPlantedArea : 0,
    'Resultado Operacional',
  ]);

  sheet1Data.push([
    '8. (-) Despesas Financeiras & Juros de Financiamento/Custeio',
    -dre.financialExpenses,
    dre.netRevenue > 0
      ? `${((-dre.financialExpenses / dre.netRevenue) * 100).toFixed(1)}%`
      : '0.0%',
    dre.totalPlantedArea ? -dre.financialExpenses / dre.totalPlantedArea : 0,
    'Financeiro',
  ]);
  sheet1Data.push([
    '9. (-) Depreciação & Amortização de Ativos Agrícolas',
    -dre.depreciation,
    dre.netRevenue > 0 ? `${((-dre.depreciation / dre.netRevenue) * 100).toFixed(1)}%` : '0.0%',
    dre.totalPlantedArea ? -dre.depreciation / dre.totalPlantedArea : 0,
    'Não-Caixa',
  ]);

  sheet1Data.push(['']);
  sheet1Data.push([
    '10. (=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO LÍQUIDO)',
    dre.netProfit,
    `${dre.netProfitPct.toFixed(1)}%`,
    dre.totalPlantedArea ? dre.netProfit / dre.totalPlantedArea : 0,
    'Resultado Final',
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = [{ wch: 60 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'DRE Analítica');

  // -------------------------------------------------------------
  // Sheet 2: DRE por Talhão (Comparativo & Margens por Hectare)
  // -------------------------------------------------------------
  const sheet2Data: (string | number)[][] = [
    ['FARM-FIN - DEMONSTRATIVO DE RESULTADO POR TALHÃO (ANÁLISE COMPARATIVA)'],
    ['Fazenda:', farmName, '', 'Safra:', seasonName],
    ['Critério de Rateio de Receita:', 'Proporcional à área cultivada de cada cultura (sc/ha)'],
    [''],
    [
      'Talhão',
      'Área (ha)',
      'Cultura',
      'Variedade',
      'Receita Bruta (R$)',
      'Custos Insumos (R$)',
      'Mão de Obra/Op (R$)',
      'Custo Total CPV (R$)',
      'Margem Bruta (R$)',
      'Margem Bruta (%)',
      'EBITDA (R$)',
      'Lucro Líquido (R$)',
      'Receita/ha (R$)',
      'Custo/ha (R$)',
      'Margem/ha (R$)',
      'Lucro/ha (R$)',
      'Break-even (sc/ha)',
    ],
  ];

  (dre.fieldsDRE || []).forEach((f) => {
    const inputsSum =
      f.directCosts.fertilizantes + f.directCosts.defensivos + f.directCosts.sementes;
    const opsSum = f.directCosts.combustivel + f.directCosts.maoDeObra + f.directCosts.manutencao;

    sheet2Data.push([
      f.fieldName,
      f.area,
      f.crop,
      f.variety || '-',
      f.grossRevenue,
      inputsSum,
      opsSum,
      f.directCosts.total,
      f.grossMargin,
      `${f.grossMarginPct.toFixed(1)}%`,
      f.ebitda,
      f.netProfit,
      f.revenuePerHa,
      f.directCostsPerHa,
      f.grossMarginPerHa,
      f.netProfitPerHa,
      parseFloat(f.breakEvenScHa.toFixed(1)),
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 25 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'DRE por Talhão');

  // -------------------------------------------------------------
  // Sheet 3: DRE Mensal (12 Meses)
  // -------------------------------------------------------------
  const sheet3Data: (string | number)[][] = [
    ['FARM-FIN - MATRIZ DE EVOLUÇÃO MENSAL DA DRE (12 MESES)'],
    ['Fazenda:', farmName, '', 'Exercício:', String(dre.year || 2026)],
    [''],
    [
      'Mês / Competência',
      'Receita Bruta (R$)',
      'Deduções (R$)',
      'Receita Líquida (R$)',
      'Custos Diretos (R$)',
      'Margem Bruta (R$)',
      'Despesas SG&A (R$)',
      'EBITDA (R$)',
      'Desp. Financ. (R$)',
      'Depreciação (R$)',
      'Lucro Líquido (R$)',
    ],
  ];

  (dre.monthlyBreakdown || []).forEach((m) => {
    sheet3Data.push([
      m.monthLabel,
      m.grossRevenue,
      -m.taxesDeductions,
      m.netRevenue,
      -m.directCosts,
      m.grossMargin,
      -m.operatingExpenses,
      m.ebitda,
      -m.financialExpenses,
      -m.depreciation,
      m.netProfit,
    ]);
  });

  // Add Totals row
  const sumGross = (dre.monthlyBreakdown || []).reduce((s, m) => s + m.grossRevenue, 0);
  const sumTaxes = (dre.monthlyBreakdown || []).reduce((s, m) => s + m.taxesDeductions, 0);
  const sumNet = (dre.monthlyBreakdown || []).reduce((s, m) => s + m.netRevenue, 0);
  const sumCPV = (dre.monthlyBreakdown || []).reduce((s, m) => s + m.directCosts, 0);
  const sumMarg = (dre.monthlyBreakdown || []).reduce((s, m) => s + m.grossMargin, 0);
  const sumOpEx = (dre.monthlyBreakdown || []).reduce((s, m) => s + m.operatingExpenses, 0);
  const sumEbitda = (dre.monthlyBreakdown || []).reduce((s, m) => s + m.ebitda, 0);
  const sumFin = (dre.monthlyBreakdown || []).reduce((s, m) => s + m.financialExpenses, 0);
  const sumDep = (dre.monthlyBreakdown || []).reduce((s, m) => s + m.depreciation, 0);
  const sumProfit = (dre.monthlyBreakdown || []).reduce((s, m) => s + m.netProfit, 0);

  sheet3Data.push(['']);
  sheet3Data.push([
    'TOTAL ACUMULADO',
    sumGross,
    -sumTaxes,
    sumNet,
    -sumCPV,
    sumMarg,
    -sumOpEx,
    sumEbitda,
    -sumFin,
    -sumDep,
    sumProfit,
  ]);

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'DRE Mensal');

  // -------------------------------------------------------------
  // Sheet 4: Composição de Receitas & Custos
  // -------------------------------------------------------------
  const sheet4Data: (string | number)[][] = [
    ['FARM-FIN - DETALHAMENTO DE RECEITAS POR CULTURA E INSUMOS'],
    [''],
    ['1. RECEITAS POR CULTURA AGRÍCOLA'],
    ['Cultura Agrícola', 'Faturamento Bruto (R$)', 'Participação (%)', 'Faturamento / ha (R$/ha)'],
  ];

  (dre.revenueByCrop || []).forEach((c) => {
    sheet4Data.push([
      c.crop,
      c.amount,
      `${c.percentage.toFixed(1)}%`,
      dre.totalPlantedArea ? c.amount / dre.totalPlantedArea : 0,
    ]);
  });

  sheet4Data.push([
    'Total Comercializado',
    dre.grossRevenue,
    '100.0%',
    dre.totalPlantedArea ? dre.grossRevenue / dre.totalPlantedArea : 0,
  ]);
  sheet4Data.push(['']);
  sheet4Data.push(['2. ESTRUTURA DE CUSTOS DIRETOS (CPV AGRÍCOLA)']);
  sheet4Data.push([
    'Item / Categoria de Custo',
    'Valor Total (R$)',
    '% dos Custos Diretos',
    'Custo / ha (R$/ha)',
  ]);

  const dc = dre.directCosts || {
    fertilizantes: 0,
    defensivos: 0,
    sementes: 0,
    combustivel: 0,
    maoDeObra: 0,
    manutencao: 0,
    total: 1,
  };
  const totalDC = dc.total || 1;

  const costItems = [
    { name: 'Fertilizantes, Adubação e Corretivos', val: dc.fertilizantes },
    { name: 'Defensivos Agrícolas (Químicos)', val: dc.defensivos },
    { name: 'Sementes Certificadas', val: dc.sementes },
    { name: 'Combustíveis e Óleo Diesel S10', val: dc.combustivel },
    { name: 'Mão de Obra de Campo e Operadores', val: dc.maoDeObra },
    { name: 'Manutenção de Máquinas e Implementos', val: dc.manutencao },
  ];

  costItems.forEach((ci) => {
    sheet4Data.push([
      ci.name,
      ci.val,
      `${((ci.val / totalDC) * 100).toFixed(1)}%`,
      dre.totalPlantedArea ? ci.val / dre.totalPlantedArea : 0,
    ]);
  });

  sheet4Data.push([
    'Total Custos Diretos',
    dc.total,
    '100.0%',
    dre.totalPlantedArea ? dc.total / dre.totalPlantedArea : 0,
  ]);

  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
  ws4['!cols'] = [{ wch: 45 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'Composição & Insumos');

  // -------------------------------------------------------------
  // Download file in browser
  // -------------------------------------------------------------
  const nowStr = new Date().toISOString().split('T')[0];
  const safeFarm = farmName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeSeason = seasonName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `DRE_${safeFarm}_${safeSeason}_${nowStr}.xlsx`;

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
