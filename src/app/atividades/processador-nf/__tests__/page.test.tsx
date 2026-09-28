import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProcessadorNfPage from '../page';

vi.mock('@/lib/useModuleGuard', () => ({ useModuleGuard: () => true }));
vi.mock('@/context/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }));

describe('invoice reader review state', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('shows review issues alongside extracted values and includes them in JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              fornecedor: { razaoSocial: 'Fornecedor', cnpj: '11.222.333/0001-81' },
              faturado: { nomeCompleto: 'Cliente', cpf: '529.982.247-25' },
              numeroNotaFiscal: '123',
              dataEmissao: '2026-09-28',
              descricaoProdutos: ['Sementes'],
              quantidadeParcelas: null,
              parcelas: [],
              dataVencimento: null,
              valorTotal: 100,
              tipoDespesa: 'INSUMOS AGRÍCOLAS',
              classificacaoDespesa: ['INSUMOS AGRÍCOLAS'],
            },
            review: {
              required: true,
              issues: [{ field: 'parcelas', message: 'Parcelas não identificadas.' }],
              ocrMinimumPageConfidence: 0.9,
            },
          }),
          { status: 200 }
        )
      )
    );

    const { container } = render(<ProcessadorNfPage />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['%PDF-1.4'], 'nf.pdf', { type: 'application/pdf' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: /Extrair dados da nota/i }));

    await waitFor(() =>
      expect(screen.getByText('Revisão necessária antes de usar estes dados')).toBeInTheDocument()
    );
    expect(screen.getByText('Parcelas não identificadas.')).toBeInTheDocument();
    expect(screen.getAllByText('Fornecedor').length).toBeGreaterThan(0);
    expect(screen.getByText(/"required": true/)).toBeInTheDocument();
  });
});
