// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { PermissionError } from '@/lib/permissions';
import type { ExtractedInvoiceData } from '@/lib/mistralInvoiceAgent';

const state = vi.hoisted(() => ({ org: '10000000-0000-4000-8000-000000000001', denied: false }));
vi.mock('@/db', async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const schema = await import('@/db/schema');
  const client = new PGlite();
  return { db: drizzle(client, { schema }), testClient: client };
});
vi.mock('@/lib/permissionGuard', () => ({
  requireModuleAccess: vi.fn(async () => {
    if (state.denied) throw new PermissionError('processador-nf', 'manage', 'Contador');
    return { organizationId: state.org };
  }),
}));
vi.mock('@/lib/audit', () => ({ writeAuditLog: vi.fn() }));

import { db } from '@/db';
import {
  analisarNotaFiscal,
  cadastrarItensNotaFiscal,
  lancarNotaFiscal,
  buscarProdutos,
  alterarStatusProduto,
  salvarProduto,
} from '../administrativo';

const nota: ExtractedInvoiceData = {
  fornecedor: { razaoSocial: 'Empresa X', cnpj: '11.222.333/0001-81' },
  faturado: { nomeCompleto: 'Produtor', cpf: '529.982.247-25' },
  numeroNotaFiscal: '123',
  dataEmissao: '2026-10-22',
  descricaoProdutos: ['Parafuso', '  PARAFUSO  ', 'Porca'],
  parcelas: [{ numero: 1, dataVencimento: '2026-11-22', valor: 100 }],
  quantidadeParcelas: 1,
  dataVencimento: '2026-11-22',
  valorTotal: 100,
  tipoDespesa: 'MANUTENÇÃO',
  classificacaoDespesa: ['MANUTENÇÃO'],
};
let client: PGlite;
beforeAll(async () => {
  client = ((await import('@/db')) as unknown as { testClient: PGlite }).testClient;
  await client.exec('CREATE TABLE organizations (id uuid PRIMARY KEY, name varchar(255));');
  for (const file of ['0006_atividade_n2_contas.sql', '0007_nf_product_catalog.sql']) {
    await client.exec(await readFile(`drizzle/${file}`, 'utf8'));
  }
  await client.exec(
    `INSERT INTO organizations VALUES ('${state.org}', 'Teste'), ('10000000-0000-4000-8000-000000000002', 'Outra');`
  );
}, 30000);
beforeEach(async () => {
  state.org = '10000000-0000-4000-8000-000000000001';
  state.denied = false;
  await client.exec(
    'TRUNCATE movimento_produto, movimento_classificacao, parcela_contas, movimento_contas, produtos, classificacao, pessoas RESTART IDENTITY CASCADE;'
  );
});
afterAll(async () => {
  await client?.close();
});

describe('cadastros da nota em PostgreSQL embarcado', () => {
  it('mantém o catálogo editável, pesquisável e sem nomes normalizados repetidos', async () => {
    const salvo = await salvarProduto({ descricao: '  Parafuso   M10 ' });
    if (!salvo.success) throw new Error(salvo.error);
    expect(salvo.data.descricao).toBe('PARAFUSO M10');
    expect((await salvarProduto({ descricao: 'parafuso m10' })).success).toBe(false);
    const editado = await salvarProduto({ id: salvo.data.id, descricao: 'Parafuso M12' });
    expect(editado.success && editado.data.descricao).toBe('PARAFUSO M12');
    expect(await buscarProdutos({ termo: 'parafuso m12' })).toMatchObject({
      success: true,
      data: [{ id: salvo.data.id }],
    });
    await alterarStatusProduto(salvo.data.id, 'INATIVO');
    expect(await buscarProdutos({ todos: true })).toMatchObject({ success: true, data: [] });
    expect(await buscarProdutos({ termo: 'M12', incluirInativos: true })).toMatchObject({
      success: true,
      data: [{ status: 'INATIVO' }],
    });
  });

  it('identifica empresa e produtos ausentes e cadastra juntos sem lançar pagamento', async () => {
    const antes = await analisarNotaFiscal(nota);
    expect(antes.success && antes.data.produtos).toMatchObject([
      { nome: 'PARAFUSO', existe: false },
      { nome: 'PORCA', existe: false },
    ]);
    expect(antes.success && antes.data.fornecedor.existe).toBe(false);
    const salvo = await cadastrarItensNotaFiscal({
      ...nota,
      faturado: { nomeCompleto: '', cpf: '' },
      parcelas: [],
      dataVencimento: null,
      valorTotal: null,
    });
    expect(salvo.success).toBe(true);
    expect(salvo.success && salvo.data.produtos).toHaveLength(2);
    expect(await db.select().from(schema.movimentoContas)).toHaveLength(0);
    const depois = await analisarNotaFiscal(nota);
    expect(depois.success && depois.data.fornecedor.existe).toBe(true);
    expect(depois.success && depois.data.produtos.every((p) => p.existe)).toBe(true);
  });

  it('reaproveita cadastros ao repetir e reativa inativos mantendo seus IDs', async () => {
    const primeiro = await cadastrarItensNotaFiscal(nota);
    if (!primeiro.success) throw new Error(primeiro.error);
    const segundo = await cadastrarItensNotaFiscal(nota);
    expect(segundo.success && segundo.data.fornecedor.acao).toBe('existente');
    await alterarStatusProduto(primeiro.data.produtos[0].id, 'INATIVO');
    await db
      .update(schema.pessoas)
      .set({ status: 'INATIVO' })
      .where(eq(schema.pessoas.id, primeiro.data.fornecedor.id));
    const terceiro = await cadastrarItensNotaFiscal(nota);
    expect(terceiro.success && terceiro.data.fornecedor).toEqual({
      id: primeiro.data.fornecedor.id,
      acao: 'reativado',
    });
    expect(terceiro.success && terceiro.data.produtos[0]).toMatchObject({
      id: primeiro.data.produtos[0].id,
      acao: 'reativado',
    });
    expect(await db.select().from(schema.produtos)).toHaveLength(2);
    expect(await db.select().from(schema.pessoas)).toHaveLength(1);
  });

  it('lança a nota, vincula produtos e parcelas e bloqueia repetição', async () => {
    const resultado = await lancarNotaFiscal(nota);
    expect(resultado.success).toBe(true);
    if (!resultado.success) throw new Error(resultado.error);
    expect(resultado.data.produtos).toHaveLength(2);
    expect(await db.select().from(schema.movimentoProduto)).toHaveLength(2);
    expect(await db.select().from(schema.parcelaContas)).toHaveLength(1);
    expect((await lancarNotaFiscal(nota)).success).toBe(false);
    expect((await lancarNotaFiscal({ ...nota, numeroNotaFiscal: '000.000.123' })).success).toBe(
      false
    );
    expect(await db.select().from(schema.movimentoContas)).toHaveLength(1);
    const consulta = await analisarNotaFiscal(nota);
    expect(consulta.success && consulta.data.movimentoExistenteId).toBe(resultado.data.movimentoId);
  });

  it('isola consultas, IDs, alterações e cadastros por organização', async () => {
    const a = await cadastrarItensNotaFiscal(nota);
    if (!a.success) throw new Error(a.error);
    state.org = '10000000-0000-4000-8000-000000000002';
    const consulta = await analisarNotaFiscal(nota);
    expect(consulta.success && consulta.data.fornecedor.existe).toBe(false);
    expect(await buscarProdutos({ todos: true })).toMatchObject({ success: true, data: [] });
    expect((await alterarStatusProduto(a.data.produtos[0].id, 'INATIVO')).success).toBe(false);
    expect((await salvarProduto({ id: a.data.produtos[0].id, descricao: 'Mudado' })).success).toBe(
      false
    );
    const b = await cadastrarItensNotaFiscal(nota);
    expect(b.success && b.data.produtos[0].id).not.toBe(a.data.produtos[0].id);
  });

  it('desfaz empresa e produtos juntos se uma gravação falhar', async () => {
    await client.exec(
      "ALTER TABLE produtos ADD CONSTRAINT teste_falha CHECK (descricao <> 'PORCA');"
    );
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect((await cadastrarItensNotaFiscal(nota)).success).toBe(false);
      expect(await db.select().from(schema.pessoas)).toHaveLength(0);
      expect(await db.select().from(schema.produtos)).toHaveLength(0);
    } finally {
      await client.exec('ALTER TABLE produtos DROP CONSTRAINT teste_falha;');
      spy.mockRestore();
    }
  });

  it('bloqueia dados inválidos, parcelas divergentes e perfil sem permissão', async () => {
    expect(
      (
        await cadastrarItensNotaFiscal({
          ...nota,
          fornecedor: { ...nota.fornecedor, cnpj: '11.111.111/1111-11' },
        })
      ).success
    ).toBe(false);
    expect((await lancarNotaFiscal({ ...nota, valorTotal: 200 })).success).toBe(false);
    expect(
      (
        await lancarNotaFiscal({
          ...nota,
          parcelas: [...nota.parcelas, { numero: 2, dataVencimento: null, valor: 10 }],
        })
      ).success
    ).toBe(false);
    state.denied = true;
    expect((await cadastrarItensNotaFiscal(nota)).success).toBe(false);
    expect(await db.select().from(schema.produtos)).toHaveLength(0);
  });
});
