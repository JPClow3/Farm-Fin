import { z } from 'zod';
import {
  CLASSIFICACAO_TIPOS,
  MOVIMENTO_TIPOS,
  PESSOA_TIPOS,
  isIsoDate,
  onlyDigits,
} from '../administrativo';

const isoDate = z.string().refine(isIsoDate, 'Data inválida (use AAAA-MM-DD).');

export const buscaCadastroSchema = z.object({
  termo: z.string().max(300).optional().default(''),
  /** "TODOS": carrega somente status = ATIVO, sem termos */
  todos: z.boolean().optional().default(false),
  incluirInativos: z.boolean().optional().default(false),
});

export const salvarPessoaSchema = z.object({
  id: z.number().int().positive().optional(),
  tipo: z.enum(PESSOA_TIPOS),
  razaoSocial: z.string().trim().min(2, 'Informe a razão social / nome.').max(255),
  fantasia: z.string().trim().max(255).optional().nullable(),
  documento: z
    .string()
    .optional()
    .nullable()
    .refine((v) => {
      const d = onlyDigits(v);
      return d.length === 0 || d.length === 11 || d.length === 14;
    }, 'CPF deve ter 11 dígitos e CNPJ 14 dígitos.'),
});

export const salvarClassificacaoSchema = z.object({
  id: z.number().int().positive().optional(),
  tipo: z.enum(CLASSIFICACAO_TIPOS),
  descricao: z.string().trim().min(2, 'Informe a descrição.').max(150),
});

export const salvarMovimentoSchema = z.object({
  id: z.number().int().positive().optional(),
  tipo: z.enum(MOVIMENTO_TIPOS),
  pessoaId: z.number().int().positive('Selecione o fornecedor/cliente.'),
  faturadoId: z.number().int().positive().optional().nullable(),
  numeroNotaFiscal: z.string().trim().max(50).optional().nullable(),
  dataEmissao: isoDate.optional().nullable(),
  descricao: z.string().trim().max(2000).optional().nullable(),
  classificacaoIds: z
    .array(z.number().int().positive())
    .min(1, 'Selecione ao menos uma classificação.')
    .max(20),
  parcelas: z
    .array(
      z.object({
        dataVencimento: isoDate,
        valor: z.number().positive('O valor da parcela deve ser maior que zero.').max(1e12),
      })
    )
    .min(1, 'Informe ao menos uma parcela.')
    .max(120),
});

export const alterarStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['ATIVO', 'INATIVO']),
});

/** JSON extraído da nota (vem do navegador, então é revalidado no servidor) */
export const notaExtraidaSchema = z.object({
  fornecedor: z.object({
    razaoSocial: z.string().max(255).nullable().default(''),
    nomeFantasia: z.string().max(255).nullable().optional(),
    cnpj: z.string().max(30).nullable().default(''),
  }),
  faturado: z.object({
    nomeCompleto: z.string().max(255).nullable().default(''),
    cpf: z.string().max(30).nullable().default(''),
  }),
  numeroNotaFiscal: z.string().max(50).nullable().default(''),
  dataEmissao: z.string().max(20).nullable(),
  descricaoProdutos: z.array(z.string().max(500)).max(200).default([]),
  quantidadeParcelas: z.number().nullable().optional(),
  parcelas: z
    .array(
      z.object({
        numero: z.number().nullable().optional(),
        dataVencimento: z.string().max(20).nullable(),
        valor: z.number().nullable(),
      })
    )
    .max(120)
    .default([]),
  dataVencimento: z.string().max(20).nullable(),
  valorTotal: z.number().nullable(),
  tipoDespesa: z.string().max(150).nullable().default(''),
  classificacaoDespesa: z.array(z.string().max(150)).max(20).default([]),
});
