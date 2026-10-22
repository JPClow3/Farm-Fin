'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { Spinner } from '@/components/ui/Spinner';
import { NotaReviewForm } from '@/components/administrativo/NotaReviewForm';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import { useToast } from '@/context/ToastContext';
import { useModuleGuard } from '@/lib/useModuleGuard';
import { getAuthSessionAction } from '@/actions/auth';
import { canManageModule } from '@/lib/permissions';
import type { ExtractedInvoiceData } from '@/lib/mistralInvoiceAgent';
import { evaluateInvoiceQuality, type InvoiceReview } from '@/lib/invoiceQuality';
import {
  analisarNotaFiscal,
  cadastrarItensNotaFiscal,
  lancarNotaFiscal,
} from '@/actions/administrativo';
import {
  buildNotaPayload,
  type EntidadeConsulta,
  type NotaAnalise,
  type CadastroNotaResultado,
  type LancamentoResultado,
} from '@/lib/administrativo';
import {
  UploadCloud,
  FileText,
  Check,
  Download,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Building2,
  Package,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Copy,
} from 'lucide-react';
import styles from './processador-nf.module.css';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const actionLabel = { criado: 'Cadastrado', existente: 'Já cadastrado', reativado: 'Reativado' };

function CadastroItem({
  entidade,
  tipo,
}: {
  entidade: EntidadeConsulta;
  tipo: 'Empresa' | 'Produto';
}) {
  const ativo = entidade.existe && entidade.status === 'ATIVO';
  return (
    <li className={`${styles.cadastroRow} ${ativo ? styles.cadastroOk : styles.cadastroMissing}`}>
      {tipo === 'Empresa' ? (
        <Building2 size={20} aria-hidden="true" />
      ) : (
        <Package size={20} aria-hidden="true" />
      )}
      <div className={styles.cadastroName}>
        <strong>{entidade.nome || 'Empresa sem nome'}</strong>
        <span>
          {tipo}
          {entidade.documento ? ` · ${entidade.documento}` : ''}
        </span>
      </div>
      <span className={`badge ${ativo ? 'badge--success' : 'badge--warning'}`}>
        {ativo ? (
          <CheckCircle2 size={13} aria-hidden="true" />
        ) : (
          <PlusCircle size={13} aria-hidden="true" />
        )}
        {ativo ? 'Já cadastrado' : entidade.existe ? 'Inativo · será reativado' : 'Não cadastrado'}
      </span>
    </li>
  );
}

export default function ProcessadorNfPage() {
  const allowed = useModuleGuard('processador-nf');
  const { addToast } = useToast();
  const [canManage, setCanManage] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [data, setData] = useState<ExtractedInvoiceData | null>(null);
  const [ocrReview, setOcrReview] = useState<InvoiceReview | null>(null);
  const [analise, setAnalise] = useState<NotaAnalise | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [saving, setSaving] = useState<'cadastros' | 'lancamento' | null>(null);
  const [cadastro, setCadastro] = useState<CadastroNotaResultado | null>(null);
  const [lancamento, setLancamento] = useState<LancamentoResultado | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const revision = useRef(0);
  const mounted = useRef(true);
  const mutation = useRef(false);
  const extraction = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = processing || saving !== null;

  useEffect(() => {
    let active = true;
    mounted.current = true;
    getAuthSessionAction()
      .then((session) => {
        if (active) setCanManage(canManageModule(session.role, 'processador-nf'));
      })
      .catch(() => {});
    return () => {
      active = false;
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!processing) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [processing]);

  const clearResult = () => {
    revision.current++;
    setData(null);
    setOcrReview(null);
    setAnalise(null);
    setAnalysisError(null);
    setAnalysing(false);
    setCadastro(null);
    setLancamento(null);
    setConfirmed(false);
    setError(null);
    setNeedsLogin(false);
    setCopied(false);
  };
  const reset = () => {
    if (mutation.current || extraction.current) return;
    clearResult();
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  const selectFile = (next?: File) => {
    if (!next || mutation.current || extraction.current) return;
    if (next.size === 0 || next.size > 20 * 1024 * 1024 || !/\.pdf$/i.test(next.name)) {
      setError('Escolha um PDF válido, com até 20 MB.');
      return;
    }
    clearResult();
    setFile(next);
  };
  const runAnalysis = async (nota: ExtractedInvoiceData) => {
    if (!mounted.current) return;
    const request = ++revision.current;
    setAnalysing(true);
    setAnalysisError(null);
    setAnalise(null);
    try {
      const result = await analisarNotaFiscal(nota);
      if (!mounted.current || request !== revision.current) return;
      if (result.success) setAnalise(result.data);
      else setAnalysisError(result.error);
    } catch {
      if (mounted.current && request === revision.current)
        setAnalysisError(
          'Não foi possível consultar os cadastros. Verifique sua conexão e tente novamente.'
        );
    } finally {
      if (mounted.current && request === revision.current) setAnalysing(false);
    }
  };
  const editData = (next: ExtractedInvoiceData) => {
    if (mutation.current || lancamento) return;
    revision.current++;
    setData(next);
    setAnalise(null);
    setAnalysisError(null);
    setAnalysing(false);
    setConfirmed(false);
    setCadastro(null);
    setCopied(false);
  };
  const processPdf = async () => {
    if (!file || !canManage || extraction.current || mutation.current) return;
    extraction.current = true;
    clearResult();
    setProcessing(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/ai/extrair-nf', { method: 'POST', body: form });
      const result = await response.json().catch(() => null);
      if (response.status === 401) setNeedsLogin(true);
      if (!response.ok || !result?.success || !result.data) {
        setError(result?.error || 'Não foi possível ler a nota. Tente novamente.');
        return;
      }
      setData(result.data);
      setOcrReview(result.review ?? null);
      void runAnalysis(result.data);
      addToast({
        type: 'success',
        title: 'Leitura concluída',
        message: 'Confira os dados e os cadastros encontrados.',
      });
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      );
    } catch {
      setError('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
    } finally {
      setProcessing(false);
      extraction.current = false;
    }
  };
  const save = async (kind: 'cadastros' | 'lancamento') => {
    if (
      !data ||
      !analise ||
      analysing ||
      analysisError ||
      mutation.current ||
      !canManage ||
      lancamento ||
      !confirmed
    )
      return;
    const validation = buildNotaPayload(data);
    if (kind === 'lancamento' && (validation.pendencias.length || analise.movimentoExistenteId))
      return;
    if (kind === 'cadastros' && validation.pendenciasCadastro.length) return;
    mutation.current = true;
    setSaving(kind);
    setAnalysisError(null);
    try {
      if (kind === 'cadastros') {
        const result = await cadastrarItensNotaFiscal(data);
        if (!result.success) {
          setAnalysisError(result.error);
          return;
        }
        setCadastro(result.data);
        addToast({
          type: 'success',
          title: 'Cadastros concluídos',
          message: 'Empresa e produtos estão disponíveis para esta e as próximas notas.',
        });
      } else {
        const result = await lancarNotaFiscal(data);
        if (!result.success) {
          setAnalysisError(result.error);
          return;
        }
        setLancamento(result.data);
        addToast({
          type: 'success',
          title: 'Nota lançada',
          message: `Conta a pagar nº ${result.data.movimentoId} criada.`,
        });
      }
      await runAnalysis(data);
    } catch {
      await runAnalysis(data);
      setAnalysisError(
        'A resposta da gravação não foi confirmada. Consulte os cadastros novamente antes de tentar outra vez.'
      );
    } finally {
      mutation.current = false;
      setSaving(null);
    }
  };

  if (!allowed) return <AppShellSkeleton />;
  const validation = data ? buildNotaPayload(data) : null;
  const review = data ? evaluateInvoiceQuality(data) : null;
  const issues = [
    ...(review?.issues ?? []),
    ...(ocrReview?.issues.filter((i) => i.field === 'ocr') ?? []),
  ];
  const missing = analise
    ? [analise.fornecedor, ...analise.produtos].filter((e) => !e.existe || e.status !== 'ATIVO')
    : [];
  const json = data
    ? JSON.stringify(
        {
          data,
          review: {
            ...review,
            required: issues.length > 0,
            issues,
            ocrMinimumPageConfidence: ocrReview?.ocrMinimumPageConfidence ?? null,
          },
        },
        null,
        2
      )
    : '';
  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
    } catch {
      addToast({
        type: 'error',
        title: 'Falha ao copiar',
        message: 'Baixe o JSON para guardar os dados.',
      });
    }
  };
  const downloadJson = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nota-fiscal-revisada.json';
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className={styles.page}>
      <header className="page-header">
        <div className="page-title-group">
          <span className="badge badge--primary">
            <Sparkles size={13} aria-hidden="true" /> Leitura com IA
          </span>
          <h1 className="page-title">Leitor de Nota Fiscal</h1>
          <p className="page-subtitle">
            Do PDF ao cadastro. Leia a nota, confira os itens e resolva o que falta em um só lugar.
          </p>
        </div>
        <Link href="/atividades/produtos" className="btn btn--outline btn--sm">
          <Package size={16} aria-hidden="true" /> Catálogo de produtos
        </Link>
      </header>
      <ol className={styles.steps} aria-label="Etapas da importação">
        {['Enviar nota', 'Conferir e cadastrar', 'Lançar conta a pagar'].map((label, i) => (
          <li
            key={label}
            aria-current={(lancamento ? i === 2 : data ? i === 1 : i === 0) ? 'step' : undefined}
          >
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {!data && (
        <div className={styles.importGrid}>
          <ClayCard>
            <div className={styles.stack}>
              <h2 className="card-title">Envie sua nota fiscal</h2>
              <label
                className={`${styles.dropzone} ${dragging ? styles.dropzoneDragging : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  selectFile(e.dataTransfer.files[0]);
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  aria-label="Selecionar PDF da nota fiscal"
                  className={styles.visuallyHidden}
                  disabled={busy}
                  onChange={(e) => selectFile(e.target.files?.[0])}
                />
                <UploadCloud size={32} aria-hidden="true" />
                <strong>{file ? file.name : 'Escolha um PDF ou arraste aqui'}</strong>
                <span>DANFE, NF-e ou NFS-e · Até 20 MB</span>
              </label>
              {error && (
                <div className={styles.alert} role="alert">
                  {error}
                  {needsLogin && (
                    <Link href="/login?from=/atividades/processador-nf">Entrar novamente</Link>
                  )}
                </div>
              )}
              {processing && (
                <div className={styles.progress} role="status">
                  <Spinner size={16} /> Lendo a nota e identificando os itens… {elapsed}s
                </div>
              )}
              <div className={styles.actions}>
                <ClayButton
                  size="lg"
                  loading={processing}
                  disabled={!file || !canManage}
                  onClick={processPdf}
                >
                  <Sparkles size={16} aria-hidden="true" /> Extrair dados da nota
                </ClayButton>
                {file && (
                  <ClayButton variant="ghost" disabled={busy} onClick={reset}>
                    Remover arquivo
                  </ClayButton>
                )}
                {!file && (
                  <ClayButton
                    variant="outline"
                    disabled={busy}
                    onClick={async () => {
                      try {
                        const response = await fetch('/exemplo-danfe.pdf');
                        if (!response.ok) throw new Error();
                        selectFile(
                          new File([await response.blob()], 'exemplo-danfe.pdf', {
                            type: 'application/pdf',
                          })
                        );
                      } catch {
                        setError('Não foi possível carregar a nota de exemplo.');
                      }
                    }}
                  >
                    Usar nota de exemplo
                  </ClayButton>
                )}
              </div>
              {!canManage && (
                <p className={styles.muted}>
                  A leitura de novas notas requer permissão para gerenciar o módulo.
                </p>
              )}
            </div>
          </ClayCard>
          <aside className={styles.importGuide}>
            <span className={styles.eyebrow}>MENOS DIGITAÇÃO, MAIS CONTROLE</span>
            <h2>Uma nota. Tudo conectado.</h2>
            <p>
              <Building2 size={19} aria-hidden="true" /> Identifique se a empresa já está cadastrada
              pelo CPF/CNPJ.
            </p>
            <p>
              <Package size={19} aria-hidden="true" /> Descubra quais produtos precisam de cadastro.
            </p>
            <p>
              <CheckCircle2 size={19} aria-hidden="true" /> Cadastre os ausentes juntos e confira o
              pagamento.
            </p>
            <small>Você confere e confirma os dados antes de cada gravação.</small>
          </aside>
        </div>
      )}
      {data && (
        <div ref={resultRef} className={styles.stack}>
          <div className={styles.fileRow}>
            <FileText size={20} aria-hidden="true" />
            <strong className={styles.fileName}>{file?.name}</strong>
            <ClayButton variant="ghost" size="sm" disabled={busy} onClick={reset}>
              <RotateCcw size={14} aria-hidden="true" />{' '}
              {lancamento ? 'Ler outra nota' : 'Trocar nota'}
            </ClayButton>
          </div>
          {lancamento ? (
            <ClayCard>
              <div className={styles.successBox} role="status">
                <CheckCircle2 size={32} aria-hidden="true" />
                <div>
                  <h2>Nota lançada com sucesso</h2>
                  <p>
                    Conta a pagar nº {lancamento.movimentoId} ·{' '}
                    {currency.format(lancamento.valorTotal)}
                  </p>
                  <ul>
                    {lancamento.produtos.map((p) => (
                      <li key={p.id}>
                        {p.descricao} · {actionLabel[p.acao]} · ID {p.id}
                      </li>
                    ))}
                  </ul>
                  <p>{lancamento.parcelas.length} parcela(s) vinculada(s) à nota.</p>
                  <Link href="/atividades/contas-a-pagar" className="btn btn--primary">
                    Ver conta a pagar <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </ClayCard>
          ) : (
            <div className={styles.reviewGrid}>
              <ClayCard>
                <div className={styles.resultHeader}>
                  <div>
                    <h2 className="card-title">Confira os dados da nota</h2>
                    <p className="card-subtitle">
                      Corrija qualquer campo antes de cadastrar ou lançar.
                    </p>
                  </div>
                  <span className="badge badge--neutral">
                    NF {data.numeroNotaFiscal || 'sem número'}
                  </span>
                </div>
                {issues.length > 0 && (
                  <details className={styles.reviewAlert}>
                    <summary>
                      <AlertTriangle size={16} aria-hidden="true" /> {issues.length} ponto(s) para
                      conferir com o PDF
                    </summary>
                    <ul>
                      {issues.map((issue, i) => (
                        <li key={i}>{issue.message}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <NotaReviewForm data={data} onChange={editData} disabled={busy || !canManage} />
              </ClayCard>
              <aside className={styles.stack}>
                <ClayCard>
                  <div className={styles.resultHeader}>
                    <div>
                      <span className={styles.eyebrow}>CADASTROS DA NOTA</span>
                      <h2 className="card-title">O que falta cadastrar?</h2>
                    </div>
                  </div>
                  {analysing && (
                    <div className={styles.progress} role="status">
                      <Spinner size={16} /> Consultando empresa e produtos…
                    </div>
                  )}
                  {analysisError && (
                    <div className={styles.alert} role="alert">
                      {analysisError}
                    </div>
                  )}
                  {!analise && !analysing && (
                    <p className={styles.muted}>
                      {analysisError
                        ? 'Refaça a consulta para continuar com segurança.'
                        : 'Os dados foram alterados. Consulte os cadastros para atualizar o resultado.'}
                    </p>
                  )}
                  {analise && (
                    <>
                      <p className={styles.cadastroSummary} aria-live="polite">
                        {missing.length
                          ? `${missing.length} cadastro(s) para resolver`
                          : 'Empresa e produtos já cadastrados'}
                      </p>
                      <ul className={styles.cadastroList}>
                        <CadastroItem entidade={analise.fornecedor} tipo="Empresa" />
                        {analise.produtos.map((p) => (
                          <CadastroItem key={p.nome} entidade={p} tipo="Produto" />
                        ))}
                      </ul>
                      <details className={styles.details}>
                        <summary>Destinatário e classificações do lançamento</summary>
                        <ul>
                          {[analise.faturado, ...analise.despesas].map((entidade, i) => (
                            <li key={`${entidade.nome}-${i}`}>
                              {i === 0 ? 'Destinatário' : 'Classificação'}:{' '}
                              {entidade.nome || 'Não identificado'} ·{' '}
                              {!entidade.existe
                                ? 'Será cadastrado ao lançar'
                                : entidade.status === 'INATIVO'
                                  ? 'Será reativado ao lançar'
                                  : `Já existe · ID ${entidade.id}`}
                            </li>
                          ))}
                        </ul>
                      </details>
                      {validation && validation.pendenciasCadastro.length > 0 && (
                        <ul className={styles.pendingList}>
                          {validation.pendenciasCadastro.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      )}
                      {missing.length > 0 && (
                        <>
                          <label className={styles.confirmCheck}>
                            <input
                              type="checkbox"
                              checked={confirmed}
                              disabled={busy || !canManage}
                              onChange={(e) => setConfirmed(e.target.checked)}
                            />{' '}
                            Conferi os dados com o PDF
                          </label>
                          <ClayButton
                            className={styles.fullButton}
                            loading={saving === 'cadastros'}
                            disabled={
                              !canManage ||
                              busy ||
                              !confirmed ||
                              !!validation?.pendenciasCadastro.length ||
                              !!analysisError
                            }
                            onClick={() => save('cadastros')}
                          >
                            <PlusCircle size={16} aria-hidden="true" /> Cadastrar empresa e produtos
                          </ClayButton>
                          <p className={styles.muted}>
                            Somente os ausentes serão criados. Os inativos serão reativados.
                          </p>
                        </>
                      )}
                    </>
                  )}
                  {cadastro && (
                    <div className={styles.savedNotice} role="status">
                      <CheckCircle2 size={18} aria-hidden="true" /> Empresa e produtos cadastrados
                      com sucesso.
                    </div>
                  )}
                  <ClayButton
                    variant="outline"
                    className={styles.fullButton}
                    loading={analysing}
                    disabled={busy}
                    onClick={() => runAnalysis(data)}
                  >
                    <RefreshCw size={15} aria-hidden="true" />{' '}
                    {analysisError ? 'Tentar consulta novamente' : 'Consultar cadastros'}
                  </ClayButton>
                  <Link href="/atividades/produtos" className={styles.catalogLink}>
                    Abrir catálogo de produtos <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </ClayCard>
                <ClayCard>
                  <span className={styles.eyebrow}>PAGAMENTO</span>
                  <h2 className="card-title">Concluir o lançamento</h2>
                  <p className={styles.paymentTotal}>
                    {data.valorTotal == null
                      ? 'Valor não identificado'
                      : currency.format(data.valorTotal)}
                  </p>
                  {analise?.movimentoExistenteId ? (
                    <div className={styles.reviewAlert} role="alert">
                      Esta nota já foi lançada (nº {analise.movimentoExistenteId}).{' '}
                      <Link href="/atividades/contas-a-pagar">Ver conta a pagar</Link>
                    </div>
                  ) : (
                    <>
                      {validation && validation.pendencias.length > 0 && (
                        <details className={styles.details}>
                          <summary>
                            Corrija {validation.pendencias.length} pendência(s) para lançar
                          </summary>
                          <ul>
                            {validation.pendencias.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {analise && (
                        <p className={styles.muted}>
                          O lançamento vincula os produtos e cria também o destinatário e as
                          classificações que faltarem.
                        </p>
                      )}
                      {!missing.length && (
                        <label className={styles.confirmCheck}>
                          <input
                            type="checkbox"
                            checked={confirmed}
                            disabled={busy || !canManage}
                            onChange={(e) => setConfirmed(e.target.checked)}
                          />{' '}
                          Conferi os dados com o PDF
                        </label>
                      )}
                      <ClayButton
                        className={styles.fullButton}
                        loading={saving === 'lancamento'}
                        disabled={
                          !canManage ||
                          busy ||
                          analysing ||
                          !analise ||
                          !!analysisError ||
                          !confirmed ||
                          !!validation?.pendencias.length
                        }
                        onClick={() => save('lancamento')}
                      >
                        Lançar conta a pagar <ArrowRight size={16} aria-hidden="true" />
                      </ClayButton>
                    </>
                  )}
                  {!canManage && (
                    <p className={styles.muted}>
                      Seu perfil permite consultar. Peça a um responsável para cadastrar ou lançar.
                    </p>
                  )}
                </ClayCard>
              </aside>
            </div>
          )}
          <details className={styles.jsonDetails}>
            <summary>Dados técnicos · JSON revisado</summary>
            <div className={styles.actions}>
              <ClayButton variant="outline" size="sm" onClick={copyJson}>
                {copied ? <Check size={14} /> : <Copy size={14} />}{' '}
                {copied ? 'Copiado' : 'Copiar JSON'}
              </ClayButton>
              <ClayButton variant="outline" size="sm" onClick={downloadJson}>
                <Download size={14} /> Baixar JSON
              </ClayButton>
            </div>
            <pre className={styles.code} tabIndex={0} aria-label="JSON revisado da nota fiscal">
              {json}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
