import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react';
import { NotaDraftProvider } from '@/context/NotaDraftContext';
import ProcessadorNfPage from '../page';
import {
  analisarNotaFiscal,
  cadastrarItensNotaFiscal,
  lancarNotaFiscal,
} from '@/actions/administrativo';
import { getAuthSessionAction } from '@/actions/auth';
import { buildNotaPayload, type NotaAnalise } from '@/lib/administrativo';
import type { ExtractedInvoiceData } from '@/lib/mistralInvoiceAgent';
import { useState } from 'react';

const render = (ui: React.ReactNode) => rtlRender(<NotaDraftProvider>{ui}</NotaDraftProvider>);

vi.mock('@/lib/useModuleGuard', () => ({ useModuleGuard: () => true }));
vi.mock('@/context/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock('@/actions/auth', () => ({ getAuthSessionAction: vi.fn() }));
vi.mock('@/actions/administrativo', () => ({
  analisarNotaFiscal: vi.fn(),
  cadastrarItensNotaFiscal: vi.fn(),
  lancarNotaFiscal: vi.fn(),
}));
const nota: ExtractedInvoiceData = {
  fornecedor: { razaoSocial: 'Empresa X', cnpj: '11.222.333/0001-81' },
  faturado: { nomeCompleto: 'Produtor', cpf: '529.982.247-25' },
  numeroNotaFiscal: '123',
  dataEmissao: '2026-10-22',
  descricaoProdutos: ['Parafuso'],
  quantidadeParcelas: 1,
  parcelas: [{ numero: 1, dataVencimento: '2026-11-22', valor: 100 }],
  dataVencimento: '2026-11-22',
  valorTotal: 100,
  tipoDespesa: 'MANUTENÇÃO',
  classificacaoDespesa: ['MANUTENÇÃO'],
};
let exists = false;
function analysis(data: ExtractedInvoiceData): NotaAnalise {
  const { payload, pendencias, pendenciasCadastro } = buildNotaPayload(data);
  const entity = (nome: string) => ({
    nome,
    documento: null,
    existe: exists,
    id: exists ? 1 : null,
    status: exists ? ('ATIVO' as const) : null,
  });
  return {
    fornecedor: entity(payload.fornecedor.razaoSocial),
    produtos: payload.produtos.map(entity),
    faturado: entity('Produtor'),
    despesas: [entity('MANUTENÇÃO')],
    pendencias,
    pendenciasCadastro,
    movimentoExistenteId: null,
  };
}
function prepareFetch(
  data = nota,
  review = { required: false, issues: [], ocrMinimumPageConfidence: 0.95 }
) {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementation(
        async () => new Response(JSON.stringify({ success: true, data, review }), { status: 200 })
      )
  );
}
async function extract() {
  render(<ProcessadorNfPage />);
  fireEvent.change(screen.getByLabelText('Selecionar PDF da nota fiscal'), {
    target: { files: [new File(['%PDF-1.4'], 'nf.pdf', { type: 'application/pdf' })] },
  });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Extrair dados da nota' })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole('button', { name: 'Extrair dados da nota' }));
  await screen.findByRole('heading', { name: 'Confira os dados da nota' });
}
beforeEach(() => {
  vi.resetAllMocks();
  exists = false;
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.mocked(getAuthSessionAction).mockResolvedValue({ role: 'Produtor' } as Awaited<
    ReturnType<typeof getAuthSessionAction>
  >);
  vi.mocked(analisarNotaFiscal).mockImplementation(async (data) => ({
    success: true,
    data: analysis(data as ExtractedInvoiceData),
  }));
  vi.mocked(cadastrarItensNotaFiscal).mockImplementation(async () => {
    exists = true;
    return {
      success: true,
      data: {
        fornecedor: { id: 1, acao: 'criado' },
        produtos: [{ id: 1, descricao: 'PARAFUSO', acao: 'criado' }],
      },
    };
  });
  prepareFetch();
});
afterEach(() => vi.unstubAllGlobals());

describe('revisão e cadastro da NF', () => {
  it('mantém o bloqueio da gravação ao navegar e atualiza os cadastros quando ela termina', async () => {
    let finish!: (result: Awaited<ReturnType<typeof cadastrarItensNotaFiscal>>) => void;
    vi.mocked(cadastrarItensNotaFiscal).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    function Navigation() {
      const [reader, setReader] = useState(true);
      return (
        <>
          <button onClick={() => setReader(!reader)}>Alternar catálogo</button>
          {reader && <ProcessadorNfPage />}
        </>
      );
    }
    render(<Navigation />);
    fireEvent.change(screen.getByLabelText('Selecionar PDF da nota fiscal'), {
      target: { files: [new File(['%PDF-1.4'], 'nf.pdf', { type: 'application/pdf' })] },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Extrair dados da nota' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Extrair dados da nota' }));
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Conferi os dados com o PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar empresa e produtos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alternar catálogo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alternar catálogo' }));
    expect(screen.getByLabelText('Produto 1')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Consultar cadastros' })).toBeDisabled();
    exists = true;
    await act(async () =>
      finish({
        success: true,
        data: {
          fornecedor: { id: 1, acao: 'criado' },
          produtos: [{ id: 1, descricao: 'PARAFUSO', acao: 'criado' }],
        },
      })
    );
    expect(await screen.findAllByText('Já cadastrado')).toHaveLength(2);
    expect(screen.getByLabelText('Produto 1')).toBeEnabled();
    expect(cadastrarItensNotaFiscal).toHaveBeenCalledTimes(1);
  });

  it('não aplica a resposta de uma extração abandonada à próxima nota', async () => {
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          })
      )
    );
    function Navigation() {
      const [reader, setReader] = useState(true);
      return (
        <>
          <button onClick={() => setReader(!reader)}>Alternar catálogo</button>
          {reader && <ProcessadorNfPage />}
        </>
      );
    }
    render(<Navigation />);
    fireEvent.change(screen.getByLabelText('Selecionar PDF da nota fiscal'), {
      target: { files: [new File(['%PDF-1.4'], 'primeira.pdf', { type: 'application/pdf' })] },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Extrair dados da nota' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Extrair dados da nota' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alternar catálogo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alternar catálogo' }));
    fireEvent.change(screen.getByLabelText('Selecionar PDF da nota fiscal'), {
      target: { files: [new File(['%PDF-1.4'], 'segunda.pdf', { type: 'application/pdf' })] },
    });
    await act(async () => finish(new Response(JSON.stringify({ success: true, data: nota }))));
    expect(screen.getByText('segunda.pdf')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Confira os dados da nota' })
    ).not.toBeInTheDocument();
  });

  it('mantém arquivo e correções após consultar outra tela, mas exige nova conferência', async () => {
    function Navigation() {
      const [reader, setReader] = useState(true);
      return (
        <>
          <button onClick={() => setReader(!reader)}>Alternar catálogo</button>
          {reader && <ProcessadorNfPage />}
        </>
      );
    }
    render(<Navigation />);
    fireEvent.change(screen.getByLabelText('Selecionar PDF da nota fiscal'), {
      target: { files: [new File(['%PDF-1.4'], 'rascunho.pdf', { type: 'application/pdf' })] },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Extrair dados da nota' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Extrair dados da nota' }));
    await screen.findByRole('heading', { name: 'Confira os dados da nota' });
    fireEvent.change(screen.getByLabelText('Produto 1'), {
      target: { value: 'Parafuso M10 revisado' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar cadastros' }));
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Conferi os dados com o PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alternar catálogo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alternar catálogo' }));
    await screen.findByText('PARAFUSO M10 REVISADO');
    expect(screen.getByText('rascunho.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('Produto 1')).toHaveValue('Parafuso M10 revisado');
    expect(screen.getByRole('checkbox', { name: 'Conferi os dados com o PDF' })).not.toBeChecked();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('destaca o campo inválido, associa sua mensagem e permite focá-lo pelo resumo', async () => {
    prepareFetch({ ...nota, fornecedor: { ...nota.fornecedor, cnpj: '123' } });
    await extract();
    const input = screen.getByLabelText('CPF/CNPJ do fornecedor');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Informe um CPF/CNPJ válido para o fornecedor.');
    fireEvent.click(
      (
        await screen.findAllByRole('link', {
          name: 'Informe um CPF/CNPJ válido para o fornecedor.',
        })
      )[0]
    );
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: '11.222.333/0001-81' } });
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('pede confirmação antes de descartar as correções e permite cancelar', async () => {
    await extract();
    fireEvent.click(screen.getByRole('button', { name: 'Trocar nota' }));
    expect(screen.getByRole('dialog', { name: 'Descartar esta nota?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar conferência' }));
    expect(screen.getByLabelText('Produto 1')).toHaveValue('Parafuso');
    fireEvent.click(screen.getByRole('button', { name: 'Trocar nota' }));
    fireEvent.click(screen.getByRole('button', { name: 'Descartar e trocar nota' }));
    await screen.findByRole('heading', { name: 'Envie sua nota fiscal' });
    expect(
      screen.queryByRole('heading', { name: 'Confira os dados da nota' })
    ).not.toBeInTheDocument();
  });

  it('informa empresa e produto ausentes e cadastra ambos com uma ação', async () => {
    await extract();
    expect(await screen.findAllByText('Não cadastrado')).toHaveLength(2);
    const button = screen.getByRole('button', { name: 'Cadastrar empresa e produtos' });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Conferi os dados com o PDF' }));
    fireEvent.click(button);
    await screen.findByText('Empresa e produtos cadastrados com sucesso.');
    expect(cadastrarItensNotaFiscal).toHaveBeenCalledTimes(1);
    expect(cadastrarItensNotaFiscal).toHaveBeenCalledWith(nota);
    expect(await screen.findAllByText('Já cadastrado')).toHaveLength(2);
    expect(lancarNotaFiscal).not.toHaveBeenCalled();
  });

  it('permite cadastrar com pagamento incompleto, mas bloqueia o lançamento', async () => {
    prepareFetch({ ...nota, parcelas: [], valorTotal: null, dataVencimento: null });
    await extract();
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Conferi os dados com o PDF' }));
    expect(screen.getByRole('button', { name: 'Lançar conta a pagar' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar empresa e produtos' }));
    await waitFor(() => expect(cadastrarItensNotaFiscal).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/ponto\(s\) para conferir/)).toBeInTheDocument();
    expect(screen.getByLabelText('JSON revisado da nota fiscal')).toHaveTextContent(
      '"required": true'
    );
  });

  it('invalida a consulta ao editar e envia os produtos corrigidos', async () => {
    await extract();
    await screen.findAllByText('Não cadastrado');
    fireEvent.change(screen.getByLabelText('Produto 1'), { target: { value: 'Parafuso M10' } });
    expect(screen.queryByText('Não cadastrado')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lançar conta a pagar' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Consultar cadastros' }));
    await screen.findByText('PARAFUSO M10');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Conferi os dados com o PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar empresa e produtos' }));
    await waitFor(() =>
      expect(cadastrarItensNotaFiscal).toHaveBeenCalledWith(
        expect.objectContaining({ descricaoProdutos: ['Parafuso M10'] })
      )
    );
  });

  it('ignora consulta antiga quando a nota é alterada durante a busca', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof analisarNotaFiscal>>) => void;
    vi.mocked(analisarNotaFiscal).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      })
    );
    await extract();
    fireEvent.change(screen.getByLabelText('Produto 1'), { target: { value: 'Arruela' } });
    await act(async () => resolve({ success: true, data: analysis(nota) }));
    expect(screen.queryByText('Não cadastrado')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lançar conta a pagar' })).toBeDisabled();
  });

  it('mostra falha da consulta com retry sem chamar o OCR novamente', async () => {
    vi.mocked(analisarNotaFiscal).mockRejectedValueOnce(new Error('offline'));
    await extract();
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar consulta novamente' }));
    await screen.findAllByText('Não cadastrado');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('bloqueia nota já lançada', async () => {
    vi.mocked(analisarNotaFiscal).mockResolvedValue({
      success: true,
      data: { ...analysis(nota), movimentoExistenteId: 99 },
    });
    await extract();
    await screen.findByText(/Esta nota já foi lançada/);
    expect(screen.queryByRole('button', { name: 'Lançar conta a pagar' })).not.toBeInTheDocument();
  });

  it('bloqueia leitura de novas notas para perfil de consulta', async () => {
    vi.mocked(getAuthSessionAction).mockResolvedValue({ role: 'Contador' } as Awaited<
      ReturnType<typeof getAuthSessionAction>
    >);
    render(<ProcessadorNfPage />);
    fireEvent.change(screen.getByLabelText('Selecionar PDF da nota fiscal'), {
      target: { files: [new File(['%PDF-1.4'], 'nf.pdf', { type: 'application/pdf' })] },
    });
    await waitFor(() => expect(getAuthSessionAction).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Extrair dados da nota' })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('lança e apresenta confirmação com link para a conta a pagar', async () => {
    vi.mocked(lancarNotaFiscal).mockResolvedValue({
      success: true,
      data: {
        movimentoId: 42,
        valorTotal: 100,
        fornecedor: { id: 1, acao: 'criado' },
        faturado: { id: 2, acao: 'criado' },
        despesas: [],
        produtos: [{ id: 1, descricao: 'PARAFUSO', acao: 'criado' }],
        parcelas: [
          { id: 1, identificacao: 'ÚNICA', dataVencimento: '2026-11-22', valorParcela: 100 },
        ],
      },
    });
    await extract();
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Conferi os dados com o PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lançar conta a pagar' }));
    await screen.findByRole('heading', { name: 'Nota lançada com sucesso' });
    expect(screen.getByRole('link', { name: 'Ver conta a pagar' })).toHaveAttribute(
      'href',
      '/atividades/contas-a-pagar'
    );
    expect(lancarNotaFiscal).toHaveBeenCalledTimes(1);
  });
});
