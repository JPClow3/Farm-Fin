'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit2,
  Inbox,
  List,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Trash2,
  X,
} from 'lucide-react';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { ClayInput } from '@/components/ui/ClayInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/context/ToastContext';
import type { ActionResult } from '@/lib/action-result';
import type { CadastroStatus } from '@/lib/administrativo';
import styles from './administrativo.module.css';

export interface BuscaOpcoes {
  termo: string;
  todos: boolean;
  incluirInativos: boolean;
}

export interface RegistroColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Valor usado na ordenação ao clicar no cabeçalho */
  sortValue?: (row: T) => string | number | null;
  align?: 'left' | 'right' | 'center';
}

/**
 * Estado da listagem: a tabela começa vazia e só é carregada pela Busca ou
 * por "Todos"; `refresh` repete a última consulta depois de salvar/inativar.
 */
export function useRegistroBusca<T>(fetcher: (opcoes: BuscaOpcoes) => Promise<ActionResult<T[]>>) {
  const { addToast } = useToast();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const lastSearch = useRef<BuscaOpcoes | null>(null);

  const search = useCallback(
    async (opcoes: BuscaOpcoes) => {
      setLoading(true);
      try {
        const result = await fetcher(opcoes);
        if (result.success) {
          lastSearch.current = opcoes;
          setRows(result.data);
          setLoaded(true);
        } else {
          addToast({ type: 'warning', title: 'Busca', message: result.error });
        }
      } catch {
        addToast({ type: 'error', title: 'Erro', message: 'Falha de conexão com o servidor.' });
      } finally {
        setLoading(false);
      }
    },
    [fetcher, addToast]
  );

  const refresh = useCallback(async () => {
    if (lastSearch.current) await search(lastSearch.current);
  }, [search]);

  // Trocar um filtro (ex.: tipo) refaz a última consulta, sem exigir novo clique
  const previousFetcher = useRef(fetcher);
  useEffect(() => {
    if (previousFetcher.current === fetcher) return;
    previousFetcher.current = fetcher;
    if (lastSearch.current) void search(lastSearch.current);
  }, [fetcher, search]);

  return { rows, loading, loaded, search, refresh };
}

interface RegistrosCrudProps<T extends { id: number; status: CadastroStatus }> {
  /** Ex.: "Pessoas" — usado em "Buscar Pessoas" e "Lista de Pessoas" */
  titulo: string;
  insertLabel: string;
  searchPlaceholder: string;
  filters?: React.ReactNode;
  columns: RegistroColumn<T>[];
  rows: T[];
  loading: boolean;
  loaded: boolean;
  onSearch: (opcoes: BuscaOpcoes) => void;
  onInsert: () => void;
  onEdit: (row: T) => void;
  onChangeStatus: (row: T, status: CadastroStatus) => Promise<void>;
  describeRow: (row: T) => string;
}

type SortState = { key: string; direction: 'asc' | 'desc' } | null;

const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

export function RegistrosCrud<T extends { id: number; status: CadastroStatus }>({
  titulo,
  insertLabel,
  searchPlaceholder,
  filters,
  columns,
  rows,
  loading,
  loaded,
  onSearch,
  onInsert,
  onEdit,
  onChangeStatus,
  describeRow,
}: RegistrosCrudProps<T>) {
  const [termo, setTermo] = useState('');
  const [incluirInativos, setIncluirInativos] = useState(false);
  const [sort, setSort] = useState<SortState>(null);
  const [pendingInactivate, setPendingInactivate] = useState<T | null>(null);

  const sortedRows = useMemo(() => {
    const column = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !column?.sortValue) return rows;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = column.sortValue!(a);
      const vb = column.sortValue!(b);
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      return (
        (typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : collator.compare(String(va), String(vb))) * factor
      );
    });
  }, [rows, sort, columns]);

  const toggleSort = (key: string) =>
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ termo, todos: false, incluirInativos });
  };

  return (
    <>
      <ClayCard>
        <div className="card-header">
          <h2 className="card-title">Buscar {titulo}</h2>
        </div>
        <form onSubmit={submitSearch} role="search">
          <div className={styles.searchRow}>
            <div className={styles.searchInput}>
              <Search size={16} className={styles.searchIcon} aria-hidden="true" />
              <ClayInput
                type="search"
                aria-label={`Buscar ${titulo.toLowerCase()}`}
                placeholder={searchPlaceholder}
                value={termo}
                className={styles.searchField}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && termo) {
                    e.preventDefault();
                    setTermo('');
                  }
                }}
              />
              {termo && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => setTermo('')}
                  aria-label="Limpar busca"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
            {filters}
            <div className={styles.searchButtons}>
              <ClayButton type="submit" variant="primary" disabled={loading}>
                <Search size={16} aria-hidden="true" />
                Buscar
              </ClayButton>
              <ClayButton
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => onSearch({ termo: '', todos: true, incluirInativos: false })}
              >
                <List size={16} aria-hidden="true" />
                Todos
              </ClayButton>
            </div>
          </div>
          <div className={styles.searchOptions}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={incluirInativos}
                onChange={(e) => setIncluirInativos(e.target.checked)}
              />
              Incluir inativos na busca (para reativar)
            </label>
            <span>Separe termos por espaço para buscar por mais de um elemento.</span>
          </div>
        </form>
      </ClayCard>

      <ClayCard>
        <div className="card-header">
          <h2 className="card-title">Lista de {titulo}</h2>
          {loaded && (
            <span className="card-subtitle" aria-live="polite">
              {rows.length} registro{rows.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        {loading ? (
          <div className={styles.emptyState} role="status">
            <Spinner size={16} /> Carregando…
          </div>
        ) : sortedRows.length === 0 ? (
          <div className={styles.emptyState} role="status">
            {loaded ? (
              <SearchX size={28} aria-hidden="true" />
            ) : (
              <Inbox size={28} aria-hidden="true" />
            )}
            <strong>{loaded ? 'Nenhum registro encontrado.' : 'A lista começa vazia.'}</strong>
            <span>
              {loaded
                ? 'Tente outros termos, marque "Incluir inativos" ou cadastre um novo registro.'
                : 'Busque por um ou mais termos ou clique em "Todos" para carregar os registros ativos.'}
            </span>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <div className="clay-table-wrapper" style={{ overflowX: 'auto', boxShadow: 'none' }}>
              <table
                className={`clay-table ${styles.table}`}
                role="table"
                aria-label={`Lista de ${titulo}`}
              >
                <thead>
                  <tr>
                    {columns.map((col) => {
                      const active = sort?.key === col.key;
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          style={{ textAlign: col.align ?? 'left' }}
                          aria-sort={
                            active
                              ? sort!.direction === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : undefined
                          }
                        >
                          {col.sortValue ? (
                            <button
                              type="button"
                              className={styles.sortButton}
                              onClick={() => toggleSort(col.key)}
                            >
                              {col.header}
                              {active ? (
                                sort!.direction === 'asc' ? (
                                  <ArrowUp size={12} aria-hidden="true" />
                                ) : (
                                  <ArrowDown size={12} aria-hidden="true" />
                                )
                              ) : (
                                <ArrowUpDown size={12} aria-hidden="true" />
                              )}
                            </button>
                          ) : (
                            col.header
                          )}
                        </th>
                      );
                    })}
                    <th scope="col" className={styles.actionsCell} style={{ textAlign: 'right' }}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <tr
                      role="row"
                      key={row.id}
                      className={row.status === 'INATIVO' ? styles.inactiveRow : undefined}
                    >
                      {columns.map((col) => (
                        <td key={col.key} role="cell" style={{ textAlign: col.align ?? 'left' }}>
                          <span className={styles.mobileCellLabel} aria-hidden="true">
                            {col.header}
                          </span>
                          {col.render(row)}
                        </td>
                      ))}
                      <td className={styles.actionsCell} role="cell">
                        <div className={styles.rowActions}>
                          <ClayButton
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(row)}
                            aria-label={`Editar ${describeRow(row)}`}
                          >
                            <Edit2 size={14} aria-hidden="true" />
                            <span className={styles.actionLabel}>Editar</span>
                          </ClayButton>
                          {row.status === 'ATIVO' ? (
                            <ClayButton
                              variant="danger"
                              size="sm"
                              onClick={() => setPendingInactivate(row)}
                              aria-label={`Excluir ${describeRow(row)}`}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                              <span className={styles.actionLabel}>Excluir</span>
                            </ClayButton>
                          ) : (
                            <ClayButton
                              variant="secondary"
                              size="sm"
                              onClick={() => onChangeStatus(row, 'ATIVO')}
                              aria-label={`Reativar ${describeRow(row)}`}
                            >
                              <RotateCcw size={14} aria-hidden="true" />
                              <span className={styles.actionLabel}>Reativar</span>
                            </ClayButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ClayCard>

      <div className={styles.insertRow}>
        <ClayButton variant="primary" size="lg" onClick={onInsert}>
          <Plus size={18} aria-hidden="true" />
          {insertLabel}
        </ClayButton>
      </div>

      <ConfirmDialog
        isOpen={pendingInactivate !== null}
        onClose={() => setPendingInactivate(null)}
        onConfirm={async () => {
          if (pendingInactivate) await onChangeStatus(pendingInactivate, 'INATIVO');
          setPendingInactivate(null);
        }}
        title="Excluir registro?"
        description={
          pendingInactivate && (
            <>
              <strong>{describeRow(pendingInactivate)}</strong> será marcado como INATIVO. Cadastros
              não são apagados: ele pode ser reativado depois pela busca com inativos.
            </>
          )
        }
        confirmLabel="Excluir (inativar)"
        variant="danger"
      />
    </>
  );
}

export function StatusTag({ status }: { status: CadastroStatus }) {
  return (
    <span className={`badge ${status === 'ATIVO' ? 'badge--success' : 'badge--neutral'}`}>
      {status}
    </span>
  );
}
