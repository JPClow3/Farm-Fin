'use server';

import { db } from '@/db';
import {
  classificacao,
  movimentoClassificacao,
  movimentoContas,
  parcelaContas,
  pessoas,
} from '@/db/schema';
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { alias, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { requireModuleAccess } from '@/lib/permissionGuard';
import { PermissionError } from '@/lib/permissions';
import { ActionResult, validateActionInput } from '@/lib/action-result';
import { writeAuditLog } from '@/lib/audit';
import {
  MOVIMENTO_REGRAS,
  buildNotaPayload,
  escapeLike,
  formatDocumento,
  identificacaoParcela,
  normalizeDescricao,
  onlyDigits,
  parseSearchTerms,
  roundMoney,
  type CadastroStatus,
  type ClassificacaoRow,
  type ClassificacaoTipo,
  type EntidadeConsulta,
  type LancamentoResultado,
  type MovimentoRow,
  type MovimentoTipo,
  type NotaAnalise,
  type PessoaRow,
  type PessoaTipo,
} from '@/lib/administrativo';
import {
  alterarStatusSchema,
  buscaCadastroSchema,
  notaExtraidaSchema,
  salvarClassificacaoSchema,
  salvarMovimentoSchema,
  salvarPessoaSchema,
} from '@/lib/validations/administrativo.schema';

// Projeto Administrativo-Financeiro (Atividade N2 — 2ª etapa).
// Regras: cadastros nunca são excluídos (status INATIVO), podem ser reativados;
// um movimento tem uma ou mais classificações e uma ou mais parcelas.

const MODULE = 'processador-nf' as const;
const MAX_RESULTS = 200;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type BuscaInput = { termo?: string; todos?: boolean; incluirInativos?: boolean };
type Acao = 'criado' | 'existente' | 'reativado';

/** Erro de regra de negócio: a mensagem pode ser mostrada ao usuário */
class RegraNegocioError extends Error {}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if ('code' in error && error.code === '23505') return true;
  return 'cause' in error && isUniqueViolation(error.cause);
}

function falha(error: unknown, contexto: string): ActionResult<never> {
  if (error instanceof PermissionError || error instanceof RegraNegocioError) {
    return { success: false, error: error.message };
  }
  if (isUniqueViolation(error)) {
    return { success: false, error: 'Já existe um cadastro com esses dados.' };
  }
  console.error(`[${contexto}]`, error);
  return {
    success: false,
    error: 'Não foi possível acessar o banco de dados. Tente novamente em instantes.',
  };
}

const likeTerm = (column: AnyPgColumn, term: string) => ilike(column, `%${escapeLike(term)}%`);

/** Cada termo precisa casar com pelo menos uma das colunas (AND entre termos, OR entre colunas) */
function searchConditions(terms: string[], columnsFor: (term: string) => SQL[]): SQL[] {
  return terms.map((term) => or(...columnsFor(term)) as SQL);
}

/** Monta os filtros comuns da busca; retorna erro quando não há o que buscar */
function prepararBusca(input: BuscaInput, statusColumn: AnyPgColumn) {
  const parsed = validateActionInput(buscaCadastroSchema, input);
  if (!parsed.success) return { erro: parsed.result };
  const { termo, todos, incluirInativos } = parsed.data;
  const terms = todos ? [] : parseSearchTerms(termo);
  if (!todos && terms.length === 0 && !incluirInativos) {
    return {
      erro: {
        success: false,
        error: 'Digite um ou mais termos para buscar ou clique em "Todos".',
      } as ActionResult<never>,
    };
  }
  // TODOS carrega status = ATIVO; a busca inclui inativos só quando pedido
  const statusFilter = todos || !incluirInativos ? [eq(statusColumn, 'ATIVO')] : [];
  return { terms, statusFilter };
}

// ----------------------------------------------------
// MANTER PESSOAS (Fornecedor, Cliente, Faturado)
// ----------------------------------------------------

function toPessoaRow(row: typeof pessoas.$inferSelect): PessoaRow {
  return {
    id: row.id,
    tipo: row.tipo as PessoaTipo,
    razaoSocial: row.razaoSocial,
    fantasia: row.fantasia,
    documento: row.documento,
    status: row.status as CadastroStatus,
  };
}

export async function buscarPessoas(
  input: BuscaInput & { tipo?: PessoaTipo | null }
): Promise<ActionResult<PessoaRow[]>> {
  try {
    const session = await requireModuleAccess(MODULE, 'view');
    const busca = prepararBusca(input, pessoas.status);
    if ('erro' in busca) return busca.erro as ActionResult<never>;

    const conditions: SQL[] = [
      eq(pessoas.organizationId, session.organizationId),
      ...busca.statusFilter,
      ...searchConditions(busca.terms, (term) => {
        const digits = onlyDigits(term);
        return [
          likeTerm(pessoas.razaoSocial, term),
          likeTerm(pessoas.fantasia, term),
          likeTerm(pessoas.tipo, term),
          ...(digits.length >= 2 ? [likeTerm(pessoas.documento, digits)] : []),
        ];
      }),
    ];
    if (input.tipo) conditions.push(eq(pessoas.tipo, input.tipo));

    const rows = await db
      .select()
      .from(pessoas)
      .where(and(...conditions))
      .orderBy(asc(pessoas.razaoSocial))
      .limit(MAX_RESULTS);
    return { success: true, data: rows.map(toPessoaRow) };
  } catch (error) {
    return falha(error, 'buscarPessoas');
  }
}

export async function salvarPessoa(input: {
  id?: number;
  tipo: PessoaTipo;
  razaoSocial: string;
  fantasia?: string | null;
  documento?: string | null;
}): Promise<ActionResult<PessoaRow>> {
  try {
    const session = await requireModuleAccess(MODULE, 'manage');
    const parsed = validateActionInput(salvarPessoaSchema, input);
    if (!parsed.success) return parsed.result;
    const { id, tipo, razaoSocial, fantasia } = parsed.data;
    const documento = onlyDigits(parsed.data.documento) || null;
    const orgId = session.organizationId;

    if (documento) {
      const [duplicada] = await db
        .select({ id: pessoas.id })
        .from(pessoas)
        .where(
          and(
            eq(pessoas.organizationId, orgId),
            eq(pessoas.tipo, tipo),
            eq(pessoas.documento, documento)
          )
        )
        .limit(1);
      if (duplicada && duplicada.id !== id) {
        return {
          success: false,
          error: `Já existe um ${tipo} com o documento ${formatDocumento(documento)} (ID ${duplicada.id}).`,
        };
      }
    }

    const values = { tipo, razaoSocial, fantasia: fantasia || null, documento };
    // No CREATE o status nasce ATIVO; no UPDATE o status não é alterado
    const [row] = id
      ? await db
          .update(pessoas)
          .set({ ...values, updatedAt: new Date() })
          .where(and(eq(pessoas.id, id), eq(pessoas.organizationId, orgId)))
          .returning()
      : await db
          .insert(pessoas)
          .values({ ...values, organizationId: orgId, status: 'ATIVO' })
          .returning();
    if (!row) return { success: false, error: 'Cadastro não encontrado.' };

    await writeAuditLog({
      action: id ? 'update' : 'create',
      entityType: 'pessoa',
      details: `${tipo} ID ${row.id}: ${razaoSocial}`,
    });
    return {
      success: true,
      data: toPessoaRow(row),
      message: id ? 'Cadastro atualizado.' : `Cadastro criado (ID ${row.id}).`,
    };
  } catch (error) {
    return falha(error, 'salvarPessoa');
  }
}

export async function alterarStatusPessoa(
  id: number,
  status: CadastroStatus
): Promise<ActionResult<PessoaRow>> {
  try {
    const session = await requireModuleAccess(MODULE, 'manage');
    const parsed = validateActionInput(alterarStatusSchema, { id, status });
    if (!parsed.success) return parsed.result;
    const [row] = await db
      .update(pessoas)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(and(eq(pessoas.id, id), eq(pessoas.organizationId, session.organizationId)))
      .returning();
    if (!row) return { success: false, error: 'Cadastro não encontrado.' };
    await writeAuditLog({
      action: 'update',
      entityType: 'pessoa',
      details: `${row.tipo} ID ${row.id} → ${row.status}`,
    });
    return {
      success: true,
      data: toPessoaRow(row),
      message: status === 'INATIVO' ? 'Cadastro inativado.' : 'Cadastro reativado.',
    };
  } catch (error) {
    return falha(error, 'alterarStatusPessoa');
  }
}

// ----------------------------------------------------
// MANTER CLASSIFICAÇÃO (Tipo de Despesa, Tipo de Receita)
// ----------------------------------------------------

function toClassificacaoRow(row: typeof classificacao.$inferSelect): ClassificacaoRow {
  return {
    id: row.id,
    tipo: row.tipo as ClassificacaoTipo,
    descricao: row.descricao,
    status: row.status as CadastroStatus,
  };
}

export async function buscarClassificacoes(
  input: BuscaInput & { tipo?: ClassificacaoTipo | null }
): Promise<ActionResult<ClassificacaoRow[]>> {
  try {
    const session = await requireModuleAccess(MODULE, 'view');
    const busca = prepararBusca(input, classificacao.status);
    if ('erro' in busca) return busca.erro as ActionResult<never>;

    const conditions: SQL[] = [
      eq(classificacao.organizationId, session.organizationId),
      ...busca.statusFilter,
      ...searchConditions(busca.terms, (term) => [
        likeTerm(classificacao.descricao, term),
        likeTerm(classificacao.tipo, term),
      ]),
    ];
    if (input.tipo) conditions.push(eq(classificacao.tipo, input.tipo));

    const rows = await db
      .select()
      .from(classificacao)
      .where(and(...conditions))
      .orderBy(asc(classificacao.descricao))
      .limit(MAX_RESULTS);
    return { success: true, data: rows.map(toClassificacaoRow) };
  } catch (error) {
    return falha(error, 'buscarClassificacoes');
  }
}

export async function salvarClassificacao(input: {
  id?: number;
  tipo: ClassificacaoTipo;
  descricao: string;
}): Promise<ActionResult<ClassificacaoRow>> {
  try {
    const session = await requireModuleAccess(MODULE, 'manage');
    const parsed = validateActionInput(salvarClassificacaoSchema, input);
    if (!parsed.success) return parsed.result;
    const { id, tipo } = parsed.data;
    const descricao = normalizeDescricao(parsed.data.descricao);
    const orgId = session.organizationId;

    const [duplicada] = await db
      .select({ id: classificacao.id })
      .from(classificacao)
      .where(
        and(
          eq(classificacao.organizationId, orgId),
          eq(classificacao.tipo, tipo),
          eq(classificacao.descricao, descricao)
        )
      )
      .limit(1);
    if (duplicada && duplicada.id !== id) {
      return {
        success: false,
        error: `A classificação ${descricao} (${tipo}) já existe (ID ${duplicada.id}).`,
      };
    }

    const [row] = id
      ? await db
          .update(classificacao)
          .set({ tipo, descricao, updatedAt: new Date() })
          .where(and(eq(classificacao.id, id), eq(classificacao.organizationId, orgId)))
          .returning()
      : await db
          .insert(classificacao)
          .values({ organizationId: orgId, tipo, descricao, status: 'ATIVO' })
          .returning();
    if (!row) return { success: false, error: 'Classificação não encontrada.' };

    await writeAuditLog({
      action: id ? 'update' : 'create',
      entityType: 'classificacao',
      details: `${tipo} ID ${row.id}: ${descricao}`,
    });
    return {
      success: true,
      data: toClassificacaoRow(row),
      message: id ? 'Classificação atualizada.' : `Classificação criada (ID ${row.id}).`,
    };
  } catch (error) {
    return falha(error, 'salvarClassificacao');
  }
}

export async function alterarStatusClassificacao(
  id: number,
  status: CadastroStatus
): Promise<ActionResult<ClassificacaoRow>> {
  try {
    const session = await requireModuleAccess(MODULE, 'manage');
    const parsed = validateActionInput(alterarStatusSchema, { id, status });
    if (!parsed.success) return parsed.result;
    const [row] = await db
      .update(classificacao)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(
        and(eq(classificacao.id, id), eq(classificacao.organizationId, session.organizationId))
      )
      .returning();
    if (!row) return { success: false, error: 'Classificação não encontrada.' };
    await writeAuditLog({
      action: 'update',
      entityType: 'classificacao',
      details: `${row.tipo} ID ${row.id} → ${row.status}`,
    });
    return {
      success: true,
      data: toClassificacaoRow(row),
      message: status === 'INATIVO' ? 'Classificação inativada.' : 'Classificação reativada.',
    };
  } catch (error) {
    return falha(error, 'alterarStatusClassificacao');
  }
}

// ----------------------------------------------------
// REGISTRAR CONTAS (A Pagar / A Receber) — MOVIMENTOCONTAS + PARCELACONTAS
// ----------------------------------------------------

async function carregarMovimentos(orgId: string, ids: number[]): Promise<MovimentoRow[]> {
  if (ids.length === 0) return [];
  const rows = await db.query.movimentoContas.findMany({
    where: (m, { and, eq, inArray }) => and(eq(m.organizationId, orgId), inArray(m.id, ids)),
    orderBy: (m, { desc }) => [desc(m.id)],
    with: {
      pessoa: true,
      faturado: true,
      classificacoes: { with: { classificacao: true } },
      parcelas: {
        where: (p, { eq }) => eq(p.status, 'ATIVO'),
        orderBy: (p, { asc }) => [asc(p.numeroParcela)],
      },
    },
  });

  return rows.map((m) => ({
    id: m.id,
    tipo: m.tipo as MovimentoTipo,
    numeroNotaFiscal: m.numeroNotaFiscal,
    dataEmissao: m.dataEmissao,
    descricao: m.descricao,
    valorTotal: Number(m.valorTotal),
    status: m.status as CadastroStatus,
    pessoa: { id: m.pessoa.id, razaoSocial: m.pessoa.razaoSocial, documento: m.pessoa.documento },
    faturado: m.faturado
      ? { id: m.faturado.id, razaoSocial: m.faturado.razaoSocial, documento: m.faturado.documento }
      : null,
    classificacoes: m.classificacoes
      .map((c) => ({ id: c.classificacao.id, descricao: c.classificacao.descricao }))
      .sort((a, b) => a.descricao.localeCompare(b.descricao)),
    parcelas: m.parcelas.map((p) => ({
      id: p.id,
      identificacao: p.identificacao,
      numeroParcela: p.numeroParcela,
      dataVencimento: p.dataVencimento,
      valorParcela: Number(p.valorParcela),
      status: p.status as CadastroStatus,
    })),
  }));
}

export async function buscarMovimentos(
  input: BuscaInput & { tipo: MovimentoTipo }
): Promise<ActionResult<MovimentoRow[]>> {
  try {
    const session = await requireModuleAccess(MODULE, 'view');
    const busca = prepararBusca(input, movimentoContas.status);
    if ('erro' in busca) return busca.erro as ActionResult<never>;

    const pessoa = alias(pessoas, 'pessoa');
    const faturado = alias(pessoas, 'faturado');
    const conditions: SQL[] = [
      eq(movimentoContas.organizationId, session.organizationId),
      eq(movimentoContas.tipo, input.tipo === 'ARECEBER' ? 'ARECEBER' : 'APAGAR'),
      ...busca.statusFilter,
      ...searchConditions(busca.terms, (term) => {
        const digits = onlyDigits(term);
        const pattern = `%${escapeLike(term)}%`;
        return [
          likeTerm(movimentoContas.numeroNotaFiscal, term),
          likeTerm(movimentoContas.descricao, term),
          likeTerm(pessoa.razaoSocial, term),
          likeTerm(faturado.razaoSocial, term),
          ...(digits.length >= 2
            ? [likeTerm(pessoa.documento, digits), likeTerm(faturado.documento, digits)]
            : []),
          sql`exists (select 1 from ${movimentoClassificacao} inner join ${classificacao} on ${classificacao.id} = ${movimentoClassificacao.classificacaoId} where ${movimentoClassificacao.movimentoId} = ${movimentoContas.id} and ${classificacao.descricao} ilike ${pattern})`,
        ];
      }),
    ];

    const ids = await db
      .select({ id: movimentoContas.id })
      .from(movimentoContas)
      .innerJoin(pessoa, eq(pessoa.id, movimentoContas.pessoaId))
      .leftJoin(faturado, eq(faturado.id, movimentoContas.faturadoId))
      .where(and(...conditions))
      .orderBy(desc(movimentoContas.id))
      .limit(MAX_RESULTS);

    const data = await carregarMovimentos(
      session.organizationId,
      ids.map((r) => r.id)
    );
    return { success: true, data };
  } catch (error) {
    return falha(error, 'buscarMovimentos');
  }
}

export interface OpcoesMovimento {
  pessoas: PessoaRow[];
  faturados: PessoaRow[];
  classificacoes: ClassificacaoRow[];
}

/** Cadastros ativos usados nos selects do formulário de contas */
export async function listarOpcoesMovimento(
  tipo: MovimentoTipo
): Promise<ActionResult<OpcoesMovimento>> {
  try {
    const session = await requireModuleAccess(MODULE, 'view');
    const regra = MOVIMENTO_REGRAS[tipo === 'ARECEBER' ? 'ARECEBER' : 'APAGAR'];
    const orgId = session.organizationId;
    const [pessoaRows, classificacaoRows] = await Promise.all([
      db
        .select()
        .from(pessoas)
        .where(
          and(
            eq(pessoas.organizationId, orgId),
            eq(pessoas.status, 'ATIVO'),
            inArray(pessoas.tipo, [regra.pessoaTipo, 'FATURADO'])
          )
        )
        .orderBy(asc(pessoas.razaoSocial)),
      db
        .select()
        .from(classificacao)
        .where(
          and(
            eq(classificacao.organizationId, orgId),
            eq(classificacao.status, 'ATIVO'),
            eq(classificacao.tipo, regra.classificacaoTipo)
          )
        )
        .orderBy(asc(classificacao.descricao)),
    ]);
    const all = pessoaRows.map(toPessoaRow);
    return {
      success: true,
      data: {
        pessoas: all.filter((p) => p.tipo === regra.pessoaTipo),
        faturados: all.filter((p) => p.tipo === 'FATURADO'),
        classificacoes: classificacaoRows.map(toClassificacaoRow),
      },
    };
  } catch (error) {
    return falha(error, 'listarOpcoesMovimento');
  }
}

/** Grava as parcelas: atualiza pelo número, cria as novas e inativa as excedentes */
async function gravarParcelas(
  tx: Tx,
  movimentoId: number,
  parcelas: { dataVencimento: string; valor: number }[]
) {
  const existentes = await tx
    .select()
    .from(parcelaContas)
    .where(and(eq(parcelaContas.movimentoId, movimentoId), eq(parcelaContas.status, 'ATIVO')));
  const porNumero = new Map(existentes.map((p) => [p.numeroParcela, p]));
  const total = parcelas.length;
  const gravadas: (typeof parcelaContas.$inferSelect)[] = [];

  for (const [index, parcela] of parcelas.entries()) {
    const numeroParcela = index + 1;
    const values = {
      identificacao: identificacaoParcela(numeroParcela, total),
      numeroParcela,
      dataVencimento: parcela.dataVencimento,
      valorParcela: roundMoney(parcela.valor).toFixed(2),
    };
    const atual = porNumero.get(numeroParcela);
    const [row] = atual
      ? await tx
          .update(parcelaContas)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(parcelaContas.id, atual.id))
          .returning()
      : await tx
          .insert(parcelaContas)
          .values({ ...values, movimentoId, status: 'ATIVO' })
          .returning();
    gravadas.push(row);
  }

  const excedentes = existentes.filter((p) => p.numeroParcela > total).map((p) => p.id);
  if (excedentes.length > 0) {
    await tx
      .update(parcelaContas)
      .set({ status: 'INATIVO', updatedAt: new Date() })
      .where(inArray(parcelaContas.id, excedentes));
  }
  return gravadas;
}

async function vincularClassificacoes(tx: Tx, movimentoId: number, classificacaoIds: number[]) {
  await tx
    .delete(movimentoClassificacao)
    .where(eq(movimentoClassificacao.movimentoId, movimentoId));
  await tx
    .insert(movimentoClassificacao)
    .values(
      [...new Set(classificacaoIds)].map((classificacaoId) => ({ movimentoId, classificacaoId }))
    );
}

export async function salvarMovimento(input: {
  id?: number;
  tipo: MovimentoTipo;
  pessoaId: number;
  faturadoId?: number | null;
  numeroNotaFiscal?: string | null;
  dataEmissao?: string | null;
  descricao?: string | null;
  classificacaoIds: number[];
  parcelas: { dataVencimento: string; valor: number }[];
}): Promise<ActionResult<MovimentoRow>> {
  try {
    const session = await requireModuleAccess(MODULE, 'manage');
    const parsed = validateActionInput(salvarMovimentoSchema, input);
    if (!parsed.success) return parsed.result;
    const data = parsed.data;
    const orgId = session.organizationId;
    const regra = MOVIMENTO_REGRAS[data.tipo];
    const valorTotal = roundMoney(data.parcelas.reduce((sum, p) => sum + p.valor, 0));

    const movimentoId = await db.transaction(async (tx) => {
      const [atual] = data.id
        ? await tx
            .select()
            .from(movimentoContas)
            .where(
              and(
                eq(movimentoContas.id, data.id),
                eq(movimentoContas.organizationId, orgId),
                eq(movimentoContas.tipo, data.tipo)
              )
            )
        : [];
      if (data.id && !atual) throw new RegraNegocioError('Lançamento não encontrado.');

      // Pessoa/faturado inativos só são aceitos se já estavam no lançamento
      const pessoaIds = [data.pessoaId, ...(data.faturadoId ? [data.faturadoId] : [])];
      const pessoaRows = await tx
        .select()
        .from(pessoas)
        .where(and(eq(pessoas.organizationId, orgId), inArray(pessoas.id, pessoaIds)));
      const pessoa = pessoaRows.find((p) => p.id === data.pessoaId);
      if (!pessoa || pessoa.tipo !== regra.pessoaTipo) {
        throw new RegraNegocioError(`Selecione um ${regra.pessoaTipo} válido.`);
      }
      if (pessoa.status !== 'ATIVO' && atual?.pessoaId !== pessoa.id) {
        throw new RegraNegocioError(`O ${regra.pessoaTipo} selecionado está inativo.`);
      }
      if (data.faturadoId) {
        const faturado = pessoaRows.find((p) => p.id === data.faturadoId);
        if (!faturado || faturado.tipo !== 'FATURADO') {
          throw new RegraNegocioError('Selecione um FATURADO válido.');
        }
        if (faturado.status !== 'ATIVO' && atual?.faturadoId !== faturado.id) {
          throw new RegraNegocioError('O FATURADO selecionado está inativo.');
        }
      }

      const classificacaoRows = await tx
        .select({ id: classificacao.id })
        .from(classificacao)
        .where(
          and(
            eq(classificacao.organizationId, orgId),
            eq(classificacao.tipo, regra.classificacaoTipo),
            inArray(classificacao.id, data.classificacaoIds)
          )
        );
      if (classificacaoRows.length !== new Set(data.classificacaoIds).size) {
        throw new RegraNegocioError(
          `Selecione apenas classificações do tipo ${regra.classificacaoTipo}.`
        );
      }

      const values = {
        pessoaId: data.pessoaId,
        faturadoId: data.faturadoId ?? null,
        numeroNotaFiscal: data.numeroNotaFiscal || null,
        dataEmissao: data.dataEmissao || null,
        descricao: data.descricao || null,
        valorTotal: valorTotal.toFixed(2),
      };
      const [row] = atual
        ? await tx
            .update(movimentoContas)
            .set({ ...values, updatedAt: new Date() })
            .where(eq(movimentoContas.id, atual.id))
            .returning({ id: movimentoContas.id })
        : await tx
            .insert(movimentoContas)
            .values({ ...values, organizationId: orgId, tipo: data.tipo, status: 'ATIVO' })
            .returning({ id: movimentoContas.id });

      await vincularClassificacoes(tx, row.id, data.classificacaoIds);
      await gravarParcelas(tx, row.id, data.parcelas);
      return row.id;
    });

    await writeAuditLog({
      action: data.id ? 'update' : 'create',
      entityType: 'movimento_contas',
      details: `${data.tipo} ID ${movimentoId}: ${valorTotal.toFixed(2)} em ${data.parcelas.length} parcela(s)`,
    });
    const [movimento] = await carregarMovimentos(orgId, [movimentoId]);
    return {
      success: true,
      data: movimento,
      message: data.id ? 'Lançamento atualizado.' : `Lançamento registrado (ID ${movimentoId}).`,
    };
  } catch (error) {
    return falha(error, 'salvarMovimento');
  }
}

export async function alterarStatusMovimento(
  id: number,
  status: CadastroStatus
): Promise<ActionResult<{ id: number; status: CadastroStatus }>> {
  try {
    const session = await requireModuleAccess(MODULE, 'manage');
    const parsed = validateActionInput(alterarStatusSchema, { id, status });
    if (!parsed.success) return parsed.result;
    const [row] = await db
      .update(movimentoContas)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(
        and(eq(movimentoContas.id, id), eq(movimentoContas.organizationId, session.organizationId))
      )
      .returning({ id: movimentoContas.id, status: movimentoContas.status });
    if (!row) return { success: false, error: 'Lançamento não encontrado.' };
    await writeAuditLog({
      action: 'update',
      entityType: 'movimento_contas',
      details: `Movimento ID ${row.id} → ${row.status}`,
    });
    return {
      success: true,
      data: { id: row.id, status: row.status as CadastroStatus },
      message: status === 'INATIVO' ? 'Lançamento inativado.' : 'Lançamento reativado.',
    };
  } catch (error) {
    return falha(error, 'alterarStatusMovimento');
  }
}

// ----------------------------------------------------
// Análise da nota extraída (2ª etapa): consulta no banco e lançamento
// ----------------------------------------------------

async function consultarPessoa(
  executor: Tx | typeof db,
  orgId: string,
  tipo: PessoaTipo,
  nome: string,
  documento: string
) {
  const porDocumento = documento.length === 11 || documento.length === 14;
  if (!porDocumento && !nome) return undefined;
  const [row] = await executor
    .select()
    .from(pessoas)
    .where(
      and(
        eq(pessoas.organizationId, orgId),
        eq(pessoas.tipo, tipo),
        porDocumento
          ? eq(pessoas.documento, documento)
          : sql`upper(${pessoas.razaoSocial}) = ${normalizeDescricao(nome)}`
      )
    )
    .orderBy(asc(pessoas.id))
    .limit(1);
  return row;
}

async function consultarClassificacoes(
  executor: Tx | typeof db,
  orgId: string,
  tipo: ClassificacaoTipo,
  descricoes: string[]
) {
  if (descricoes.length === 0) return [];
  return executor
    .select()
    .from(classificacao)
    .where(
      and(
        eq(classificacao.organizationId, orgId),
        eq(classificacao.tipo, tipo),
        inArray(classificacao.descricao, descricoes)
      )
    );
}

async function consultarMovimentoDuplicado(
  executor: Tx | typeof db,
  orgId: string,
  pessoaId: number,
  numeroNotaFiscal: string | null
) {
  if (!numeroNotaFiscal) return undefined;
  const [row] = await executor
    .select({ id: movimentoContas.id })
    .from(movimentoContas)
    .where(
      and(
        eq(movimentoContas.organizationId, orgId),
        eq(movimentoContas.tipo, 'APAGAR'),
        eq(movimentoContas.status, 'ATIVO'),
        eq(movimentoContas.pessoaId, pessoaId),
        eq(movimentoContas.numeroNotaFiscal, numeroNotaFiscal)
      )
    )
    .limit(1);
  return row;
}

function toConsulta(
  nome: string,
  documento: string | null,
  row: { id: number; status: string } | undefined
): EntidadeConsulta {
  return {
    nome,
    documento: documento ? formatDocumento(documento) : null,
    existe: Boolean(row),
    id: row?.id ?? null,
    status: (row?.status as CadastroStatus | undefined) ?? null,
  };
}

/** Consulta no banco se FORNECEDOR, FATURADO e DESPESA da nota já existem */
export async function analisarNotaFiscal(nota: unknown): Promise<ActionResult<NotaAnalise>> {
  try {
    const session = await requireModuleAccess(MODULE, 'view');
    const parsed = validateActionInput(notaExtraidaSchema, nota);
    if (!parsed.success) return parsed.result;
    const { payload, pendencias } = buildNotaPayload(parsed.data);
    const orgId = session.organizationId;

    const [fornecedor, faturado, despesas] = await Promise.all([
      consultarPessoa(
        db,
        orgId,
        'FORNECEDOR',
        payload.fornecedor.razaoSocial,
        payload.fornecedor.documento
      ),
      consultarPessoa(
        db,
        orgId,
        'FATURADO',
        payload.faturado.razaoSocial,
        payload.faturado.documento
      ),
      consultarClassificacoes(db, orgId, 'DESPESA', payload.despesas),
    ]);
    const duplicado = fornecedor
      ? await consultarMovimentoDuplicado(db, orgId, fornecedor.id, payload.numeroNotaFiscal)
      : undefined;

    return {
      success: true,
      data: {
        fornecedor: toConsulta(
          payload.fornecedor.razaoSocial,
          payload.fornecedor.documento,
          fornecedor
        ),
        faturado: toConsulta(payload.faturado.razaoSocial, payload.faturado.documento, faturado),
        despesas: payload.despesas.map((descricao) =>
          toConsulta(
            descricao,
            null,
            despesas.find((d) => d.descricao === descricao)
          )
        ),
        movimentoExistenteId: duplicado?.id ?? null,
        pendencias,
      },
    };
  } catch (error) {
    return falha(error, 'analisarNotaFiscal');
  }
}

/** Localiza a pessoa; cria quando não existe e reativa quando está inativa */
async function garantirPessoa(
  tx: Tx,
  orgId: string,
  tipo: PessoaTipo,
  dados: { razaoSocial: string; fantasia?: string | null; documento: string }
): Promise<{ id: number; acao: Acao }> {
  const existente = await consultarPessoa(tx, orgId, tipo, dados.razaoSocial, dados.documento);
  if (existente) {
    if (existente.status === 'ATIVO') return { id: existente.id, acao: 'existente' };
    await tx
      .update(pessoas)
      .set({ status: 'ATIVO', updatedAt: new Date() })
      .where(eq(pessoas.id, existente.id));
    return { id: existente.id, acao: 'reativado' };
  }
  const [criada] = await tx
    .insert(pessoas)
    .values({
      organizationId: orgId,
      tipo,
      razaoSocial: dados.razaoSocial,
      fantasia: dados.fantasia || null,
      documento: dados.documento,
      status: 'ATIVO',
    })
    .onConflictDoNothing()
    .returning({ id: pessoas.id });
  if (criada) return { id: criada.id, acao: 'criado' };
  // Criada por outra requisição ao mesmo tempo
  const concorrente = await consultarPessoa(tx, orgId, tipo, dados.razaoSocial, dados.documento);
  if (!concorrente) throw new Error(`Falha ao gravar ${tipo}.`);
  return { id: concorrente.id, acao: 'existente' };
}

async function garantirDespesas(
  tx: Tx,
  orgId: string,
  descricoes: string[]
): Promise<{ id: number; descricao: string; acao: Acao }[]> {
  const existentes = await consultarClassificacoes(tx, orgId, 'DESPESA', descricoes);
  const resultado: { id: number; descricao: string; acao: Acao }[] = [];
  for (const descricao of descricoes) {
    const atual = existentes.find((c) => c.descricao === descricao);
    if (atual) {
      if (atual.status !== 'ATIVO') {
        await tx
          .update(classificacao)
          .set({ status: 'ATIVO', updatedAt: new Date() })
          .where(eq(classificacao.id, atual.id));
      }
      resultado.push({
        id: atual.id,
        descricao,
        acao: atual.status === 'ATIVO' ? 'existente' : 'reativado',
      });
      continue;
    }
    const [criada] = await tx
      .insert(classificacao)
      .values({ organizationId: orgId, tipo: 'DESPESA', descricao, status: 'ATIVO' })
      .onConflictDoNothing()
      .returning({ id: classificacao.id });
    const id =
      criada?.id ?? (await consultarClassificacoes(tx, orgId, 'DESPESA', [descricao]))[0]?.id;
    if (!id) throw new Error(`Falha ao gravar a classificação ${descricao}.`);
    resultado.push({ id, descricao, acao: criada ? 'criado' : 'existente' });
  }
  return resultado;
}

/**
 * Cria o que faltar (fornecedor, faturado, despesas) e lança o movimento
 * APAGAR com suas parcelas, tudo numa única transação.
 */
export async function lancarNotaFiscal(nota: unknown): Promise<ActionResult<LancamentoResultado>> {
  try {
    const session = await requireModuleAccess(MODULE, 'manage');
    const parsed = validateActionInput(notaExtraidaSchema, nota);
    if (!parsed.success) return parsed.result;
    const { payload, pendencias } = buildNotaPayload(parsed.data);
    if (pendencias.length > 0) {
      return {
        success: false,
        error: `Não é possível lançar: ${pendencias.join(' ')}`,
      };
    }
    const orgId = session.organizationId;

    const resultado = await db.transaction(async (tx) => {
      const fornecedor = await garantirPessoa(tx, orgId, 'FORNECEDOR', payload.fornecedor);
      const duplicado = await consultarMovimentoDuplicado(
        tx,
        orgId,
        fornecedor.id,
        payload.numeroNotaFiscal
      );
      if (duplicado) {
        throw new RegraNegocioError(
          `A nota fiscal nº ${payload.numeroNotaFiscal} deste fornecedor já foi lançada (movimento ID ${duplicado.id}).`
        );
      }
      const faturado = await garantirPessoa(tx, orgId, 'FATURADO', payload.faturado);
      const despesas = await garantirDespesas(tx, orgId, payload.despesas);

      const [movimento] = await tx
        .insert(movimentoContas)
        .values({
          organizationId: orgId,
          tipo: 'APAGAR',
          numeroNotaFiscal: payload.numeroNotaFiscal,
          dataEmissao: payload.dataEmissao,
          descricao: payload.descricao,
          valorTotal: payload.valorTotal.toFixed(2),
          pessoaId: fornecedor.id,
          faturadoId: faturado.id,
          status: 'ATIVO',
        })
        .returning({ id: movimentoContas.id });

      await vincularClassificacoes(
        tx,
        movimento.id,
        despesas.map((d) => d.id)
      );
      const parcelas = await gravarParcelas(tx, movimento.id, payload.parcelas);

      return {
        movimentoId: movimento.id,
        valorTotal: payload.valorTotal,
        fornecedor,
        faturado,
        despesas,
        parcelas: parcelas.map((p) => ({
          id: p.id,
          identificacao: p.identificacao,
          dataVencimento: p.dataVencimento,
          valorParcela: Number(p.valorParcela),
        })),
      } satisfies LancamentoResultado;
    });

    await writeAuditLog({
      action: 'create',
      entityType: 'movimento_contas',
      details: `NF ${payload.numeroNotaFiscal ?? 's/n'} lançada como movimento ID ${resultado.movimentoId}`,
    });
    return {
      success: true,
      data: resultado,
      message: `Registro lançado com sucesso (movimento ID ${resultado.movimentoId}).`,
    };
  } catch (error) {
    return falha(error, 'lancarNotaFiscal');
  }
}
