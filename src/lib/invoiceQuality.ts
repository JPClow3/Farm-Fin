import type { ExtractedInvoiceData } from './mistralInvoiceAgent';

export const INVOICE_OCR_REVIEW_THRESHOLD = 0.8;

export interface InvoiceReviewIssue {
  field: string;
  message: string;
}

export interface InvoiceReview {
  required: boolean;
  issues: InvoiceReviewIssue[];
  ocrMinimumPageConfidence: number | null;
}

export interface OcrPageConfidence {
  index: number;
  average: number | null;
  minimum: number | null;
}

function validDate(value: string | null): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day
  );
}

function validCpf(digits: string): boolean {
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  for (let length = 9; length <= 10; length++) {
    const sum = digits
      .slice(0, length)
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const check = ((sum * 10) % 11) % 10;
    if (check !== Number(digits[length])) return false;
  }
  return true;
}

function validCnpj(digits: string): boolean {
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  for (let length = 12; length <= 13; length++) {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
    const remainder = sum % 11;
    if ((remainder < 2 ? 0 : 11 - remainder) !== Number(digits[length])) return false;
  }
  return true;
}

function validDocument(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return validCpf(digits) || validCnpj(digits);
}

export function evaluateInvoiceQuality(
  data: ExtractedInvoiceData,
  pages: OcrPageConfidence[] = []
): InvoiceReview {
  const issues: InvoiceReviewIssue[] = [];
  const add = (field: string, message: string) => issues.push({ field, message });

  if (!data.fornecedor.razaoSocial)
    add('fornecedor.razaoSocial', 'Razão social do fornecedor não identificada.');
  if (!data.fornecedor.cnpj) add('fornecedor.cnpj', 'CNPJ do fornecedor não identificado.');
  else if (!validCnpj(data.fornecedor.cnpj.replace(/\D/g, '')))
    add('fornecedor.cnpj', 'CNPJ do fornecedor inválido.');
  if (!data.faturado.nomeCompleto) add('faturado.nomeCompleto', 'Destinatário não identificado.');
  if (!data.faturado.cpf) add('faturado.cpf', 'CPF/CNPJ do destinatário não identificado.');
  else if (!validDocument(data.faturado.cpf))
    add('faturado.cpf', 'CPF/CNPJ do destinatário inválido.');
  if (!data.numeroNotaFiscal) add('numeroNotaFiscal', 'Número da nota não identificado.');
  if (!validDate(data.dataEmissao)) add('dataEmissao', 'Data de emissão ausente ou inválida.');
  if (data.valorTotal === null || !Number.isFinite(data.valorTotal) || data.valorTotal <= 0) {
    add('valorTotal', 'Valor total ausente ou inválido.');
  }
  if (data.descricaoProdutos.length === 0)
    add('descricaoProdutos', 'Itens ou serviços não identificados.');
  if (data.parcelas.length === 0)
    add('parcelas', 'Parcelas não identificadas; confira o vencimento e o pagamento.');
  if (data.quantidadeParcelas !== null && data.quantidadeParcelas !== data.parcelas.length) {
    add('quantidadeParcelas', 'Quantidade de parcelas difere da lista extraída.');
  }
  for (const [index, parcela] of data.parcelas.entries()) {
    if (!validDate(parcela.dataVencimento))
      add(
        `parcelas.${index}.dataVencimento`,
        `Vencimento da parcela ${index + 1} ausente ou inválido.`
      );
    if (parcela.valor === null || !Number.isFinite(parcela.valor) || parcela.valor <= 0) {
      add(`parcelas.${index}.valor`, `Valor da parcela ${index + 1} ausente ou inválido.`);
    }
  }
  if (
    data.parcelas.length > 0 &&
    data.valorTotal !== null &&
    data.parcelas.every((p) => p.valor !== null && p.valor > 0)
  ) {
    const sumInCents = data.parcelas.reduce((sum, p) => sum + Math.round((p.valor ?? 0) * 100), 0);
    if (Math.abs(sumInCents - Math.round(data.valorTotal * 100)) > 1) {
      add('parcelas', 'A soma das parcelas difere do valor total da nota.');
    }
  }
  if (data.parcelas.length && data.dataVencimento !== data.parcelas[0].dataVencimento) {
    add('dataVencimento', 'Vencimento principal difere da primeira parcela.');
  }
  if (!data.tipoDespesa || data.classificacaoDespesa.length === 0)
    add('tipoDespesa', 'Classificação da despesa não identificada.');

  const pageScores = pages
    .map((page) => page.average)
    .filter((score): score is number => score !== null && Number.isFinite(score));
  const minimumPageConfidence = pageScores.length ? Math.min(...pageScores) : null;
  if (minimumPageConfidence !== null && minimumPageConfidence < INVOICE_OCR_REVIEW_THRESHOLD) {
    add('ocr', 'Uma página teve leitura OCR de baixa confiança; confira os campos com o PDF.');
  }
  return { required: issues.length > 0, issues, ocrMinimumPageConfidence: minimumPageConfidence };
}
