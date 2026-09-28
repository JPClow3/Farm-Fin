import { describe, expect, it } from 'vitest';
import { evaluateInvoiceQuality } from '../invoiceQuality';
import type { ExtractedInvoiceData } from '../mistralInvoiceAgent';

const validInvoice: ExtractedInvoiceData = {
  fornecedor: { razaoSocial: 'Fornecedor Ltda', nomeFantasia: null, cnpj: '11.222.333/0001-81' },
  faturado: { nomeCompleto: 'Cliente', cpf: '529.982.247-25' },
  numeroNotaFiscal: '123',
  dataEmissao: '2026-09-28',
  descricaoProdutos: ['Sementes'],
  quantidadeParcelas: 2,
  parcelas: [
    { numero: 1, dataVencimento: '2026-10-28', valor: 50 },
    { numero: 2, dataVencimento: '2026-11-28', valor: 50 },
  ],
  dataVencimento: '2026-10-28',
  valorTotal: 100,
  tipoDespesa: 'INSUMOS AGRÍCOLAS',
  classificacaoDespesa: ['INSUMOS AGRÍCOLAS'],
};

describe('invoice extraction review', () => {
  it('leaves a consistent invoice without review warnings', () => {
    expect(
      evaluateInvoiceQuality(validInvoice, [{ index: 0, average: 0.95, minimum: 0.88 }])
    ).toEqual({
      required: false,
      issues: [],
      ocrMinimumPageConfidence: 0.95,
    });
  });

  it('flags impossible dates, invalid documents, and parcel mismatch', () => {
    const invoice = structuredClone(validInvoice);
    invoice.fornecedor.cnpj = '11.111.111/1111-11';
    invoice.faturado.cpf = '999.999.999-99';
    invoice.dataEmissao = '2026-02-30';
    invoice.parcelas[1].valor = 30;
    const review = evaluateInvoiceQuality(invoice);
    expect(review.required).toBe(true);
    expect(review.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['fornecedor.cnpj', 'faturado.cpf', 'dataEmissao', 'parcelas'])
    );
  });

  it('flags missing payments and low OCR confidence without manufacturing values', () => {
    const invoice = structuredClone(validInvoice);
    invoice.parcelas = [];
    invoice.quantidadeParcelas = null;
    invoice.dataVencimento = null;
    invoice.valorTotal = null;
    const review = evaluateInvoiceQuality(invoice, [{ index: 0, average: 0.72, minimum: 0.6 }]);
    expect(review.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['valorTotal', 'parcelas', 'ocr'])
    );
  });
});
