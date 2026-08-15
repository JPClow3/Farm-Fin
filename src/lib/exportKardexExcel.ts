import * as XLSX from 'xlsx';
import { KardexReportItem, StockItem } from './types';

export interface KardexExcelExportOptions {
  kardexRows: KardexReportItem[];
  stockItems: StockItem[];
  farmName?: string;
  selectedItemName?: string;
  periodLabel?: string;
}

/**
 * Generates and downloads an Excel workbook (.xlsx) with:
 * - Sheet 1: Ficha Kardex Cronológica (Demonstrativo de Movimentações Contábeis de Estoque)
 * - Sheet 2: Posição de Estoque & Lotes Atual
 */
export function exportKardexToExcel(options: KardexExcelExportOptions): void {
  const {
    kardexRows,
    stockItems,
    farmName = 'Fazenda Modelo',
    selectedItemName = 'Todos os Insumos',
    periodLabel = 'Todo o Histórico',
  } = options;

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Livro Kardex de Movimentações
  // -------------------------------------------------------------
  const sheet1Data: (string | number)[][] = [
    ['FARM-FIN — SISTEMA DE GESTÃO FINANCEIRA E AGRONÔMICA'],
    ['LIVRO KARDEX DE MOVIMENTAÇÕES DE ESTOQUE (CUSTO MÉDIO PONDERADO)'],
    [''],
    ['Fazenda:', farmName, '', 'Filtro Insumo:', selectedItemName],
    ['Período:', periodLabel, '', 'Data de Emissão:', new Date().toLocaleString('pt-BR')],
    [''],
    [
      'Data',
      'Insumo',
      'Tipo Operação',
      'Doc. Fiscal / Req.',
      'Número do Lote',
      'Local / Galpão',
      'Origem / Destino',
      'Qtd. Movimentada',
      'Unidade',
      'Custo Unit. CMP (R$)',
      'Valor Operação (R$)',
      'Saldo Físico',
      'Saldo Financeiro (R$)',
    ],
  ];

  let totalEntradasQty = 0;
  let totalEntradasVal = 0;
  let totalSaidasQty = 0;
  let totalSaidasVal = 0;

  kardexRows.forEach((r) => {
    if (r.type === 'entrada') {
      totalEntradasQty += r.quantity;
      totalEntradasVal += r.totalCost;
    } else {
      totalSaidasQty += r.quantity;
      totalSaidasVal += r.totalCost;
    }

    sheet1Data.push([
      r.date,
      r.itemName,
      r.type === 'entrada' ? 'Entrada (Compra)' : 'Saída (Aplicação)',
      r.documentNumber,
      r.batchNumber || 'N/A',
      r.location || 'Galpão Geral',
      r.fieldOrSupplier,
      r.type === 'entrada' ? r.quantity : -r.quantity,
      r.unit,
      r.unitCost,
      r.totalCost,
      r.runningBalanceQty,
      r.runningBalanceValue,
    ]);
  });

  // Totals Row
  sheet1Data.push(['']);
  sheet1Data.push([
    'TOTAIS CONSOLIDADOS',
    '',
    '',
    '',
    '',
    '',
    `Total Entradas: ${totalEntradasQty.toLocaleString('pt-BR')} (R$ ${totalEntradasVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) | Total Saídas: ${totalSaidasQty.toLocaleString('pt-BR')} (R$ ${totalSaidasVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
    '',
    '',
    '',
    totalEntradasVal - totalSaidasVal,
    kardexRows.length > 0 ? kardexRows[0].runningBalanceQty : 0,
    kardexRows.length > 0 ? kardexRows[0].runningBalanceValue : 0,
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  ws1['!cols'] = [
    { wch: 12 }, // Data
    { wch: 28 }, // Insumo
    { wch: 18 }, // Tipo Operação
    { wch: 18 }, // Doc.
    { wch: 16 }, // Lote
    { wch: 22 }, // Local
    { wch: 26 }, // Origem / Destino
    { wch: 16 }, // Qtd Mov
    { wch: 8 }, // Un
    { wch: 18 }, // Custo Unit
    { wch: 20 }, // Valor Op
    { wch: 14 }, // Saldo Físico
    { wch: 22 }, // Saldo Financeiro
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Livro Kardex');

  // -------------------------------------------------------------
  // Sheet 2: Posição Atual de Estoque
  // -------------------------------------------------------------
  const sheet2Data: (string | number)[][] = [
    ['FARM-FIN — SISTEMA DE GESTÃO FINANCEIRA E AGRONÔMICA'],
    ['POSIÇÃO CONSOLIDADA DE ESTOQUE DE INSUMOS'],
    [''],
    ['Fazenda:', farmName, '', 'Data Posição:', new Date().toLocaleDateString('pt-BR')],
    [''],
    [
      'Insumo / Produto',
      'Categoria',
      'Unidade',
      'Saldo Atual',
      'Estoque Mínimo',
      'Status Segurança',
      'Custo Médio (CMP R$)',
      'Valor Imobilizado (R$)',
      'Último Fornecedor',
      'Número do Lote',
      'Localização',
      'Data de Validade',
    ],
  ];

  let totalEstoqueValor = 0;

  stockItems.forEach((item) => {
    const isLow = item.quantity <= item.minQuantity;
    const itemVal = item.quantity * item.averageCost;
    totalEstoqueValor += itemVal;

    sheet2Data.push([
      item.name,
      item.category,
      item.unit,
      item.quantity,
      item.minQuantity,
      isLow ? 'ABAIXO DO MÍNIMO' : 'NORMAL',
      item.averageCost,
      itemVal,
      item.lastSupplier || 'N/A',
      item.batchNumber || 'N/A',
      item.location || 'Galpão Geral',
      item.expiryDate || 'N/A',
    ]);
  });

  sheet2Data.push(['']);
  sheet2Data.push(['TOTAL PATRIMÔNIO IMOBILIZADO', '', '', '', '', '', '', totalEstoqueValor]);

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 30 }, // Insumo
    { wch: 18 }, // Categoria
    { wch: 8 }, // Un
    { wch: 14 }, // Saldo
    { wch: 14 }, // Mínimo
    { wch: 18 }, // Status
    { wch: 20 }, // CMP
    { wch: 22 }, // Valor Total
    { wch: 24 }, // Fornecedor
    { wch: 16 }, // Lote
    { wch: 22 }, // Local
    { wch: 16 }, // Validade
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Posição Estoque');

  // Generate and trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `FarmFin_Kardex_${farmName.replace(/\s+/g, '_')}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}
