'use client';

import type { ExtractedInvoiceData } from '@/lib/mistralInvoiceAgent';
import { ClayInput } from '@/components/ui/ClayInput';
import { ClayButton } from '@/components/ui/ClayButton';
import { Plus, Trash2 } from 'lucide-react';
import styles from '@/app/atividades/processador-nf/processador-nf.module.css';

export function NotaReviewForm({
  data,
  onChange,
  disabled,
}: {
  data: ExtractedInvoiceData;
  onChange: (data: ExtractedInvoiceData) => void;
  disabled: boolean;
}) {
  const update = (patch: Partial<ExtractedInvoiceData>) => onChange({ ...data, ...patch });
  const updateParcelas = (parcelas: ExtractedInvoiceData['parcelas']) =>
    update({
      parcelas: parcelas.map((p, i) => ({ ...p, numero: i + 1 })),
      quantidadeParcelas: parcelas.length,
      dataVencimento: parcelas[0]?.dataVencimento ?? null,
    });
  return (
    <fieldset className={styles.reviewForm} disabled={disabled}>
      <legend className={styles.visuallyHidden}>Conferência dos dados da nota</legend>
      <h3 className={styles.sectionTitle}>Empresa emitente</h3>
      <div className={styles.formGrid}>
        <ClayInput
          label="Razão social do fornecedor"
          maxLength={255}
          value={data.fornecedor.razaoSocial}
          onChange={(e) =>
            update({ fornecedor: { ...data.fornecedor, razaoSocial: e.target.value } })
          }
        />
        <ClayInput
          label="CPF/CNPJ do fornecedor"
          maxLength={30}
          inputMode="numeric"
          value={data.fornecedor.cnpj}
          onChange={(e) => update({ fornecedor: { ...data.fornecedor, cnpj: e.target.value } })}
        />
        <ClayInput
          label="Nome fantasia"
          maxLength={255}
          value={data.fornecedor.nomeFantasia ?? ''}
          onChange={(e) =>
            update({ fornecedor: { ...data.fornecedor, nomeFantasia: e.target.value } })
          }
        />
      </div>
      <h3 className={styles.sectionTitle}>Destinatário e documento</h3>
      <div className={styles.formGrid}>
        <ClayInput
          label="Nome do destinatário"
          maxLength={255}
          value={data.faturado.nomeCompleto}
          onChange={(e) => update({ faturado: { ...data.faturado, nomeCompleto: e.target.value } })}
        />
        <ClayInput
          label="CPF/CNPJ do destinatário"
          maxLength={30}
          inputMode="numeric"
          value={data.faturado.cpf}
          onChange={(e) => update({ faturado: { ...data.faturado, cpf: e.target.value } })}
        />
        <ClayInput
          label="Número da nota fiscal"
          maxLength={50}
          value={data.numeroNotaFiscal}
          onChange={(e) => update({ numeroNotaFiscal: e.target.value })}
        />
        <ClayInput
          label="Data de emissão"
          type="date"
          value={data.dataEmissao ?? ''}
          onChange={(e) => update({ dataEmissao: e.target.value || null })}
        />
      </div>
      <div className={styles.sectionHeading}>
        <h3 className={styles.sectionTitle}>Produtos e serviços</h3>
        <ClayButton
          type="button"
          variant="ghost"
          size="sm"
          disabled={data.descricaoProdutos.length >= 200}
          onClick={() => update({ descricaoProdutos: [...data.descricaoProdutos, ''] })}
        >
          <Plus size={14} aria-hidden="true" /> Adicionar produto
        </ClayButton>
      </div>
      {data.descricaoProdutos.length === 0 && (
        <p className={styles.muted}>
          Nenhum produto identificado. Adicione os itens que constam na nota.
        </p>
      )}
      {data.descricaoProdutos.map((descricao, i) => (
        <div className={styles.editRow} key={i}>
          <ClayInput
            id={`produto-${i}`}
            label={`Produto ${i + 1}`}
            maxLength={500}
            value={descricao}
            onChange={(e) =>
              update({
                descricaoProdutos: data.descricaoProdutos.map((p, j) =>
                  j === i ? e.target.value : p
                ),
              })
            }
          />
          <ClayButton
            type="button"
            variant="ghost"
            iconOnly
            aria-label={`Remover produto ${i + 1}`}
            onClick={() =>
              update({ descricaoProdutos: data.descricaoProdutos.filter((_, j) => i !== j) })
            }
          >
            <Trash2 size={16} aria-hidden="true" />
          </ClayButton>
        </div>
      ))}
      <h3 className={styles.sectionTitle}>Pagamento</h3>
      <div className={styles.formGrid}>
        <ClayInput
          label="Valor total da nota (R$)"
          type="number"
          min="0.01"
          max="1000000000000"
          step="0.01"
          value={data.valorTotal ?? ''}
          onChange={(e) =>
            update({ valorTotal: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
        <ClayInput
          label="Classificações de despesa"
          hint="Separe com ponto e vírgula quando houver mais de uma."
          value={data.classificacaoDespesa.join(';')}
          onChange={(e) =>
            update({
              classificacaoDespesa: e.target.value.split(';'),
              tipoDespesa: e.target.value.split(';')[0] ?? '',
            })
          }
        />
      </div>
      <div className={styles.sectionHeading}>
        <h3 className={styles.sectionTitle}>Parcelas ({data.parcelas.length})</h3>
        <ClayButton
          type="button"
          variant="ghost"
          size="sm"
          disabled={data.parcelas.length >= 120}
          onClick={() =>
            updateParcelas([
              ...data.parcelas,
              { numero: data.parcelas.length + 1, dataVencimento: null, valor: null },
            ])
          }
        >
          <Plus size={14} aria-hidden="true" /> Adicionar parcela
        </ClayButton>
      </div>
      {data.parcelas.length === 0 && (
        <p className={styles.muted}>Informe o vencimento e o valor para lançar a conta a pagar.</p>
      )}
      {data.parcelas.map((p, i) => (
        <div className={styles.parcelaRow} key={i}>
          <ClayInput
            id={`vencimento-${i}`}
            label={`Vencimento da parcela ${i + 1}`}
            type="date"
            value={p.dataVencimento ?? ''}
            onChange={(e) =>
              updateParcelas(
                data.parcelas.map((p, j) =>
                  j === i ? { ...p, dataVencimento: e.target.value || null } : p
                )
              )
            }
          />
          <ClayInput
            id={`valor-${i}`}
            label={`Valor da parcela ${i + 1} (R$)`}
            type="number"
            min="0.01"
            max="1000000000000"
            step="0.01"
            value={p.valor ?? ''}
            onChange={(e) =>
              updateParcelas(
                data.parcelas.map((p, j) =>
                  j === i
                    ? { ...p, valor: e.target.value === '' ? null : Number(e.target.value) }
                    : p
                )
              )
            }
          />
          <ClayButton
            type="button"
            variant="ghost"
            iconOnly
            aria-label={`Remover parcela ${i + 1}`}
            onClick={() => updateParcelas(data.parcelas.filter((_, j) => j !== i))}
          >
            <Trash2 size={16} aria-hidden="true" />
          </ClayButton>
        </div>
      ))}
    </fieldset>
  );
}
