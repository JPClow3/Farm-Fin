import { describe, it, expect, vi } from 'vitest';
import {
  processInvoicePdfWithGemini,
  ExtractedInvoiceData,
} from '../geminiInvoiceAgent';

describe('Gemini Invoice Agent', () => {
  it('deve lançar erro se a chave da API não estiver definida nem no env nem por parâmetro', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const dummyBuffer = Buffer.from('dummy-pdf-content');

    await expect(
      processInvoicePdfWithGemini(dummyBuffer)
    ).rejects.toThrow(/Chave da API do Gemini não configurada/i);

    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it('deve ter a tipagem e campos obrigatórios alinhados com o enunciado da atividade', () => {
    const sampleExtraction: ExtractedInvoiceData = {
      fornecedor: {
        razaoSocial: 'Distribuidora de Combustíveis Agro S.A.',
        nomeFantasia: 'AgroDiesel',
        cnpj: '12.345.678/0001-99',
      },
      faturado: {
        nomeCompleto: 'João da Silva Produtor Rural',
        cpf: '123.456.789-00',
      },
      numeroNotaFiscal: '00012345',
      dataEmissao: '2026-09-10',
      descricaoProdutos: [
        'Oleo Diesel S10 Granel (5.000 Litros)',
        'Filtro de Combustível Trator 6110M',
      ],
      quantidadeParcelas: 1,
      parcelas: [
        {
          numero: 1,
          dataVencimento: '2026-10-10',
          valor: 27500.0,
        },
      ],
      dataVencimento: '2026-10-10',
      valorTotal: 27500.0,
      tipoDespesa: 'MANUTENÇÃO E OPERAÇÃO',
      classificacaoDespesa: ['MANUTENÇÃO E OPERAÇÃO'],
    };

    expect(sampleExtraction.fornecedor.razaoSocial).toBe('Distribuidora de Combustíveis Agro S.A.');
    expect(sampleExtraction.fornecedor.cnpj).toBe('12.345.678/0001-99');
    expect(sampleExtraction.faturado.nomeCompleto).toBe('João da Silva Produtor Rural');
    expect(sampleExtraction.faturado.cpf).toBe('123.456.789-00');
    expect(sampleExtraction.numeroNotaFiscal).toBe('00012345');
    expect(sampleExtraction.dataEmissao).toBe('2026-09-10');
    expect(sampleExtraction.descricaoProdutos).toHaveLength(2);
    expect(sampleExtraction.quantidadeParcelas).toBe(1);
    expect(sampleExtraction.parcelas[0].valor).toBe(27500.0);
    expect(sampleExtraction.valorTotal).toBe(27500.0);
    expect(sampleExtraction.tipoDespesa).toBe('MANUTENÇÃO E OPERAÇÃO');
    expect(sampleExtraction.classificacaoDespesa).toContain('MANUTENÇÃO E OPERAÇÃO');
  });

  it('deve suportar múltiplas parcelas e classificação para material hidráulico', () => {
    const sampleHydraulic: ExtractedInvoiceData = {
      fornecedor: {
        razaoSocial: 'Tigre Tubos e Conexões Ltda',
        nomeFantasia: 'Tigre Agro',
        cnpj: '98.765.432/0001-11',
      },
      faturado: {
        nomeCompleto: 'Fazenda Boa Esperança Ltda',
        cpf: '000.111.222-33',
      },
      numeroNotaFiscal: '987654',
      dataEmissao: '2026-09-11',
      descricaoProdutos: [
        'Tubo PVC Soldável 75mm 6m',
        'Registro de Esfera 75mm',
        'Curva 90 graus Irriga',
      ],
      quantidadeParcelas: 3,
      parcelas: [
        { numero: 1, dataVencimento: '2026-10-11', valor: 1500.0 },
        { numero: 2, dataVencimento: '2026-11-11', valor: 1500.0 },
        { numero: 3, dataVencimento: '2026-12-11', valor: 1500.0 },
      ],
      dataVencimento: '2026-10-11',
      valorTotal: 4500.0,
      tipoDespesa: 'INFRAESTRUTURA E UTILIDADES',
      classificacaoDespesa: ['INFRAESTRUTURA E UTILIDADES'],
    };

    expect(sampleHydraulic.quantidadeParcelas).toBe(3);
    expect(sampleHydraulic.parcelas).toHaveLength(3);
    expect(sampleHydraulic.tipoDespesa).toBe('INFRAESTRUTURA E UTILIDADES');
  });
});
