'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/context/ToastContext';
import { useModuleGuard } from '@/lib/useModuleGuard';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import type { ExtractedInvoiceData } from '@/lib/mistralInvoiceAgent';
import type { InvoiceReview } from '@/lib/invoiceQuality';
import {
  Sparkles,
  UploadCloud,
  FileText,
  Copy,
  Check,
  Download,
  RotateCcw,
  AlertTriangle,
  Tag,
  Calendar,
  DollarSign,
  Building,
  User,
  FlaskConical,
} from 'lucide-react';
import styles from './processador-nf.module.css';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const SAMPLE_PDF_URL = '/exemplo-danfe.pdf';

interface ProcessingError {
  message: string;
  /** Sessão expirada: mostra link para login */
  needsLogin?: boolean;
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatCurrency(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? currency.format(n) : '—';
}

/** "AAAA-MM-DD" → "DD/MM/AAAA" sem conversão de fuso horário */
function formatDate(value: unknown): string {
  if (typeof value !== 'string') return '—';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value || '—';
}

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validatePdf(file: File): string | null {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return 'Selecione um arquivo no formato PDF (.pdf).';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `O arquivo tem ${formatFileSize(file.size)}; o limite é 20 MB.`;
  }
  return null;
}

export default function ProcessadorNfPage() {
  const moduleAllowed = useModuleGuard('processador-nf');
  const { addToast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [review, setReview] = useState<InvoiceReview | null>(null);
  const [rawJsonString, setRawJsonString] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<ProcessingError | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Contador de tempo durante a extração (costuma levar ~10 s)
  useEffect(() => {
    if (!isLoading) return;
    setElapsedSeconds(0);
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isLoading]);

  // Leva o usuário até o resultado quando ele fica pronto
  useEffect(() => {
    if (extractedData) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [extractedData]);

  if (!moduleAllowed) {
    return <AppShellSkeleton />;
  }

  const selectFile = (file: File | undefined) => {
    if (!file || isLoading) return;
    const validationError = validatePdf(file);
    if (validationError) {
      setError({ message: validationError });
      return;
    }
    setSelectedFile(file);
    setError(null);
    // Um novo arquivo invalida o resultado anterior
    setExtractedData(null);
    setReview(null);
    setRawJsonString('');
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    selectFile(e.dataTransfer.files?.[0]);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setReview(null);
    setRawJsonString('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUseSample = async () => {
    try {
      const response = await fetch(SAMPLE_PDF_URL);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      selectFile(new File([blob], 'exemplo-danfe.pdf', { type: 'application/pdf' }));
    } catch {
      setError({ message: 'Não foi possível carregar a nota de exemplo.' });
    }
  };

  const handleProcessPdf = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setExtractedData(null);
    setReview(null);
    setRawJsonString('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/ai/extrair-nf', {
        method: 'POST',
        body: formData,
      });

      // Respostas de erro da plataforma podem não ser JSON
      const result = await response.json().catch(() => null);

      if (response.status === 401) {
        setError({
          message: result?.error || 'Sua sessão expirou. Faça login novamente.',
          needsLogin: true,
        });
        return;
      }

      if (!response.ok || !result?.success) {
        setError({
          message: result?.error || `Falha ao processar a nota fiscal (erro ${response.status}).`,
        });
        return;
      }

      setExtractedData(result.data);
      setReview(result.review ?? null);
      setRawJsonString(JSON.stringify({ data: result.data, review: result.review }, null, 2));
      addToast({
        type: result.review?.required ? 'warning' : 'success',
        title: result.review?.required ? 'Confira os campos sinalizados' : 'Extração concluída',
        message: 'Confira os dados com o PDF antes de lançar em Contas a Pagar.',
      });
    } catch {
      setError({
        message: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJson = async () => {
    if (!rawJsonString) return;
    try {
      await navigator.clipboard.writeText(rawJsonString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      addToast({
        type: 'error',
        title: 'Erro ao copiar',
        message: 'Não foi possível copiar o JSON para a área de transferência.',
      });
    }
  };

  const handleDownloadJson = () => {
    if (!rawJsonString) return;
    const blob = new Blob([rawJsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nfNumber = extractedData?.numeroNotaFiscal
      ? `_${extractedData.numeroNotaFiscal.replace(/[^\w-]/g, '')}`
      : '';
    link.href = url;
    link.download = `nota_fiscal${nfNumber}_extraida.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parcelas = Array.isArray(extractedData?.parcelas) ? extractedData.parcelas : [];
  const produtos = Array.isArray(extractedData?.descricaoProdutos)
    ? extractedData.descricaoProdutos
    : [];
  const classificacoes = Array.isArray(extractedData?.classificacaoDespesa)
    ? extractedData.classificacaoDespesa
    : [];

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-title-group">
          <div className={styles.badges}>
            <span className="badge badge--primary">
              <Sparkles size={12} aria-hidden="true" />
              Leitura com IA
            </span>
            <span className="badge badge--neutral">Atividade 1ª etapa</span>
          </div>
          <h1 className="page-title">Leitor de Nota Fiscal</h1>
          <p className="page-subtitle">
            Envie o PDF da nota (DANFE, NF-e ou NFS-e). O sistema lê o documento, preenche os dados
            de Contas a Pagar e classifica o tipo de despesa.
          </p>
        </div>
      </div>

      <div className={`grid-2-1 ${styles.layout}`}>
        <ClayCard>
          <div className={styles.stack}>
            <div className="card-header" style={{ marginBottom: 0 }}>
              <h2 className="card-title">1. Escolha a nota fiscal</h2>
            </div>

            {selectedFile ? (
              <div className={styles.fileRow}>
                <div className={styles.fileIcon}>
                  <FileText size={20} aria-hidden="true" />
                </div>
                <div className={styles.fileMeta}>
                  <span className={styles.fileName} title={selectedFile.name}>
                    {selectedFile.name}
                  </span>
                  <span className={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
                </div>
                <ClayButton
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={isLoading}
                  aria-label="Remover arquivo selecionado"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Trocar
                </ClayButton>
              </div>
            ) : (
              <label
                className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ''} ${
                  isLoading ? styles.dropzoneDisabled : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className={styles.visuallyHidden}
                  onChange={(e) => selectFile(e.target.files?.[0])}
                  disabled={isLoading}
                />
                <span className={styles.dropIcon}>
                  <UploadCloud size={24} aria-hidden="true" />
                </span>
                <span className={styles.dropTitle}>Toque para escolher o PDF ou arraste aqui</span>
                <span className={styles.dropHint}>DANFE, NF-e ou NFS-e em PDF • até 20 MB</span>
              </label>
            )}

            {error && (
              <div className={styles.alert} role="alert">
                <AlertTriangle size={18} className={styles.alertIcon} aria-hidden="true" />
                <div>
                  {error.message}
                  {error.needsLogin && (
                    <>
                      {' '}
                      <Link href="/login?from=/atividades/processador-nf">Entrar novamente</Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {isLoading && (
              <div className={styles.progress} role="status" aria-live="polite">
                <Spinner size={16} />
                <span>
                  Lendo a nota e classificando a despesa… {elapsedSeconds}s
                  {elapsedSeconds >= 5 && ' (costuma levar uns 10 segundos)'}
                </span>
              </div>
            )}

            <div className={styles.uploadActions}>
              <ClayButton
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={!selectedFile}
                onClick={handleProcessPdf}
              >
                {!isLoading && <Sparkles size={18} aria-hidden="true" />}
                {isLoading ? 'Extraindo dados…' : '2. Extrair dados da nota'}
              </ClayButton>
              {!selectedFile && (
                <ClayButton variant="outline" size="lg" onClick={handleUseSample}>
                  <FlaskConical size={18} aria-hidden="true" />
                  Usar nota de exemplo
                </ClayButton>
              )}
            </div>
          </div>
        </ClayCard>

        <ClayCard>
          <div className="card-header">
            <h2 className="card-title">O que é extraído</h2>
          </div>
          <ul className={styles.guideList}>
            <li className={styles.guideItem}>
              <Building size={16} className={styles.guideIcon} aria-hidden="true" />
              <span>
                <strong>Fornecedor:</strong> razão social, nome fantasia e CNPJ
              </span>
            </li>
            <li className={styles.guideItem}>
              <User size={16} className={styles.guideIcon} aria-hidden="true" />
              <span>
                <strong>Faturado:</strong> nome completo e CPF
              </span>
            </li>
            <li className={styles.guideItem}>
              <Calendar size={16} className={styles.guideIcon} aria-hidden="true" />
              <span>
                <strong>Datas e parcelas:</strong> emissão, vencimentos e valor de cada parcela
              </span>
            </li>
            <li className={styles.guideItem}>
              <DollarSign size={16} className={styles.guideIcon} aria-hidden="true" />
              <span>
                <strong>Valor total</strong> da nota, já com descontos
              </span>
            </li>
            <li className={styles.guideItem}>
              <Tag size={16} className={styles.guideIcon} aria-hidden="true" />
              <span>
                <strong>Tipo de despesa:</strong> não vem na nota; é deduzido pelos produtos (ex.:
                óleo diesel → Manutenção e Operação)
              </span>
            </li>
          </ul>

          <details className={`${styles.details} ${styles.section}`}>
            <summary>Sobre a atividade</summary>
            <p>
              Atividade da 1ª etapa de Prática de Engenharia de Software: extrair do PDF os campos
              obrigatórios (fornecedor, faturado, número da NF, data de emissão, produtos, parcelas,
              vencimento e valor total), classificar a despesa e exibir o resultado em JSON na tela.
            </p>
          </details>
        </ClayCard>
      </div>

      {extractedData && (
        <div
          ref={resultRef}
          className="flex-col"
          style={{ gap: 'var(--space-6)', scrollMarginTop: 'var(--space-6)' }}
        >
          {review?.required && (
            <div className={styles.reviewAlert} role="alert">
              <AlertTriangle size={20} aria-hidden="true" />
              <div>
                <strong>Revisão necessária antes de usar estes dados</strong>
                <ul>
                  {review.issues.map((issue, index) => (
                    <li key={`${issue.field}-${index}`}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <ClayCard>
            <div className={styles.resultHeader}>
              <div>
                <h2 className="card-title">Dados da nota</h2>
                <p className="card-subtitle">Confira com o documento antes de lançar.</p>
              </div>
              {classificacoes.length > 0 && (
                <div className={styles.badges} style={{ marginBottom: 0 }}>
                  {classificacoes.map((c) => (
                    <span key={c} className="badge badge--accent">
                      <Tag size={12} aria-hidden="true" />
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.field}>
                <span className="label">Valor total</span>
                <span className={styles.total}>{formatCurrency(extractedData.valorTotal)}</span>
                <span className={styles.fieldSub}>
                  Vencimento {formatDate(extractedData.dataVencimento)}
                </span>
              </div>
              <div className={styles.field}>
                <span className="label">Fornecedor</span>
                <span className={styles.fieldValue}>
                  {extractedData.fornecedor?.razaoSocial || '—'}
                </span>
                <span className={styles.fieldSub}>
                  {[
                    extractedData.fornecedor?.nomeFantasia,
                    extractedData.fornecedor?.cnpj && `CNPJ ${extractedData.fornecedor.cnpj}`,
                  ]
                    .filter(Boolean)
                    .join(' • ') || '—'}
                </span>
              </div>
              <div className={styles.field}>
                <span className="label">Faturado</span>
                <span className={styles.fieldValue}>
                  {extractedData.faturado?.nomeCompleto || '—'}
                </span>
                <span className={styles.fieldSub}>
                  {extractedData.faturado?.cpf ? `CPF/CNPJ ${extractedData.faturado.cpf}` : '—'}
                </span>
              </div>
              <div className={styles.field}>
                <span className="label">Nota fiscal</span>
                <span className={styles.fieldValue}>
                  Nº {extractedData.numeroNotaFiscal || '—'}
                </span>
                <span className={styles.fieldSub}>
                  Emitida em {formatDate(extractedData.dataEmissao)}
                </span>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                Parcelas ({extractedData.quantidadeParcelas || parcelas.length})
              </h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Parcela</th>
                      <th scope="col">Vencimento</th>
                      <th scope="col" className={styles.num}>
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parcelas.map((p, i) => (
                      <tr key={`${p.numero}-${i}`}>
                        <td>{p.numero ?? i + 1}</td>
                        <td>{formatDate(p.dataVencimento)}</td>
                        <td className={styles.num}>{formatCurrency(p.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {produtos.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Produtos e serviços ({produtos.length})</h3>
                <ul className={styles.productList}>
                  {produtos.map((produto, i) => (
                    <li key={`${produto}-${i}`} className={styles.productItem}>
                      {produto}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </ClayCard>

          <ClayCard>
            <div className={styles.resultHeader}>
              <div>
                <h2 className="card-title">Resultado em JSON</h2>
                <p className="card-subtitle">Dados extraídos e alertas de revisão.</p>
              </div>
              <div className={styles.actions}>
                <ClayButton variant="secondary" size="sm" onClick={handleCopyJson}>
                  {isCopied ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <Copy size={14} aria-hidden="true" />
                  )}
                  <span aria-live="polite">{isCopied ? 'Copiado!' : 'Copiar JSON'}</span>
                </ClayButton>
                <ClayButton variant="outline" size="sm" onClick={handleDownloadJson}>
                  <Download size={14} aria-hidden="true" />
                  Baixar .json
                </ClayButton>
              </div>
            </div>

            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span>nota_fiscal.json</span>
                <span>application/json</span>
              </div>
              <pre className={styles.code} tabIndex={0} aria-label="JSON extraído da nota fiscal">
                <code>{rawJsonString}</code>
              </pre>
            </div>
          </ClayCard>
        </div>
      )}
    </div>
  );
}
