import { DREResult } from '@/actions/dre';

export interface DREPdfReportOptions {
  dre: DREResult;
  farmName?: string;
  seasonName?: string;
  periodLabel?: string;
  farmCnpj?: string;
  farmCar?: string;
  organizationName?: string;
}

/**
 * Triggers a clean executive PDF / print rendering for DRE with complete corporate styling,
 * headers, accounting signature fields, and paginated tables.
 */
export function generateDREPrintReport(options: DREPdfReportOptions): void {
  if (typeof window === 'undefined') return;

  const {
    dre,
    farmName = 'Fazenda Modelo',
    seasonName = 'Safra Atual',
    periodLabel = 'Safra Integral',
    farmCnpj = '00.000.000/0001-00',
    farmCar = 'MT-5107909-XXXX.XXXX.XXXX',
    organizationName = 'Farm-Fin Gestão Agropecuária',
  } = options;

  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) {
    // Fallback to standard window.print if popup blocker prevented new window
    window.print();
    return;
  }

  const formatCurrency = (val?: number) =>
    (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatPct = (val?: number) => `${(val || 0).toFixed(1)}%`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>DRE Executiva — ${farmName} — ${seasonName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a202c;
      background: #fff;
      font-size: 11px;
      line-height: 1.4;
      padding: 15px;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2d3748;
      padding-bottom: 12px;
      margin-bottom: 15px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #276749;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #718096;
      margin-top: 2px;
    }
    .report-title-box {
      text-align: right;
    }
    .report-title {
      font-size: 16px;
      font-weight: 700;
      color: #1a202c;
    }
    .report-meta {
      font-size: 10px;
      color: #718096;
      margin-top: 3px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 15px;
    }
    .info-item label {
      display: block;
      font-size: 9px;
      text-transform: uppercase;
      color: #718096;
      font-weight: 600;
    }
    .info-item span {
      font-size: 11px;
      font-weight: 700;
      color: #2d3748;
    }
    .kpi-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      background: #fff;
    }
    .kpi-card.green { border-left: 4px solid #38a169; }
    .kpi-card.blue { border-left: 4px solid #3182ce; }
    .kpi-card.amber { border-left: 4px solid #d69e2e; }
    .kpi-card.terra { border-left: 4px solid #dd6b20; }
    .kpi-label { font-size: 9px; text-transform: uppercase; color: #718096; }
    .kpi-val { font-size: 14px; font-weight: 800; color: #1a202c; margin-top: 2px; }
    .kpi-sub { font-size: 9px; color: #718096; margin-top: 2px; }
    
    table.dre-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 10.5px;
    }
    table.dre-table th {
      background: #edf2f7;
      color: #2d3748;
      font-weight: 700;
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1.5px solid #cbd5e0;
      font-size: 10px;
      text-transform: uppercase;
    }
    table.dre-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #edf2f7;
    }
    tr.section-header {
      background: #f7fafc;
      font-weight: 700;
      color: #2d3748;
    }
    tr.subtotal-row {
      background: #e6fffa;
      font-weight: 800;
      color: #234e52;
      border-top: 1.5px solid #81e6d9;
      border-bottom: 1.5px solid #81e6d9;
    }
    tr.grandtotal-row {
      background: #c6f6d5;
      font-weight: 800;
      color: #1c4532;
      border-top: 2px solid #38a169;
      border-bottom: 2px solid #38a169;
      font-size: 11.5px;
    }
    .text-right { text-align: right; }
    .indent { padding-left: 18px !important; color: #4a5568; }
    .neg-val { color: #c53030; }

    .signatures-block {
      margin-top: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      page-break-inside: avoid;
    }
    .signature-line {
      border-top: 1px solid #718096;
      padding-top: 5px;
      text-align: center;
      font-size: 10px;
      color: #4a5568;
    }
    .signature-line strong {
      display: block;
      font-size: 11px;
      color: #1a202c;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #276749; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
      🖨️ Confirmar Impressão / Salvar PDF
    </button>
    <button onclick="window.close()" style="padding: 8px 16px; background: #edf2f7; color: #4a5568; border: 1px solid #cbd5e0; border-radius: 4px; cursor: pointer;">
      Fechar
    </button>
  </div>

  <div class="report-header">
    <div>
      <div class="brand-title">Farm-Fin Agrícola</div>
      <div class="brand-subtitle">${organizationName} • Gestão Financeira Estratégica</div>
    </div>
    <div class="report-title-box">
      <div class="report-title">DRE — DEMONSTRATIVO DE RESULTADO</div>
      <div class="report-meta">Emissão: ${new Date().toLocaleString('pt-BR')}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <label>Propriedade / Fazenda</label>
      <span>${farmName}</span>
    </div>
    <div class="info-item">
      <label>Safra / Ciclo</label>
      <span>${seasonName}</span>
    </div>
    <div class="info-item">
      <label>Período / Regime</label>
      <span>${periodLabel}</span>
    </div>
    <div class="info-item">
      <label>Área Total (ha)</label>
      <span>${dre.totalPlantedArea || 2000} ha</span>
    </div>
  </div>

  <div class="kpi-cards">
    <div class="kpi-card green">
      <div class="kpi-label">Receita Líquida</div>
      <div class="kpi-val">${formatCurrency(dre.netRevenue)}</div>
      <div class="kpi-sub">${formatCurrency(dre.totalPlantedArea ? dre.netRevenue / dre.totalPlantedArea : 0)}/ha</div>
    </div>
    <div class="kpi-card blue">
      <div class="kpi-label">Margem Bruta (CPV)</div>
      <div class="kpi-val">${formatPct(dre.grossMarginPct)}</div>
      <div class="kpi-sub">${formatCurrency(dre.grossMargin)}</div>
    </div>
    <div class="kpi-card amber">
      <div class="kpi-label">EBITDA Agrícola</div>
      <div class="kpi-val">${formatPct(dre.ebitdaPct)}</div>
      <div class="kpi-sub">${formatCurrency(dre.ebitda)}</div>
    </div>
    <div class="kpi-card terra">
      <div class="kpi-label">Lucro Líquido Final</div>
      <div class="kpi-val">${formatCurrency(dre.netProfit)}</div>
      <div class="kpi-sub">Margem: ${formatPct(dre.netProfitPct)}</div>
    </div>
  </div>

  <table class="dre-table">
    <thead>
      <tr>
        <th style="width: 55%;">Estrutura Contábil / Conta</th>
        <th class="text-right" style="width: 25%;">Valor Apurado</th>
        <th class="text-right" style="width: 20%;">% Rec. Líquida</th>
      </tr>
    </thead>
    <tbody>
      <tr class="section-header">
        <td>(+) RECEITA OPERACIONAL BRUTA</td>
        <td class="text-right">${formatCurrency(dre.grossRevenue)}</td>
        <td class="text-right">${dre.netRevenue > 0 ? formatPct((dre.grossRevenue / dre.netRevenue) * 100) : '0.0%'}</td>
      </tr>
      ${(dre.revenueByCrop || [])
        .map(
          (c) => `
        <tr>
          <td class="indent">Venda de ${c.crop}</td>
          <td class="text-right">${formatCurrency(c.amount)}</td>
          <td class="text-right">${formatPct((c.amount / (dre.netRevenue || 1)) * 100)}</td>
        </tr>
      `
        )
        .join('')}
      <tr>
        <td class="neg-val">(-) Deduções e Contribuições (Funrural 1.5%, Senar)</td>
        <td class="text-right neg-val">- ${formatCurrency(dre.taxesDeductions)}</td>
        <td class="text-right neg-val">-2.3%</td>
      </tr>
      <tr class="subtotal-row">
        <td>(=) RECEITA OPERACIONAL LÍQUIDA</td>
        <td class="text-right">${formatCurrency(dre.netRevenue)}</td>
        <td class="text-right">100.0%</td>
      </tr>

      <tr class="section-header">
        <td>(-) CUSTOS DIRETOS DE PRODUÇÃO (CPV)</td>
        <td class="text-right neg-val">- ${formatCurrency(dre.directCosts?.total)}</td>
        <td class="text-right neg-val">-${dre.netRevenue > 0 ? formatPct(((dre.directCosts?.total || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>
      <tr>
        <td class="indent">Fertilizantes, Corretivos & Adubação</td>
        <td class="text-right">- ${formatCurrency(dre.directCosts?.fertilizantes)}</td>
        <td class="text-right">-${dre.netRevenue > 0 ? formatPct(((dre.directCosts?.fertilizantes || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>
      <tr>
        <td class="indent">Defensivos Químicos (Fungicidas/Herbicidas/Inseticidas)</td>
        <td class="text-right">- ${formatCurrency(dre.directCosts?.defensivos)}</td>
        <td class="text-right">-${dre.netRevenue > 0 ? formatPct(((dre.directCosts?.defensivos || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>
      <tr>
        <td class="indent">Sementes Certificadas & Tratamento</td>
        <td class="text-right">- ${formatCurrency(dre.directCosts?.sementes)}</td>
        <td class="text-right">-${dre.netRevenue > 0 ? formatPct(((dre.directCosts?.sementes || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>
      <tr>
        <td class="indent">Combustíveis & Lubrificantes (Diesel S10)</td>
        <td class="text-right">- ${formatCurrency(dre.directCosts?.combustivel)}</td>
        <td class="text-right">-${dre.netRevenue > 0 ? formatPct(((dre.directCosts?.combustivel || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>
      <tr>
        <td class="indent">Mão de Obra de Campo & Operadores</td>
        <td class="text-right">- ${formatCurrency(dre.directCosts?.maoDeObra)}</td>
        <td class="text-right">-${dre.netRevenue > 0 ? formatPct(((dre.directCosts?.maoDeObra || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>
      <tr>
        <td class="indent">Manutenção de Maquinários e Implementos</td>
        <td class="text-right">- ${formatCurrency(dre.directCosts?.manutencao)}</td>
        <td class="text-right">-${dre.netRevenue > 0 ? formatPct(((dre.directCosts?.manutencao || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>

      <tr class="subtotal-row">
        <td>(=) MARGEM BRUTA DA SAFRA</td>
        <td class="text-right">${formatCurrency(dre.grossMargin)}</td>
        <td class="text-right">${formatPct(dre.grossMarginPct)}</td>
      </tr>

      <tr class="section-header">
        <td>(-) DESPESAS OPERACIONAIS E ADMINISTRATIVAS (SG&A)</td>
        <td class="text-right neg-val">- ${formatCurrency(dre.operatingExpenses?.total)}</td>
        <td class="text-right neg-val">-${dre.netRevenue > 0 ? formatPct(((dre.operatingExpenses?.total || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>
      <tr>
        <td class="indent">Arrendamentos Rurais</td>
        <td class="text-right">- ${formatCurrency(dre.operatingExpenses?.arrendamento)}</td>
        <td class="text-right">-${dre.netRevenue > 0 ? formatPct(((dre.operatingExpenses?.arrendamento || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>
      <tr>
        <td class="indent">Seguro Agrícola Paramétrico e Multirrisco</td>
        <td class="text-right">- ${formatCurrency(dre.operatingExpenses?.seguroAgricola)}</td>
        <td class="text-right">-${dre.netRevenue > 0 ? formatPct(((dre.operatingExpenses?.seguroAgricola || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>
      <tr>
        <td class="indent">Despesas Administrativas, TI e Escritório</td>
        <td class="text-right">- ${formatCurrency(dre.operatingExpenses?.despesasAdm)}</td>
        <td class="text-right">-${dre.netRevenue > 0 ? formatPct(((dre.operatingExpenses?.despesasAdm || 0) / dre.netRevenue) * 100) : '0%'}</td>
      </tr>

      <tr class="subtotal-row">
        <td>(=) EBITDA AGRÍCOLA (RESULTADO OPERACIONAL)</td>
        <td class="text-right">${formatCurrency(dre.ebitda)}</td>
        <td class="text-right">${formatPct(dre.ebitdaPct)}</td>
      </tr>

      <tr>
        <td>(-) Despesas Financeiras e Juros de Custeio</td>
        <td class="text-right neg-val">- ${formatCurrency(dre.financialExpenses)}</td>
        <td class="text-right neg-val">-${dre.netRevenue > 0 ? formatPct((dre.financialExpenses / dre.netRevenue) * 100) : '0%'}</td>
      </tr>
      <tr>
        <td>(-) Depreciação e Amortização de Ativos</td>
        <td class="text-right neg-val">- ${formatCurrency(dre.depreciation)}</td>
        <td class="text-right neg-val">-${dre.netRevenue > 0 ? formatPct((dre.depreciation / dre.netRevenue) * 100) : '0%'}</td>
      </tr>

      <tr class="grandtotal-row">
        <td>(=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO LÍQUIDO)</td>
        <td class="text-right">${formatCurrency(dre.netProfit)}</td>
        <td class="text-right">${formatPct(dre.netProfitPct)}</td>
      </tr>
    </tbody>
  </table>

  <div class="signatures-block">
    <div class="signature-line">
      <strong>Produtor Rural / Diretor Agrícola</strong>
      Responsável pela Gestão e Execução
    </div>
    <div class="signature-line">
      <strong>Contador / Auditor Responsável</strong>
      CRC / Homologação Contábil Rural
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto open print dialog
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
