import { describe, it, expect } from 'vitest';
import {
  parseValorBR,
  normalizarDataBR,
  normalizarCategoria,
  sanitizeExtraction,
  ExtractedInvoiceData,
} from '../mistralInvoiceAgent';

describe('normalização da extração de NF', () => {
  it('converte valores no formato brasileiro', () => {
    expect(parseValorBR('R$ 3.086,75')).toBe(3086.75);
    expect(parseValorBR('3086,75')).toBe(3086.75);
    expect(parseValorBR('3086.75')).toBe(3086.75);
    expect(parseValorBR(1250.5)).toBe(1250.5);
    expect(parseValorBR('abc')).toBeNull();
    expect(parseValorBR(null)).toBeNull();
  });

  it('converte datas DD/MM/AAAA para AAAA-MM-DD', () => {
    expect(normalizarDataBR('17/10/2025')).toBe('2025-10-17');
    expect(normalizarDataBR('2025-10-17')).toBe('2025-10-17');
  });

  it('mapeia categorias para as 9 oficiais', () => {
    expect(normalizarCategoria('manutencao e operacao')).toBe('MANUTENÇÃO E OPERAÇÃO');
    expect(normalizarCategoria('Compra de óleo diesel')).toBe('MANUTENÇÃO E OPERAÇÃO');
    expect(normalizarCategoria('Material hidráulico / tubo PVC')).toBe(
      'INFRAESTRUTURA E UTILIDADES'
    );
    expect(normalizarCategoria('Sementes de soja')).toBe('INSUMOS AGRÍCOLAS');
    expect(normalizarCategoria('algo desconhecido')).toBeNull();
  });

  it('sanitiza a resposta do modelo (strings BR, categorias fora do padrão)', () => {
    const raw = {
      fornecedor: { razaoSocial: 'IGUACU MAQUINAS AGRICOLAS LTDA', cnpj: '33.656.729/0023-85' },
      faturado: { nomeCompleto: 'CICLANO DA SILVA', cpf: '999.999.999-99' },
      numeroNotaFiscal: 84682,
      dataEmissao: '19/09/2025',
      descricaoProdutos: ['ROLAMENTO DE ESFERAS'],
      parcelas: [{ numero: '1', dataVencimento: '17/10/2025', valor: '3.086,75' }],
      valorTotal: 'R$ 3.086,75',
      tipoDespesa: 'Manutenção e operação',
    } as unknown as ExtractedInvoiceData;

    const result = sanitizeExtraction(raw);
    expect(result.fornecedor.nomeFantasia).toBeNull();
    expect(result.numeroNotaFiscal).toBe('84682');
    expect(result.dataEmissao).toBe('2025-09-19');
    expect(result.valorTotal).toBe(3086.75);
    expect(result.parcelas).toEqual([{ numero: 1, dataVencimento: '2025-10-17', valor: 3086.75 }]);
    expect(result.quantidadeParcelas).toBe(1);
    expect(result.dataVencimento).toBe('2025-10-17');
    expect(result.tipoDespesa).toBe('MANUTENÇÃO E OPERAÇÃO');
    expect(result.classificacaoDespesa).toEqual(['MANUTENÇÃO E OPERAÇÃO']);
  });
});
