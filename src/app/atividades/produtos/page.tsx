'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Save, ArrowLeft } from 'lucide-react';
import { ClayButton } from '@/components/ui/ClayButton';
import { ClayInput } from '@/components/ui/ClayInput';
import { ClayModal } from '@/components/ui/ClayModal';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import {
  RegistrosCrud,
  StatusTag,
  useRegistroBusca,
  type RegistroColumn,
} from '@/components/administrativo/RegistrosCrud';
import { buscarProdutos, salvarProduto, alterarStatusProduto } from '@/actions/administrativo';
import { useModuleGuard } from '@/lib/useModuleGuard';
import { useToast } from '@/context/ToastContext';
import type { CadastroStatus, ProdutoRow } from '@/lib/administrativo';
import styles from '@/components/administrativo/administrativo.module.css';

const columns: RegistroColumn<ProdutoRow>[] = [
  { key: 'id', header: 'ID', sortValue: (p) => p.id, render: (p) => p.id },
  {
    key: 'descricao',
    header: 'Produto / Serviço',
    sortValue: (p) => p.descricao,
    render: (p) => <strong>{p.descricao}</strong>,
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (p) => p.status,
    render: (p) => <StatusTag status={p.status} />,
  },
];

export default function ProdutosPage() {
  const allowed = useModuleGuard('processador-nf');
  const { addToast } = useToast();
  const { rows, loading, loaded, search, refresh } = useRegistroBusca(buscarProdutos);
  const [form, setForm] = useState<{ id?: number; descricao: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!allowed) return <AppShellSkeleton />;
  const changeStatus = async (row: ProdutoRow, status: CadastroStatus) => {
    try {
      const result = await alterarStatusProduto(row.id, status);
      if (result.success) await refresh();
      else addToast({ type: 'error', title: 'Produtos', message: result.error });
    } catch {
      addToast({
        type: 'error',
        title: 'Produtos',
        message: 'Não foi possível alterar o status. Tente novamente.',
      });
    }
  };
  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      <header className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Catálogo de produtos</h1>
          <p className="page-subtitle">
            Produtos e serviços cadastrados nas notas fiscais. O cadastro não altera saldos de
            estoque.
          </p>
        </div>
        <Link href="/atividades/processador-nf" className="btn btn--outline btn--sm">
          <ArrowLeft size={15} aria-hidden="true" /> Ler nota fiscal
        </Link>
      </header>
      <RegistrosCrud
        titulo="Produtos"
        insertLabel="Novo produto"
        searchPlaceholder="Buscar por nome do produto ou serviço"
        columns={columns}
        rows={rows}
        loading={loading}
        loaded={loaded}
        onSearch={search}
        onInsert={() => {
          setError(null);
          setForm({ descricao: '' });
        }}
        onEdit={(row) => {
          setError(null);
          setForm({ id: row.id, descricao: row.descricao });
        }}
        onChangeStatus={changeStatus}
        describeRow={(p) => `${p.descricao} (ID ${p.id})`}
      />
      <ClayModal
        isOpen={form !== null}
        onClose={() => {
          if (!saving) setForm(null);
        }}
        title={form?.id ? 'Editar produto' : 'Novo produto'}
      >
        {form && (
          <form
            className={styles.formStack}
            onSubmit={async (e) => {
              e.preventDefault();
              if (saving) return;
              setSaving(true);
              setError(null);
              try {
                const result = await salvarProduto(form);
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                addToast({ type: 'success', title: 'Produtos', message: 'Produto salvo.' });
                setForm(null);
                await refresh();
              } catch {
                setError('Sem conexão com o servidor. Tente novamente.');
              } finally {
                setSaving(false);
              }
            }}
          >
            {error && (
              <div className={styles.formError} role="alert">
                {error}
              </div>
            )}
            <ClayInput
              label="Nome do produto ou serviço"
              maxLength={500}
              value={form.descricao}
              required
              autoFocus
              disabled={saving}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
            <ClayButton type="submit" loading={saving}>
              <Save size={16} aria-hidden="true" /> Salvar produto
            </ClayButton>
          </form>
        )}
      </ClayModal>
    </div>
  );
}
