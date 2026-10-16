'use client';

import React, { useCallback, useState } from 'react';
import { Save, X } from 'lucide-react';
import { ClayButton } from '@/components/ui/ClayButton';
import { ClayInput } from '@/components/ui/ClayInput';
import { ClayModal } from '@/components/ui/ClayModal';
import { ClaySelect } from '@/components/ui/ClaySelect';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import {
  RegistrosCrud,
  StatusTag,
  useRegistroBusca,
  type BuscaOpcoes,
  type RegistroColumn,
} from '@/components/administrativo/RegistrosCrud';
import styles from '@/components/administrativo/administrativo.module.css';
import { alterarStatusPessoa, buscarPessoas, salvarPessoa } from '@/actions/administrativo';
import { useToast } from '@/context/ToastContext';
import { useModuleGuard } from '@/lib/useModuleGuard';
import {
  PESSOA_TIPOS,
  PESSOA_TIPO_LABELS,
  documentoLabel,
  formatDocumento,
  maskDocumento,
  type CadastroStatus,
  type PessoaRow,
  type PessoaTipo,
} from '@/lib/administrativo';

interface FormState {
  id?: number;
  tipo: PessoaTipo;
  razaoSocial: string;
  fantasia: string;
  documento: string;
}

const EMPTY_FORM: FormState = { tipo: 'FORNECEDOR', razaoSocial: '', fantasia: '', documento: '' };

const columns: RegistroColumn<PessoaRow>[] = [
  { key: 'id', header: 'ID', sortValue: (p) => p.id, render: (p) => p.id },
  {
    key: 'tipo',
    header: 'Tipo',
    sortValue: (p) => p.tipo,
    render: (p) => <span className="badge badge--info">{p.tipo}</span>,
  },
  {
    key: 'razaoSocial',
    header: 'Razão social / Nome',
    sortValue: (p) => p.razaoSocial,
    render: (p) => <strong>{p.razaoSocial}</strong>,
  },
  {
    key: 'fantasia',
    header: 'Fantasia',
    sortValue: (p) => p.fantasia,
    render: (p) => p.fantasia || <span className={styles.muted}>—</span>,
  },
  {
    key: 'documento',
    header: 'CPF/CNPJ',
    sortValue: (p) => p.documento,
    render: (p) =>
      p.documento ? (
        <span className={styles.mono}>{formatDocumento(p.documento)}</span>
      ) : (
        <span className={styles.muted}>—</span>
      ),
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (p) => p.status,
    render: (p) => <StatusTag status={p.status} />,
  },
];

export default function PessoasPage() {
  const moduleAllowed = useModuleGuard('processador-nf');
  const { addToast } = useToast();
  const [tipoFiltro, setTipoFiltro] = useState<PessoaTipo | ''>('');
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetcher = useCallback(
    (opcoes: BuscaOpcoes) => buscarPessoas({ ...opcoes, tipo: tipoFiltro || null }),
    [tipoFiltro]
  );
  const { rows, loading, loaded, search, refresh } = useRegistroBusca(fetcher);

  if (!moduleAllowed) return <AppShellSkeleton />;

  const openForm = (row?: PessoaRow) => {
    setFormError(null);
    setForm(
      row
        ? {
            id: row.id,
            tipo: row.tipo,
            razaoSocial: row.razaoSocial,
            fantasia: row.fantasia ?? '',
            documento: row.documento ? formatDocumento(row.documento) : '',
          }
        : { ...EMPTY_FORM, tipo: tipoFiltro || 'FORNECEDOR' }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError(null);
    try {
      const result = await salvarPessoa(form);
      if (!result.success) {
        setFormError(result.error);
        return;
      }
      addToast({ type: 'success', title: 'Pessoas', message: result.message ?? 'Salvo.' });
      setForm(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (row: PessoaRow, status: CadastroStatus) => {
    const result = await alterarStatusPessoa(row.id, status);
    addToast(
      result.success
        ? { type: 'success', title: 'Pessoas', message: result.message ?? 'Status alterado.' }
        : { type: 'error', title: 'Pessoas', message: result.error }
    );
    if (result.success) await refresh();
  };

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-title-group">
          <h1 className="page-title">Pessoas</h1>
          <p className="page-subtitle">
            Manter Fornecedor, Cliente e Faturado. Cadastros não são excluídos: ficam inativos e
            podem ser reativados.
          </p>
        </div>
      </div>

      <RegistrosCrud
        titulo="Pessoas"
        insertLabel="Inserir Nova Pessoa"
        searchPlaceholder="Buscar por nome, fantasia, CPF/CNPJ ou tipo…"
        filters={
          <div className={styles.filter}>
            <ClaySelect
              aria-label="Filtrar por tipo"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as PessoaTipo | '')}
              options={[
                { value: '', label: 'Todos os tipos' },
                ...PESSOA_TIPOS.map((t) => ({ value: t, label: PESSOA_TIPO_LABELS[t] })),
              ]}
            />
          </div>
        }
        columns={columns}
        rows={rows}
        loading={loading}
        loaded={loaded}
        onSearch={search}
        onInsert={() => openForm()}
        onEdit={openForm}
        onChangeStatus={handleStatus}
        describeRow={(p) => `${p.tipo} ${p.razaoSocial} (ID ${p.id})`}
      />

      <ClayModal
        isOpen={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? `Editar Pessoa — ID ${form.id}` : 'Nova Pessoa'}
        subtitle="Formulário de Pessoa"
      >
        {form && (
          <form onSubmit={handleSave} className={styles.formStack}>
            {formError && (
              <div className={styles.formError} role="alert">
                {formError}
              </div>
            )}
            <div className="form-grid-2">
              <ClaySelect
                label="Tipo"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as PessoaTipo })}
                options={PESSOA_TIPOS.map((t) => ({ value: t, label: PESSOA_TIPO_LABELS[t] }))}
              />
              <ClayInput
                label={documentoLabel(form.documento)}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                inputMode="numeric"
                value={form.documento}
                maxLength={18}
                onChange={(e) => setForm({ ...form, documento: maskDocumento(e.target.value) })}
              />
            </div>
            <ClayInput
              label="Razão social / Nome completo"
              value={form.razaoSocial}
              onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })}
              required
              autoFocus
            />
            <ClayInput
              label="Nome fantasia"
              value={form.fantasia}
              onChange={(e) => setForm({ ...form, fantasia: e.target.value })}
            />
            <div className="flex-row gap-2">
              <ClayButton type="submit" variant="primary" loading={saving}>
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
