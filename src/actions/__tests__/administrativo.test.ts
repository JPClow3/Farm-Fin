import { beforeAll, describe, expect, it } from 'vitest';
import {
  alterarStatusPessoa,
  analisarNotaFiscal,
  buscarMovimentos,
  buscarPessoas,
  lancarNotaFiscal,
  salvarMovimento,
  salvarPessoa,
} from '../administrativo';

// Integração com um PostgreSQL real e migrado (drizzle/0006). Roda apenas
// quando ADMINISTRATIVO_TEST_DATABASE_URL aponta para um banco descartável.
const databaseUrl = process.env.ADMINISTRATIVO_TEST_DATABASE_URL;

const nota = {
  fornecedor: {
    razaoSocial: 'IGUAÇU MAQUINAS LTDA',
    nomeFantasia: null,
    cnpj: '11.222.333/0001-81',
  },
  faturado: { nomeCompleto: 'BELTRANO DA SILVA', cpf: '529.982.247-25' },
  numeroNotaFiscal: `NF-${Date.now()}`,
  dataEmissao: '2026-09-28',
  descricaoProdutos: ['OLEO DIESEL'],
  quantidadeParcelas: 2,
  parcelas: [
    { numero: 1, dataVencimento: '2026-10-28', valor: 100 },
    { numero: 2, dataVencimento: '2026-11-28', valor: 50.5 },
  ],
  dataVencimento: '2026-10-28',
  valorTotal: 150.5,
  tipoDespesa: 'MANUTENÇÃO E OPERAÇÃO',
  classificacaoDespesa: ['MANUTENÇÃO E OPERAÇÃO'],
};

describe.skipIf(!databaseUrl)('Atividade N2: análise e lançamento da nota', () => {
  beforeAll(() => {
    process.env.DATABASE_URL = databaseUrl;
  });

  it('informa NÃO EXISTE, lança tudo e depois informa EXISTE com o ID', async () => {
    const antes = await analisarNotaFiscal(nota);
    expect(antes.success).toBe(true);
    if (!antes.success) return;
    expect(antes.data.pendencias).toEqual([]);

    const lancamento = await lancarNotaFiscal(nota);
    expect(lancamento.success).toBe(true);
    if (!lancamento.success) return;
    expect(lancamento.data.parcelas.map((p) => p.identificacao)).toEqual(['1/2', '2/2']);
    expect(lancamento.data.valorTotal).toBe(150.5);

    const depois = await analisarNotaFiscal(nota);
    expect(depois.success).toBe(true);
    if (!depois.success) return;
    expect(depois.data.fornecedor).toMatchObject({
      existe: true,
      id: lancamento.data.fornecedor.id,
      documento: '11.222.333/0001-81',
    });
    expect(depois.data.faturado).toMatchObject({ existe: true, id: lancamento.data.faturado.id });
    expect(depois.data.despesas[0]).toMatchObject({
      existe: true,
      id: lancamento.data.despesas[0].id,
    });
    expect(depois.data.movimentoExistenteId).toBe(lancamento.data.movimentoId);

    const duplicado = await lancarNotaFiscal(nota);
    expect(duplicado.success).toBe(false);
  });

  it('busca por vários termos, inativa e reativa sem excluir', async () => {
    const criada = await salvarPessoa({
      tipo: 'CLIENTE',
      razaoSocial: 'Cooperativa Agro Teste',
      documento: '04.252.011/0001-10',
    });
    expect(criada.success).toBe(true);
    if (!criada.success) return;
    expect(criada.data.status).toBe('ATIVO');

    const busca = await buscarPessoas({ termo: 'cooperativa teste' });
    expect(busca.success && busca.data.some((p) => p.id === criada.data.id)).toBe(true);

    await alterarStatusPessoa(criada.data.id, 'INATIVO');
    const todos = await buscarPessoas({ todos: true });
    expect(todos.success && todos.data.some((p) => p.id === criada.data.id)).toBe(false);
    const comInativos = await buscarPessoas({ termo: 'cooperativa', incluirInativos: true });
    expect(
      comInativos.success && comInativos.data.find((p) => p.id === criada.data.id)?.status
    ).toBe('INATIVO');

    const reativada = await alterarStatusPessoa(criada.data.id, 'ATIVO');
    expect(reativada.success && reativada.data.status).toBe('ATIVO');
  });

  it('edita parcelas de um movimento e inativa as excedentes', async () => {
    const lancamento = await lancarNotaFiscal({
      ...nota,
      numeroNotaFiscal: `NF-EDIT-${Date.now()}`,
    });
    expect(lancamento.success).toBe(true);
    if (!lancamento.success) return;

    const editado = await salvarMovimento({
      id: lancamento.data.movimentoId,
      tipo: 'APAGAR',
      pessoaId: lancamento.data.fornecedor.id,
      faturadoId: lancamento.data.faturado.id,
      classificacaoIds: lancamento.data.despesas.map((d) => d.id),
      parcelas: [{ dataVencimento: '2026-12-01', valor: 200 }],
    });
    expect(editado.success).toBe(true);
    if (!editado.success) return;
    expect(editado.data.valorTotal).toBe(200);
    expect(editado.data.parcelas).toHaveLength(1);
    expect(editado.data.parcelas[0].identificacao).toBe('ÚNICA');

    const busca = await buscarMovimentos({ tipo: 'APAGAR', termo: 'manutenção beltrano' });
    expect(busca.success && busca.data.some((m) => m.id === lancamento.data.movimentoId)).toBe(
      true
    );
  });
});
