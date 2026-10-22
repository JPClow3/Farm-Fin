import { describe, expect, it } from 'vitest';
import {
  addMonthsIso,
  buildNotaPayload,
  dividirEmParcelas,
  escapeLike,
  formatDocumento,
  identificacaoParcela,
  maskDocumento,
  normalizeDescricao,
  normalizeNumeroNota,
  parseSearchTerms,
} from '../administrativo';
import type { ExtractedInvoiceData } from '../mistralInvoiceAgent';

const nota: ExtractedInvoiceData = {
  fornecedor: {
    razaoSocial: 'IGUACU MAQUINAS AGRICOLAS LTDA',
    nomeFantasia: null,
    cnpj: '33.656.729/0023-85',
  },
  faturado: { nomeCompleto: 'BELTRANO DA SILVA', cpf: '529.982.247-25' },
  numeroNotaFiscal: '000084682',
  dataEmissao: '2026-09-28',
  descricaoProdutos: ['OLEO DIESEL S10', 'FILTRO DE AR'],
  quantidadeParcelas: 1,
  parcelas: [{ numero: 1, dataVencimento: '2026-10-28', valor: 3086.75 }],
  dataVencimento: '2026-10-28',
  valorTotal: 3086.75,
  tipoDespesa: 'MANUTENÇÃO E OPERAÇÃO',
  classificacaoDespesa: ['Manutenção e Operação', 'MANUTENÇÃO  E OPERAÇÃO'],
};

describe('projeto administrativo-financeiro: regras puras', () => {
  it('compara a mesma NF independentemente de pontos e zeros à esquerda', () => {
    expect(normalizeNumeroNota(' 000.045.892 ')).toBe('45892');
    expect(normalizeNumeroNota('45892')).toBe('45892');
    expect(normalizeNumeroNota('nf-123')).toBe('NF-123');
  });
  it('normaliza a nota extraída para gravação', () => {
    const { payload, pendencias } = buildNotaPayload(nota);
    expect(pendencias).toEqual([]);
    expect(payload.fornecedor.documento).toBe('33656729002385');
    expect(payload.faturado.documento).toBe('52998224725');
    expect(payload.despesas).toEqual(['MANUTENÇÃO E OPERAÇÃO']);
    expect(payload.parcelas).toEqual([{ dataVencimento: '2026-10-28', valor: 3086.75 }]);
    expect(payload.valorTotal).toBe(3086.75);
    expect(payload.descricao).toBe('OLEO DIESEL S10; FILTRO DE AR');
  });

  it('usa parcela única com o total quando as parcelas extraídas são inválidas', () => {
    const { payload } = buildNotaPayload({
      ...nota,
      parcelas: [{ dataVencimento: null, valor: null }],
    });
    expect(payload.parcelas).toEqual([{ dataVencimento: '2026-10-28', valor: 3086.75 }]);
  });

  it('lista pendências que impedem o lançamento', () => {
    const { pendencias } = buildNotaPayload({
      ...nota,
      fornecedor: { razaoSocial: '', cnpj: '123' },
      faturado: { nomeCompleto: 'X', cpf: '' },
      classificacaoDespesa: [],
      tipoDespesa: '',
      parcelas: [],
      dataVencimento: null,
    });
    expect(pendencias).toEqual(
      expect.arrayContaining([
        'Informe a razão social do fornecedor.',
        'Informe um CPF/CNPJ válido para o fornecedor.',
        'Informe um CPF/CNPJ válido para o faturado.',
      ])
    );
  });

  it('identifica parcela única e numeradas', () => {
    expect(identificacaoParcela(1, 1)).toBe('ÚNICA');
    expect(identificacaoParcela(2, 3)).toBe('2/3');
  });

  it('formata CPF e CNPJ', () => {
    expect(formatDocumento('11111111000100')).toBe('11.111.111/0001-00');
    expect(formatDocumento('99999999999')).toBe('999.999.999-99');
  });

  it('busca por mais de um elemento, sem repetir termos', () => {
    expect(parseSearchTerms('  iguaçu  ltda iguaçu ')).toEqual(['iguaçu', 'ltda']);
    expect(parseSearchTerms('')).toEqual([]);
  });

  it('escapa curingas do LIKE e normaliza descrições', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
    expect(normalizeDescricao('  manutenção   e operação ')).toBe('MANUTENÇÃO E OPERAÇÃO');
  });

  it('divide o total em parcelas mensais com os centavos na última', () => {
    expect(dividirEmParcelas(100, 3, '2026-01-31')).toEqual([
      { dataVencimento: '2026-01-31', valor: 33.33 },
      { dataVencimento: '2026-02-28', valor: 33.33 },
      { dataVencimento: '2026-03-31', valor: 33.34 },
    ]);
    expect(dividirEmParcelas(0, 2, '2026-01-01')).toEqual([]);
    expect(dividirEmParcelas(10, 2, '')).toEqual([]);
    expect(addMonthsIso('2026-12-15', 1)).toBe('2027-01-15');
  });

  it('aplica a máscara de CPF/CNPJ enquanto digita', () => {
    expect(maskDocumento('5299822')).toBe('529.982.2');
    expect(maskDocumento('52998224725')).toBe('529.982.247-25');
    expect(maskDocumento('336567290023')).toBe('33.656.729/0023');
    expect(maskDocumento('33656729002385')).toBe('33.656.729/0023-85');
    expect(maskDocumento('33.656.729/0023-85999')).toBe('33.656.729/0023-85');
  });
});
