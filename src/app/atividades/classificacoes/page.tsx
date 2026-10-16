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
import {
  alterarStatusClassificacao,
  buscarClassificacoes,
  salvarClassificacao,
} from '@/actions/administrativo';
import { useToast } from '@/context/ToastContext';
import { useModuleGuard } from '@/lib/useModuleGuard';
import type { CadastroStatus, ClassificacaoRow, ClassificacaoTipo } from '@/lib/administrativo';

interface FormState {
  id?: number;
  tipo: ClassificacaoTipo;
  descricao: string;
}

const TIPO_OPTIONS = [
  { value: 'DESPESA', label: 'Tipo de Despesa' },
  { value: 'RECEITA', label: 'Tipo de Receita' },
];

const columns: RegistroColumn<ClassificacaoRow>[] = [
  { key: 'id', header: 'ID', sortValue: (c) => c.id, render: (c) => c.id },
  {
    key: 'tipo',
    header: 'Tipo',
    sortValue: (c) => c.tipo,
    render: (c) => (
      <span className={`badge ${c.tipo === 'DESPESA' ? 'badge--warning' : 'badge--success'}`}>
        {c.tipo}
      </span>
    ),
  },
  {
    key: 'descricao',
    header: 'Descrição',
    sortValue: (c) => c.descricao,
    render: (c) => <strong>{c.descricao}</strong>,
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (c) => c.status,
    render: (c) => <StatusTag status={c.status} />,
  },
];

export default function ClassificacoesPage() {
  const moduleAllowed = useModuleGuard('processador-nf');
  const { addToast } = useToast();
  const [tipoFiltro, setTipoFiltro] = useState<ClassificacaoTipo | ''>('');
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetcher = useCallback(
    (opcoes: BuscaOpcoes) => buscarClassificacoes({ ...opcoes, tipo: tipoFiltro || null }),
    [tipoFiltro]
  );
  const { rows, loading, loaded, search, refresh } = useRegistroBusca(fetcher);

  if (!moduleAllowed) return <AppShellSkeleton />;

  const openForm = (row?: ClassificacaoRow) => {
    setFormError(null);
    setForm(
      row
        ? { id: row.id, tipo: row.tipo, descricao: row.descricao }
        : { tipo: tipoFiltro || 'DESPESA', descricao: '' }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError(null);
    try {
      const result = await salvarClassificacao(form);
      if (!result.success) {
        setFormError(result.error);
        return;
      }
      addToast({ type: 'success', title: 'Classificação', message: result.message ?? 'Salvo.' });
      setForm(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (row: ClassificacaoRow, status: CadastroStatus) => {
    const result = await alterarStatusClassificacao(row.id, status);
    addToast(
      result.success
        ? { type: 'success', title: 'Classificação', message: result.message ?? 'Status alterado.' }
        : { type: 'error', title: 'Classificação', message: result.error }
    );
    if (result.success) await refresh();
  };

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-title-group">
          <h1 className="page-title">Classificações</h1>
          <p className="page-subtitle">
            Manter Tipo de Despesa e Tipo de Receita usados para classificar as contas.
          </p>
        </div>
      </div>

      <RegistrosCrud
        titulo="Classificações"
        insertLabel="Inserir Nova Classificação"
        searchPlaceholder="Buscar por descrição ou tipo…"
        filters={
          <div className={styles.filter}>
            <ClaySelect
              aria-label="Filtrar por tipo"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value as ClassificacaoTipo | '')}
              options={[{ value: '', label: 'Despesas e receitas' }, ...TIPO_OPTIONS]}
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
        describeRow={(c) => `${c.tipo} ${c.descricao} (ID ${c.id})`}
      />

      <ClayModal
        isOpen={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? `Editar Classificação — ID ${form.id}` : 'Nova Classificação'}
        subtitle="Formulário de Classificação"
      >
        {form && (
          <form onSubmit={handleSave} className={styles.formStack}>
            {formError && (
              <div className={styles.formError} role="alert">
                {formError}
              </div>
            )}
            <ClaySelect
              label="Tipo"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as ClassificacaoTipo })}
              options={TIPO_OPTIONS}
            />
            <ClayInput
              label="Descrição"
              placeholder="Ex.: MANUTENÇÃO E OPERAÇÃO"
              hint="Gravada em letras maiúsculas."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              required
              autoFocus
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
