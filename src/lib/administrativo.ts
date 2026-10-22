// Projeto Administrativo-Financeiro (Atividade N2): tipos e regras puras,
// usados tanto pelas Server Actions quanto pelas telas.

import { validDocument } from './invoiceQuality';

export const PESSOA_TIPOS = ['FORNECEDOR', 'CLIENTE', 'FATURADO'] as const;
export const CLASSIFICACAO_TIPOS = ['DESPESA', 'RECEITA'] as const;
export const MOVIMENTO_TIPOS = ['APAGAR', 'ARECEBER'] as const;
export const CADASTRO_STATUS = ['ATIVO', 'INATIVO'] as const;

export type PessoaTipo = (typeof PESSOA_TIPOS)[number];
export type ClassificacaoTipo = (typeof CLASSIFICACAO_TIPOS)[number];
export type MovimentoTipo = (typeof MOVIMENTO_TIPOS)[number];
export type CadastroStatus = (typeof CADASTRO_STATUS)[number];

export const PESSOA_TIPO_LABELS: Record<PessoaTipo, string> = {
  FORNECEDOR: 'Fornecedor',
  CLIENTE: 'Cliente',
  FATURADO: 'Faturado',
};

export const MOVIMENTO_TIPO_LABELS: Record<MovimentoTipo, string> = {
  APAGAR: 'Contas a Pagar',
  ARECEBER: 'Contas a Receber',
};

/** Pessoa e classificação esperadas por tipo de movimento */
export const MOVIMENTO_REGRAS: Record<
  MovimentoTipo,
  { pessoaTipo: PessoaTipo; classificacaoTipo: ClassificacaoTipo }
> = {
  APAGAR: { pessoaTipo: 'FORNECEDOR', classificacaoTipo: 'DESPESA' },
  ARECEBER: { pessoaTipo: 'CLIENTE', classificacaoTipo: 'RECEITA' },
};

export interface PessoaRow {
  id: number;
  tipo: PessoaTipo;
  razaoSocial: string;
  fantasia: string | null;
  documento: string | null;
  status: CadastroStatus;
}

export interface ClassificacaoRow {
  id: number;
  tipo: ClassificacaoTipo;
  descricao: string;
  status: CadastroStatus;
}

export interface ProdutoRow {
  id: number;
  descricao: string;
  status: CadastroStatus;
}

export interface ParcelaRow {
  id: number;
  identificacao: string;
  numeroParcela: number;
  dataVencimento: string;
  valorParcela: number;
  status: CadastroStatus;
}

export interface MovimentoRow {
  id: number;
  tipo: MovimentoTipo;
  numeroNotaFiscal: string | null;
  dataEmissao: string | null;
  descricao: string | null;
  valorTotal: number;
  status: CadastroStatus;
  pessoa: { id: number; razaoSocial: string; documento: string | null };
  faturado: { id: number; razaoSocial: string; documento: string | null } | null;
  classificacoes: { id: number; descricao: string }[];
  parcelas: ParcelaRow[];
}

/** Resultado da consulta de uma entidade da nota no banco de dados */
export interface EntidadeConsulta {
  nome: string;
  documento: string | null;
  existe: boolean;
  id: number | null;
  status: CadastroStatus | null;
}

export interface NotaAnalise {
  fornecedor: EntidadeConsulta;
  faturado: EntidadeConsulta;
  despesas: EntidadeConsulta[];
  produtos: EntidadeConsulta[];
  pendenciasCadastro: string[];
  /** Movimento ativo já lançado para o mesmo fornecedor + número de NF */
  movimentoExistenteId: number | null;
  /** Dados obrigatórios ausentes que impedem o lançamento */
  pendencias: string[];
}

export interface CadastroNotaResultado {
  fornecedor: { id: number; acao: 'criado' | 'existente' | 'reativado' };
  produtos: { id: number; descricao: string; acao: 'criado' | 'existente' | 'reativado' }[];
}

export interface LancamentoResultado extends CadastroNotaResultado {
  movimentoId: number;
  valorTotal: number;
  faturado: { id: number; acao: 'criado' | 'existente' | 'reativado' };
  despesas: { id: number; descricao: string; acao: 'criado' | 'existente' | 'reativado' }[];
  parcelas: { id: number; identificacao: string; dataVencimento: string; valorParcela: number }[];
}

export function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/** Aplica a máscara de CPF (11 dígitos) ou CNPJ (14 dígitos) */
export function formatDocumento(value: string | null | undefined): string {
  const d = onlyDigits(value);
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  return value ?? '';
}

export function documentoLabel(value: string | null | undefined): 'CPF' | 'CNPJ' | 'CPF/CNPJ' {
  const length = onlyDigits(value).length;
  return length === 11 ? 'CPF' : length === 14 ? 'CNPJ' : 'CPF/CNPJ';
}

/** Descrições de classificação são comparadas e gravadas em maiúsculas */
export function normalizeDescricao(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR');
}

/** DANFE pode exibir 000.045.892 e o mesmo número ser digitado como 45892. */
export function normalizeNumeroNota(value: string | null | undefined): string {
  const numero = (value ?? '').trim().toUpperCase().replace(/[.\s]/g, '');
  return /^\d+$/.test(numero) ? numero.replace(/^0+(?=\d)/, '') : numero;
}

/** "Busca por mais de um elemento": cada termo precisa casar com alguma coluna */
export function parseSearchTerms(query: string | null | undefined, max = 8): string[] {
  const terms = (query ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.slice(0, 100));
  return [...new Set(terms)].slice(0, max);
}

/** Escapa curingas do ILIKE para buscar o texto literal */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function identificacaoParcela(numero: number, total: number): string {
  return total <= 1 ? 'ÚNICA' : `${numero}/${total}`;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() + 1 === m && date.getUTCDate() === d;
}

export interface ParcelaInput {
  dataVencimento: string;
  valor: number;
}

/** Soma meses a uma data AAAA-MM-DD, limitando ao último dia do mês (31/01 + 1 → 28/02) */
export function addMonthsIso(iso: string, months: number): string {
  if (!isIsoDate(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

/**
 * Divide o total em parcelas mensais a partir do 1º vencimento.
 * Os centavos que sobram da divisão vão para a última parcela.
 */
export function dividirEmParcelas(
  total: number,
  quantidade: number,
  primeiroVencimento: string
): ParcelaInput[] {
  if (!(total > 0) || !Number.isInteger(quantidade) || quantidade < 1) return [];
  if (!isIsoDate(primeiroVencimento)) return [];
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / quantidade);
  return Array.from({ length: quantidade }, (_, i) => ({
    dataVencimento: addMonthsIso(primeiroVencimento, i),
    valor: (i === quantidade - 1 ? centavos - base * (quantidade - 1) : base) / 100,
  }));
}

/** Máscara progressiva de CPF (até 11 dígitos) ou CNPJ (12 a 14 dígitos) enquanto digita */
export function maskDocumento(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** Dados da nota já normalizados para gravação */
export interface NotaLancamentoPayload {
  fornecedor: { razaoSocial: string; fantasia: string | null; documento: string };
  faturado: { razaoSocial: string; documento: string };
  numeroNotaFiscal: string | null;
  dataEmissao: string | null;
  descricao: string | null;
  produtos: string[];
  despesas: string[];
  parcelas: ParcelaInput[];
  valorTotal: number;
}

/** Forma tolerante do JSON extraído (ExtractedInvoiceData ou o JSON revalidado no servidor) */
export interface NotaExtraidaLike {
  fornecedor?: {
    razaoSocial?: string | null;
    nomeFantasia?: string | null;
    cnpj?: string | null;
  } | null;
  faturado?: { nomeCompleto?: string | null; cpf?: string | null } | null;
  numeroNotaFiscal?: string | null;
  dataEmissao?: string | null;
  descricaoProdutos?: string[] | null;
  parcelas?: { dataVencimento?: string | null; valor?: number | null }[] | null;
  dataVencimento?: string | null;
  valorTotal?: number | null;
  tipoDespesa?: string | null;
  classificacaoDespesa?: string[] | null;
}

/**
 * Converte o JSON extraído da nota no que será gravado e lista o que falta.
 * Parcelas sem data ou valor são descartadas; sem nenhuma parcela válida,
 * usa-se uma parcela única com o vencimento e o valor total da nota.
 */
export function buildNotaPayload(data: NotaExtraidaLike): {
  payload: NotaLancamentoPayload;
  pendencias: string[];
  pendenciasCadastro: string[];
} {
  const pendencias: string[] = [];

  const fornecedorNome = (data.fornecedor?.razaoSocial ?? '').trim();
  const fornecedorDoc = onlyDigits(data.fornecedor?.cnpj);
  const faturadoNome = (data.faturado?.nomeCompleto ?? '').trim();
  const faturadoDoc = onlyDigits(data.faturado?.cpf);

  const produtos = [
    ...new Set(
      (Array.isArray(data.descricaoProdutos) ? data.descricaoProdutos : [])
        .map(normalizeDescricao)
        .filter(Boolean)
    ),
  ];
  const pendenciasCadastro: string[] = [];
  if (fornecedorNome.length < 2) pendenciasCadastro.push('Informe a razão social do fornecedor.');
  if (!validDocument(fornecedorDoc))
    pendenciasCadastro.push('Informe um CPF/CNPJ válido para o fornecedor.');
  if (produtos.length === 0)
    pendenciasCadastro.push('Informe ao menos um produto ou serviço da nota.');
  pendencias.push(...pendenciasCadastro);
  if (!(data.numeroNotaFiscal ?? '').trim()) pendencias.push('Informe o número da nota fiscal.');
  if (!isIsoDate(data.dataEmissao)) pendencias.push('Informe uma data de emissão válida.');
  if (faturadoNome.length < 2) pendencias.push('Informe o nome do faturado.');
  if (!validDocument(faturadoDoc)) pendencias.push('Informe um CPF/CNPJ válido para o faturado.');

  const fonteDespesas =
    Array.isArray(data.classificacaoDespesa) && data.classificacaoDespesa.length > 0
      ? data.classificacaoDespesa
      : [data.tipoDespesa];
  const despesas = [...new Set(fonteDespesas.map(normalizeDescricao).filter(Boolean))];
  if (despesas.length === 0) pendencias.push('Classificação da despesa não identificada.');

  const fonteParcelas = Array.isArray(data.parcelas) ? data.parcelas : [];
  const parcelaValida = (p: (typeof fonteParcelas)[number]) =>
    isIsoDate(p?.dataVencimento) &&
    typeof p?.valor === 'number' &&
    Number.isFinite(p.valor) &&
    roundMoney(p.valor) > 0;
  if (fonteParcelas.some((p) => !parcelaValida(p)))
    pendencias.push('Corrija o vencimento e o valor de todas as parcelas.');
  let parcelas: ParcelaInput[] = fonteParcelas.filter(parcelaValida).map((p) => ({
    dataVencimento: p.dataVencimento as string,
    valor: roundMoney(p.valor as number),
  }));

  const valorNota =
    typeof data.valorTotal === 'number' &&
    Number.isFinite(data.valorTotal) &&
    roundMoney(data.valorTotal) > 0
      ? roundMoney(data.valorTotal)
      : 0;
  if (valorNota === 0) pendencias.push('Informe um valor total maior que zero.');
  if (parcelas.length === 0 && valorNota > 0 && isIsoDate(data.dataVencimento)) {
    parcelas = [{ dataVencimento: data.dataVencimento, valor: roundMoney(valorNota) }];
  }
  if (parcelas.length === 0) pendencias.push('Nenhuma parcela com vencimento e valor válidos.');

  const valorTotal = roundMoney(parcelas.reduce((sum, p) => sum + p.valor, 0));
  if (valorNota > 0 && Math.abs(Math.round(valorTotal * 100) - Math.round(valorNota * 100)) > 1)
    pendencias.push('A soma das parcelas deve ser igual ao valor total da nota.');

  return {
    payload: {
      fornecedor: {
        razaoSocial: fornecedorNome,
        fantasia: data.fornecedor?.nomeFantasia?.trim() || null,
        documento: fornecedorDoc,
      },
      faturado: { razaoSocial: faturadoNome, documento: faturadoDoc },
      numeroNotaFiscal: normalizeNumeroNota(data.numeroNotaFiscal) || null,
      dataEmissao: isIsoDate(data.dataEmissao) ? data.dataEmissao : null,
      descricao: produtos.join('; ').slice(0, 2000) || null,
      produtos,
      despesas,
      parcelas,
      valorTotal,
    },
    pendencias,
    pendenciasCadastro,
  };
}
