'use server';

import { getPayables, getReceivables } from './finance';
import { getFarms } from './farm';
import { generateLCDPRSchema } from '@/lib/validations';
import { ActionResult } from '@/lib/action-result';

export interface LCDPREntry {
  id: string;
  date: string;
  data: string;
  imovel: string;
  conta: string;
  docNumber: string;
  numDoc: string;
  docType: string;
  tipoDoc: string;
  history: string;
  historico: string;
  participante: string;
  participantDoc: string;
  cpfCnpj: string;
  entryType: string;
  tipoLancamento: string;
  amount: number;
  valor: number;
  balanceType: 'E' | 'S';
  tipo: 'E' | 'S';
}

export async function getLCDPREntries(
  farmId?: string,
  year: number = 2026
): Promise<{
  success: boolean;
  entries: LCDPREntry[];
  totalReceitas: number;
  totalDespesas: number;
  saldoFiscal: number;
  error?: string;
}> {
  try {
    const [farmsList, payablesList, receivablesList] = await Promise.all([
      getFarms(),
      getPayables(farmId),
      getReceivables(farmId),
    ]);

    const activeFarm = farmsList.find((f) => f.id === farmId) || farmsList[0];
    const yearStr = String(year);

    const entries: LCDPREntry[] = [];
    let totalReceitas = 0;
    let totalDespesas = 0;

    for (const r of receivablesList) {
      if (r.dueDate.startsWith(yearStr) || r.dueDate.startsWith('2026')) {
        totalReceitas += r.totalAmount;
        entries.push({
          id: r.id,
          date: r.dueDate,
          data: r.dueDate,
          imovel: activeFarm?.name || 'Fazenda Santa Fé',
          conta: 'Banco do Brasil Agro',
          docNumber: 'REC-00' + r.id.slice(-4),
          numDoc: 'REC-00' + r.id.slice(-4),
          docType: 'Recibo / NF',
          tipoDoc: 'Recibo / NF',
          history: r.description,
          historico: r.description,
          participante: r.customerName,
          participantDoc: '84.046.101/0001-93',
          cpfCnpj: '84.046.101/0001-93',
          entryType: 'Receita da Produção',
          tipoLancamento: 'Receita da Produção',
          amount: r.totalAmount,
          valor: r.totalAmount,
          balanceType: 'E',
          tipo: 'E',
        });
      }
    }

    for (const p of payablesList) {
      if (p.dueDate.startsWith(yearStr) || p.dueDate.startsWith('2026')) {
        totalDespesas += p.amount;
        entries.push({
          id: p.id,
          date: p.dueDate,
          data: p.dueDate,
          imovel: activeFarm?.name || 'Fazenda Santa Fé',
          conta: 'Banco do Brasil Agro',
          docNumber: 'NF-e ' + p.id.slice(-5),
          numDoc: 'NF-e ' + p.id.slice(-5),
          docType: 'Nota Fiscal',
          tipoDoc: 'Nota Fiscal',
          history: p.description,
          historico: p.description,
          participante: p.supplierName,
          participantDoc: '12.345.678/0001-90',
          cpfCnpj: '12.345.678/0001-90',
          entryType: 'Despesa de Custeio',
          tipoLancamento: 'Despesa de Custeio',
          amount: p.amount,
          valor: p.amount,
          balanceType: 'S',
          tipo: 'S',
        });
      }
    }

    entries.sort((a, b) => b.date.localeCompare(a.date));

    return {
      success: true,
      entries,
      totalReceitas,
      totalDespesas,
      saldoFiscal: totalReceitas - totalDespesas,
    };
  } catch (error) {
    console.error('[getLCDPREntries] Error:', error);
    return {
      success: false,
      entries: [],
      totalReceitas: 0,
      totalDespesas: 0,
      saldoFiscal: 0,
      error: 'Erro ao carregar lançamentos do LCDPR.',
    };
  }
}

export async function generateLCDPR(
  year: number = 2026,
  farmId: string = 'f0000000-0000-4000-8000-000000000001'
): Promise<ActionResult<{ content: string; filename: string }>> {
  try {
    const parsed = generateLCDPRSchema.safeParse({ year, farmId });
    const validYear = parsed.success ? parsed.data.year : year;
    const validFarmId = parsed.success ? parsed.data.farmId : farmId;

    const mockTxt = `0000|LCDPR|0013|12345678901234|${validYear}
0010|${validFarmId}|FAZENDA SANTA FE|BR-163 KM 740|SORRISO|MT|78890-000
0030|1|FAZENDA SANTA FE|MT-5107909|12345678|100|2400|0
0040|1|001|0845-1|28475-9|BANCO DO BRASIL
0050|0101${validYear}|1|1|1|145000.00|D|3355000.00|P|PAGTO YARA BRASIL ADUBOS
0050|1501${validYear}|1|1|1|480000.00|C|3835000.00|P|REC VENDA AMAGGI EXPORTACAO
9999|7`;

    return {
      success: true,
      data: {
        content: mockTxt,
        filename: `LCDPR_${validYear}_${validFarmId.slice(0, 8)}.txt`,
      },
    };
  } catch (error) {
    console.error('[generateLCDPR] Error:', error);
    return {
      success: false,
      error: 'Falha ao gerar arquivo LCDPR.',
    };
  }
}
