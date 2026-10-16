'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { Check, Plus, Save, Trash2, Wand2, X } from 'lucide-react';
import { ClayButton } from '@/components/ui/ClayButton';
import { ClayInput } from '@/components/ui/ClayInput';
import { ClayModal } from '@/components/ui/ClayModal';
import { ClaySelect } from '@/components/ui/ClaySelect';
import { Spinner } from '@/components/ui/Spinner';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import {
  RegistrosCrud,
  StatusTag,
  useRegistroBusca,
  type BuscaOpcoes,
  type RegistroColumn,
} from './RegistrosCrud';
import styles from './administrativo.module.css';
import {
  alterarStatusMovimento,
  buscarMovimentos,
  listarOpcoesMovimento,
  salvarMovimento,
  type OpcoesMovimento,
} from '@/actions/administrativo';
import { useToast } from '@/context/ToastContext';
import { useModuleGuard } from '@/lib/useModuleGuard';
import {
  MOVIMENTO_REGRAS,
  MOVIMENTO_TIPO_LABELS,
  PESSOA_TIPO_LABELS,
  addMonthsIso,
  dividirEmParcelas,
  formatDocumento,
  identificacaoParcela,
  roundMoney,
  type CadastroStatus,
  type MovimentoRow,
  type MovimentoTipo,
} from '@/lib/administrativo';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatDate(value: string | null): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
}

interface ParcelaForm {
  dataVencimento: string;
  valor: string;
}

interface FormState {
  id?: number;
  pessoaId: string;
  faturadoId: string;
  numeroNotaFiscal: string;
  dataEmissao: string;
  descricao: string;
  classificacaoIds: number[];
  parcelas: ParcelaForm[];
}

const EMPTY_FORM: FormState = {
  pessoaId: '',
  faturadoId: '',
  numeroNotaFiscal: '',
  dataEmissao: '',
  descricao: '',
  classificacaoIds: [],
  parcelas: [{ dataVencimento: '', valor: '' }],
};

interface GeradorState {
  total: string;
  quantidade: string;
  primeiroVencimento: string;
}

const EMPTY_GERADOR: GeradorState = { total: '', quantidade: '1', primeiroVencimento: '' };

function parseValor(value: string): number {
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  return Number(normalized);
}

/** Inclui nas opções os cadastros já vinculados ao lançamento, mesmo inativos */
function withCurrent<T extends { id: number }>(options: T[], current: T | null | undefined): T[] {
  return current && !options.some((o) => o.id === current.id) ? [current, ...options] : options;
}

export function MovimentosPage({ tipo }: { tipo: MovimentoTipo }) {
  const moduleAllowed = useModuleGuard('processador-nf');
  const { addToast } = useToast();
  const regra = MOVIMENTO_REGRAS[tipo];
  const pessoaLabel = PESSOA_TIPO_LABELS[regra.pessoaTipo];
  const titulo = MOVIMENTO_TIPO_LABELS[tipo];

  const [form, setForm] = useState<FormState | null>(null);
  const [editing, setEditing] = useState<MovimentoRow | null>(null);
  const [opcoes, setOpcoes] = useState<OpcoesMovimento | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [gerador, setGerador] = useState<GeradorState>(EMPTY_GERADOR);

  const fetcher = useCallback((busca: BuscaOpcoes) => buscarMovimentos({ ...busca, tipo }), [tipo]);
  const { rows, loading, loaded, search, refresh } = useRegistroBusca(fetcher);

  if (!moduleAllowed) return <AppShellSkeleton />;

  const columns: RegistroColumn<MovimentoRow>[] = [
    { key: 'id', header: 'ID', sortValue: (m) => m.id, render: (m) => m.id },
    {
      key: 'nf',
      header: 'Nº NF',
      sortValue: (m) => m.numeroNotaFiscal,
      render: (m) => (
        <>
          <span className={styles.breakAll}>{m.numeroNotaFiscal || '—'}</span>
          {m.dataEmissao && <div className={styles.muted}>{formatDate(m.dataEmissao)}</div>}
        </>
      ),
    },
    {
      key: 'pessoa',
      header: pessoaLabel,
      sortValue: (m) => m.pessoa.razaoSocial,
      render: (m) => (
        <>
          <strong>{m.pessoa.razaoSocial}</strong>
          {m.pessoa.documento && (
            <div className={`${styles.muted} ${styles.mono}`}>
              {formatDocumento(m.pessoa.documento)}
            </div>
          )}
          {m.faturado && <div className={styles.muted}>Faturado: {m.faturado.razaoSocial}</div>}
        </>
      ),
    },
    {
      key: 'classificacoes',
      header: 'Classificação',
      sortValue: (m) => m.classificacoes.map((c) => c.descricao).join(', '),
      render: (m) => (
        <div className={styles.tagList}>
          {m.classificacoes.map((c) => (
            <span key={c.id} className="badge badge--accent">
              {c.descricao}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'parcelas',
      header: 'Parcelas',
      sortValue: (m) => m.parcelas[0]?.dataVencimento ?? null,
      render: (m) => (
        <div className={styles.parcelasCell}>
          {m.parcelas.map((p) => (
            <React.Fragment key={p.id}>
              <strong>{p.identificacao}</strong>
              <span>{formatDate(p.dataVencimento)}</span>
              <span className={styles.parcelaValor}>{currency.format(p.valorParcela)}</span>
            </React.Fragment>
          ))}
        </div>
      ),
    },
    {
      key: 'valor',
      header: 'Total',
      align: 'right',
      sortValue: (m) => m.valorTotal,
      render: (m) => <strong className={styles.mono}>{currency.format(m.valorTotal)}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (m) => m.status,
      render: (m) => <StatusTag status={m.status} />,
    },
  ];

  const openForm = async (row?: MovimentoRow) => {
    setFormError(null);
    setGerador(EMPTY_GERADOR);
    setEditing(row ?? null);
    setForm(
      row
        ? {
            id: row.id,
            pessoaId: String(row.pessoa.id),
            faturadoId: row.faturado ? String(row.faturado.id) : '',
            numeroNotaFiscal: row.numeroNotaFiscal ?? '',
            dataEmissao: row.dataEmissao ?? '',
            descricao: row.descricao ?? '',
            classificacaoIds: row.classificacoes.map((c) => c.id),
            parcelas: row.parcelas.map((p) => ({
              dataVencimento: p.dataVencimento,
              valor: p.valorParcela.toFixed(2),
            })),
          }
        : EMPTY_FORM
    );
    setOpcoes(null);
    const result = await listarOpcoesMovimento(tipo);
    if (result.success) setOpcoes(result.data);
    else setFormError(result.error);
  };

  const updateParcela = (index: number, patch: Partial<ParcelaForm>) =>
    form &&
    setForm({
      ...form,
      parcelas: form.parcelas.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    });

  const addParcela = () => {
    if (!form) return;
    const ultima = form.parcelas[form.parcelas.length - 1];
    setForm({
      ...form,
      parcelas: [
        ...form.parcelas,
        // Sugere o vencimento um mês após a última parcela
        { dataVencimento: ultima ? addMonthsIso(ultima.dataVencimento, 1) : '', valor: '' },
      ],
    });
  };

  const parcelasGeradas = dividirEmParcelas(
    parseValor(gerador.total),
    Number(gerador.quantidade),
    gerador.primeiroVencimento
  );

  const aplicarGerador = () => {
    if (!form || parcelasGeradas.length === 0) return;
    setForm({
      ...form,
      parcelas: parcelasGeradas.map((p) => ({
        dataVencimento: p.dataVencimento,
        valor: p.valor.toFixed(2).replace('.', ','),
      })),
    });
  };

  const toggleClassificacao = (id: number) =>
    form &&
    setForm({
      ...form,
      classificacaoIds: form.classificacaoIds.includes(id)
        ? form.classificacaoIds.filter((c) => c !== id)
        : [...form.classificacaoIds, id],
    });

  const totalParcelas = roundMoney(
    (form?.parcelas ?? []).reduce((sum, p) => sum + (parseValor(p.valor) || 0), 0)
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError(null);
    try {
      const result = await salvarMovimento({
        id: form.id,
        tipo,
        pessoaId: Number(form.pessoaId),
        faturadoId: form.faturadoId ? Number(form.faturadoId) : null,
        numeroNotaFiscal: form.numeroNotaFiscal,
        dataEmissao: form.dataEmissao || null,
        descricao: form.descricao,
        classificacaoIds: form.classificacaoIds,
        parcelas: form.parcelas.map((p) => ({
          dataVencimento: p.dataVencimento,
          valor: parseValor(p.valor),
        })),
      });
      if (!result.success) {
        setFormError(result.error);
        return;
      }
      addToast({ type: 'success', title: titulo, message: result.message ?? 'Salvo.' });
      setForm(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (row: MovimentoRow, status: CadastroStatus) => {
    const result = await alterarStatusMovimento(row.id, status);
    addToast(
      result.success
        ? { type: 'success', title: titulo, message: result.message ?? 'Status alterado.' }
        : { type: 'error', title: titulo, message: result.error }
    );
    if (result.success) await refresh();
  };

  const pessoaOptions = opcoes
    ? withCurrent(
        opcoes.pessoas,
        editing && {
          ...editing.pessoa,
          tipo: regra.pessoaTipo,
          fantasia: null,
          status: 'INATIVO' as const,
        }
      )
    : [];
  const faturadoOptions = opcoes
    ? withCurrent(
        opcoes.faturados,
        editing?.faturado && {
          ...editing.faturado,
          tipo: 'FATURADO' as const,
          fantasia: null,
          status: 'INATIVO' as const,
        }
      )
    : [];
  const classificacaoOptions = opcoes
    ? [
        ...opcoes.classificacoes,
        ...(editing?.classificacoes ?? [])
          .filter((c) => !opcoes.classificacoes.some((o) => o.id === c.id))
          .map((c) => ({ ...c, tipo: regra.classificacaoTipo, status: 'INATIVO' as const })),
      ]
    : [];

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-title-group">
          <h1 className="page-title">Registrar {titulo}</h1>
          <p className="page-subtitle">
            Cada lançamento (movimento) tem um {pessoaLabel.toLowerCase()}, uma ou mais
            classificações de {regra.classificacaoTipo.toLowerCase()} e uma ou mais parcelas com
            vencimentos distintos.
          </p>
        </div>
      </div>

      <RegistrosCrud
        titulo={`${titulo}`}
        insertLabel="Inserir Novo Lançamento"
        searchPlaceholder={`Buscar por nº da NF, ${pessoaLabel.toLowerCase()}, faturado, CPF/CNPJ ou classificação…`}
        columns={columns}
        rows={rows}
        loading={loading}
        loaded={loaded}
        onSearch={search}
        onInsert={() => openForm()}
        onEdit={openForm}
        onChangeStatus={handleStatus}
        describeRow={(m) =>
          `lançamento ID ${m.id}${m.numeroNotaFiscal ? ` (NF ${m.numeroNotaFiscal})` : ''}`
        }
      />

      <ClayModal
        isOpen={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? `Editar Lançamento — ID ${form.id}` : `Novo Lançamento — ${titulo}`}
        subtitle="Movimento, classificações e parcelas"
        maxWidth="760px"
      >
        {form && !opcoes && !formError && (
          <div className="flex-row items-center gap-2">
            <Spinner size={16} /> Carregando cadastros…
          </div>
        )}
        {form && (opcoes || formError) && (
          <form onSubmit={handleSave} className={styles.formStack}>
            {formError && (
              <div className={styles.formError} role="alert">
                {formError}
              </div>
            )}
            {opcoes && opcoes.pessoas.length === 0 && (
              <div className={styles.formNotice}>
                Nenhum {pessoaLabel.toLowerCase()} ativo cadastrado.{' '}
                <Link href="/atividades/pessoas">Cadastrar em Pessoas</Link>
              </div>
            )}
            <div className="form-grid-2">
              <ClaySelect
                label={pessoaLabel}
                value={form.pessoaId}
                onChange={(e) => setForm({ ...form, pessoaId: e.target.value })}
                required
                options={[
                  { value: '', label: `Selecione o ${pessoaLabel.toLowerCase()}` },
                  ...pessoaOptions.map((p) => ({
                    value: String(p.id),
                    label: `${p.razaoSocial}${p.documento ? ` — ${formatDocumento(p.documento)}` : ''}`,
                  })),
                ]}
              />
              <ClaySelect
                label="Faturado"
                value={form.faturadoId}
                onChange={(e) => setForm({ ...form, faturadoId: e.target.value })}
                options={[
                  { value: '', label: 'Sem faturado' },
                  ...faturadoOptions.map((p) => ({
                    value: String(p.id),
                    label: `${p.razaoSocial}${p.documento ? ` — ${formatDocumento(p.documento)}` : ''}`,
                  })),
                ]}
              />
              <ClayInput
                label="Nº da nota fiscal"
                value={form.numeroNotaFiscal}
                onChange={(e) => setForm({ ...form, numeroNotaFiscal: e.target.value })}
              />
              <ClayInput
                label="Data de emissão"
                type="date"
                value={form.dataEmissao}
                onChange={(e) => setForm({ ...form, dataEmissao: e.target.value })}
              />
            </div>
            <ClayInput
              label="Descrição"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />

            <fieldset className={styles.fieldset}>
              <legend>
                Classificação (
                {regra.classificacaoTipo === 'DESPESA' ? 'tipos de despesa' : 'tipos de receita'}) —
                uma ou mais
              </legend>
              {classificacaoOptions.length === 0 ? (
                <p className={styles.muted}>
                  Nenhuma classificação ativa.{' '}
                  <Link href="/atividades/classificacoes">Cadastrar em Classificações</Link>
                </p>
              ) : (
                <div className={styles.chipGrid}>
                  {classificacaoOptions.map((c) => {
                    const selected = form.classificacaoIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
                        aria-pressed={selected}
                        onClick={() => toggleClassificacao(c.id)}
                      >
                        {selected ? (
                          <Check size={14} aria-hidden="true" />
                        ) : (
                          <Plus size={14} aria-hidden="true" />
                        )}
                        {c.descricao}
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend>Parcelas — uma ou mais, com vencimentos distintos</legend>
              <details className={styles.gerador}>
                <summary>
                  <Wand2 size={14} aria-hidden="true" />
                  Gerar parcelas mensais a partir do valor total
                </summary>
                <div className={styles.geradorRow}>
                  <ClayInput
                    id="gerador-total"
                    label="Valor total (R$)"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={gerador.total}
                    onChange={(e) => setGerador({ ...gerador, total: e.target.value })}
                  />
                  <ClayInput
                    id="gerador-quantidade"
                    label="Nº de parcelas"
                    type="number"
                    min={1}
                    max={120}
                    value={gerador.quantidade}
                    onChange={(e) => setGerador({ ...gerador, quantidade: e.target.value })}
                  />
                  <ClayInput
                    id="gerador-primeiro-vencimento"
                    label="1º vencimento"
                    type="date"
                    value={gerador.primeiroVencimento}
                    onChange={(e) => setGerador({ ...gerador, primeiroVencimento: e.target.value })}
                  />
                  <ClayButton
                    type="button"
                    variant="secondary"
                    disabled={parcelasGeradas.length === 0}
                    onClick={aplicarGerador}
                  >
                    Gerar
                  </ClayButton>
                </div>
                <p className={styles.muted}>
                  Divide o valor igualmente (centavos restantes na última) com vencimentos mensais.
                  Substitui as parcelas abaixo.
                </p>
              </details>
              {form.parcelas.map((parcela, index) => (
                <div key={index} className={styles.parcelaRow}>
                  <span className={styles.parcelaId}>
                    {identificacaoParcela(index + 1, form.parcelas.length)}
                  </span>
                  <ClayInput
                    label={index === 0 ? 'Vencimento' : undefined}
                    aria-label={`Vencimento da parcela ${index + 1}`}
                    type="date"
                    value={parcela.dataVencimento}
                    onChange={(e) => updateParcela(index, { dataVencimento: e.target.value })}
                    required
                  />
                  <ClayInput
                    label={index === 0 ? 'Valor (R$)' : undefined}
                    aria-label={`Valor da parcela ${index + 1}`}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={parcela.valor}
                    onChange={(e) => updateParcela(index, { valor: e.target.value })}
                    required
                  />
                  <ClayButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    disabled={form.parcelas.length === 1}
                    onClick={() =>
                      setForm({ ...form, parcelas: form.parcelas.filter((_, i) => i !== index) })
                    }
                    aria-label={`Remover parcela ${index + 1}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </ClayButton>
                </div>
              ))}
              <div className={styles.parcelaFooter}>
                <ClayButton type="button" variant="outline" size="sm" onClick={addParcela}>
                  <Plus size={14} aria-hidden="true" />
                  Adicionar parcela
                </ClayButton>
                <span>
                  Valor total: <strong>{currency.format(totalParcelas)}</strong>
                </span>
              </div>
            </fieldset>

            <div className="flex-row gap-2">
              <ClayButton type="submit" variant="primary" loading={saving} disabled={!opcoes}>
                {!saving && <Save size={16} aria-hidden="true" />}
                Salvar
              </ClayButton>
              <ClayButton type="button" variant="ghost" onClick={() => setForm(null)}>
                <X size={16} aria-hidden="true" />
                Cancelar
              </ClayButton>
            </div>
          </form>
        )}
      </ClayModal>
    </div>
  );
}
