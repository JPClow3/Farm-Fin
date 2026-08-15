'use server';

import { getPayables, getReceivables } from './finance';
import { getFarms } from './farm';
import { generateLCDPRSchema } from '@/lib/validations';
import { ActionResult } from '@/lib/action-result';
import { requireModuleAccess } from '@/lib/permissionGuard';
import { writeAuditLog } from '@/lib/audit';
import { Farm } from '@/lib/types';

/**
 * LCDPR reports the DECLARANT's proportional share of revenue/expenses for
 * farms held in condomínio or parceria (multiple co-owners), per Receita
 * Federal rules for rural producers - not the farm's full operational total.
 * Individual/arrendamento/comodato exploitation types report 100%.
 */
function getDeclarantShareFactor(farm?: Farm): number {
  if (!farm) return 1;
  const isSplit = farm.exploitationType === 'condominio' || farm.exploitationType === 'parceria';
  if (!isSplit) return 1;
  const pct = farm.declarantPercentage ?? 100;
  return Math.max(0, Math.min(100, pct)) / 100;
}

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
  await requireModuleAccess('lcdpr', 'view');
  try {
    const [farmsList, payablesList, receivablesList] = await Promise.all([
      getFarms(),
      getPayables(farmId),
      getReceivables(farmId),
    ]);

    const activeFarm = farmsList.find((f) => f.id === farmId) || farmsList[0];
    const yearStr = String(year);
    const shareFactor = getDeclarantShareFactor(activeFarm);

    const entries: LCDPREntry[] = [];
    let totalReceitas = 0;
    let totalDespesas = 0;

    for (const r of receivablesList) {
      if (r.includeInLcdpr === false) continue;
      if (r.dueDate.startsWith(yearStr) || r.dueDate.startsWith('2026')) {
        const declaredAmount = r.totalAmount * shareFactor;
        totalReceitas += declaredAmount;
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
          history:
            shareFactor < 1
              ? `${r.description} (${Math.round(shareFactor * 100)}% rateio declarante)`
              : r.description,
          historico:
            shareFactor < 1
              ? `${r.description} (${Math.round(shareFactor * 100)}% rateio declarante)`
              : r.description,
          participante: r.customerName,
          participantDoc: '84.046.101/0001-93',
          cpfCnpj: '84.046.101/0001-93',
          entryType: 'Receita da Produção',
          tipoLancamento: 'Receita da Produção',
          amount: declaredAmount,
          valor: declaredAmount,
          balanceType: 'E',
          tipo: 'E',
        });
      }
    }

    for (const p of payablesList) {
      if (p.includeInLcdpr === false) continue;
      if (p.dueDate.startsWith(yearStr) || p.dueDate.startsWith('2026')) {
        const declaredAmount = p.amount * shareFactor;
        totalDespesas += declaredAmount;
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
          history:
            shareFactor < 1
              ? `${p.description} (${Math.round(shareFactor * 100)}% rateio declarante)`
              : p.description,
          historico:
            shareFactor < 1
              ? `${p.description} (${Math.round(shareFactor * 100)}% rateio declarante)`
              : p.description,
          participante: p.supplierName,
          participantDoc: '12.345.678/0001-90',
          cpfCnpj: '12.345.678/0001-90',
          entryType: 'Despesa de Custeio',
          tipoLancamento: 'Despesa de Custeio',
          amount: declaredAmount,
          valor: declaredAmount,
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
  await requireModuleAccess('lcdpr', 'manage');
  try {
    const parsed = generateLCDPRSchema.safeParse({ year, farmId });
    const validYear = parsed.success ? parsed.data.year : year;
    const validFarmId = parsed.success ? parsed.data.farmId : farmId;

    const [farmsList, report] = await Promise.all([
      getFarms(),
      getLCDPREntries(validFarmId, validYear),
    ]);
    const farm = farmsList.find((f) => f.id === validFarmId) || farmsList[0];
    const shareFactor = getDeclarantShareFactor(farm);
    const cnpjCpf = (farm?.cnpjCpf || farm?.caepf || '00000000000000').replace(/\D/g, '');
    const carNumber = farm?.carNumber || 'N/A';
    const [city, state] = (farm?.location || 'Sorriso - MT').split(' - ');

    let runningBalance = 0;
    const lines: string[] = [];
    lines.push(`0000|LCDPR|0013|${cnpjCpf}|${validYear}`);
    lines.push(`0010|${validFarmId}|${(farm?.name || 'FAZENDA').toUpperCase()}|${carNumber}|${(city || 'SORRISO').toUpperCase()}|${(state || 'MT').trim()}`);
    lines.push(
      `0030|1|${(farm?.name || 'FAZENDA').toUpperCase()}|${carNumber}|${farm?.caepf || ''}|${
        farm?.exploitationType === 'condominio' || farm?.exploitationType === 'parceria'
          ? Math.round(shareFactor * 100)
          : 100
      }|${Math.round(farm?.totalArea || 0)}|0`
    );

    // Sorted chronologically for the running balance column (report entries are newest-first)
    const chronological = [...report.entries].sort((a, b) => a.date.localeCompare(b.date));
    for (const e of chronological) {
      runningBalance += e.tipo === 'E' ? e.amount : -e.amount;
      const [yy, mm, dd] = e.date.split('-');
      const ddmmyyyy = `${dd}${mm}${yy}`;
      lines.push(
        `0050|${ddmmyyyy}|1|1|1|${e.amount.toFixed(2)}|${e.tipo}|${runningBalance.toFixed(2)}|P|${e.historico}`
      );
    }
    lines.push(`9999|${lines.length + 1}`);

    const content = lines.join('\n');

    await writeAuditLog({
      action: 'generate',
      entityType: 'lcdpr',
      entityId: validFarmId,
      details: `LCDPR ${validYear} gerado: ${chronological.length} lançamentos, saldo fiscal R$ ${report.saldoFiscal.toFixed(2)}`,
    });

    return {
      success: true,
      data: {
        content,
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
