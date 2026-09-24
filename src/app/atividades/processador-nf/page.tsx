'use client';

import React, { useState, useRef } from 'react';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayButton } from '@/components/ui/ClayButton';
import { ClayInput } from '@/components/ui/ClayInput';
import { useToast } from '@/context/ToastContext';
import { useModuleGuard } from '@/lib/useModuleGuard';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import { ExtractedInvoiceData } from '@/lib/mistralInvoiceAgent';
import {
  Sparkles,
  UploadCloud,
  FileText,
  Copy,
  Check,
  Download,
  RotateCcw,
  KeyRound,
  AlertTriangle,
  Info,
  Layers,
  Tag,
  Calendar,
  DollarSign,
  Building,
  User,
} from 'lucide-react';

export default function ProcessadorNfPage() {
  const moduleAllowed = useModuleGuard('processador-nf');
  const { addToast } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [rawJsonString, setRawJsonString] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!moduleAllowed) {
    return <AppShellSkeleton />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      addToast({
        type: 'error',
        title: 'Arquivo inválido',
        message: 'Por favor, selecione um arquivo no formato PDF (.pdf).',
      });
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      addToast({
        type: 'error',
        title: 'Arquivo inválido',
        message: 'Por favor, arraste um arquivo no formato PDF (.pdf).',
      });
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setRawJsonString('');
    setErrorMessage(null);
    setStatusMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessPdf = async () => {
    if (!selectedFile) {
      addToast({
        type: 'warning',
        title: 'Nenhum arquivo selecionado',
        message: 'Faça o upload de uma nota fiscal em formato PDF antes de processar.',
      });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Enviando documento e acionando Mistral OCR...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (apiKey.trim()) {
        formData.append('apiKey', apiKey.trim());
      }

      setStatusMessage('Mistral OCR lendo o PDF e classificando despesas...');

      const response = await fetch('/api/ai/extrair-nf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Falha ao processar nota fiscal');
      }

      const formattedJson = JSON.stringify(result.data, null, 2);
      setExtractedData(result.data);
      setRawJsonString(formattedJson);

      addToast({
        type: 'success',
        title: 'Extração Concluída!',
        message: 'Dados fiscais extraídos e classificados com sucesso pela Mistral.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido durante o processamento.';
      setErrorMessage(msg);
      addToast({
        type: 'error',
        title: 'Falha na extração',
        message: msg,
      });
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleCopyJson = async () => {
    if (!rawJsonString) return;
    try {
      await navigator.clipboard.writeText(rawJsonString);
      setIsCopied(true);
      addToast({
        type: 'info',
        title: 'Copiado!',
        message: 'JSON copiado para a área de transferência.',
      });
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
    const nfNumber = extractedData?.numeroNotaFiscal ? `_${extractedData.numeroNotaFiscal}` : '';
    link.href = url;
    link.download = `nota_fiscal${nfNumber}_extraida.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header com identificação da atividade acadêmica */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] border border-[var(--color-primary-200)] flex items-center gap-1.5">
              <Sparkles size={12} />
              PRÁTICA DE ENGENHARIA DE SOFTWARE
            </span>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)]">
              ATIVIDADE 1° ETAPA
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Processador de PDF de Nota Fiscal (Contas a Pagar)
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Extração inteligente de dados fiscais com Mistral OCR e agentes de IA (Mistral) e classificação semântica de despesas com retorno estrito em JSON.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ClayButton
            variant="outline"
            size="sm"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="flex items-center gap-1.5"
          >
            <KeyRound size={15} />
            {showApiKeyInput ? 'Ocultar Chave API' : 'Informar Chave API'}
          </ClayButton>
        </div>
      </div>

      {/* Box explicativo dos requisitos e regras da atividade */}
      <div className="p-4 rounded-xl border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] text-sm text-[var(--color-text-primary)] space-y-2">
        <div className="flex items-center gap-2 font-semibold text-[var(--color-primary-800)]">
          <Info size={16} />
          Especificações da Atividade 1° Etapa
        </div>
        <p className="text-xs text-[var(--color-primary-900)] leading-relaxed">
          <strong>Campos obrigatórios extraídos:</strong> Fornecedor (Razão Social / Fantasia / CNPJ), Faturado (Nome / CPF), Número da NF, Data de Emissão, Descrição dos produtos, Quantidade de Parcelas, Data de Vencimento e Valor Total.
        </p>
        <p className="text-xs text-[var(--color-primary-900)] leading-relaxed">
          <strong>Classificação inteligente de DESPESA:</strong> O campo Despesa não existe na nota fiscal e é interpretado pela IA (Mistral) com base nos produtos.
          Exemplo: <em>Óleo Diesel</em> &rarr; <strong>MANUTENÇÃO E OPERAÇÃO</strong> | <em>Material Hidráulico</em> &rarr; <strong>INFRAESTRUTURA E UTILIDADES</strong>.
        </p>
      </div>

      {/* Input Opcional de API Key */}
      {showApiKeyInput && (
        <ClayCard className="p-4 space-y-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
            <KeyRound size={14} />
            Chave da API da Mistral (La Plateforme)
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Se já configurada no arquivo <code>.env.local</code> (variável <code>MISTRAL_API_KEY</code>), você não precisa preencher este campo. Use apenas se desejar usar uma chave customizada para testes ou avaliação.
          </p>
          <ClayInput
            type="password"
            placeholder="Sua chave da Mistral..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="text-sm font-mono"
          />
        </ClayCard>
      )}

      {/* Upload e Ação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <ClayCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Carregar Nota Fiscal (PDF)
                </span>
                {selectedFile && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-[var(--color-danger)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    Limpar
                  </button>
                )}
              </div>

              {/* Área de Drop/Upload */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  selectedFile
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-primary-400)] hover:bg-[var(--color-surface-sunken)]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Clique ou arraste outro PDF para substituir
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-text-muted)] flex items-center justify-center">
                      <UploadCloud size={24} />
                    </div>
                    <span className="font-medium text-sm text-[var(--color-text-primary)]">
                      Clique aqui para selecionar ou arraste o PDF da Nota Fiscal
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Suporta documentos DANFE, NF-e e NFS-e em formato PDF (máx. 20MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Mensagem de Erro */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-[var(--color-danger-50)] border border-[var(--color-danger-200)] text-[var(--color-danger-700)] text-xs flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>Erro no processamento:</strong> {errorMessage}
                  </div>
                </div>
              )}

              {/* Botão de Extração */}
              <div className="pt-2">
                <ClayButton
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  disabled={!selectedFile || isLoading}
                  onClick={handleProcessPdf}
                  className="w-full flex items-center justify-center gap-2 font-semibold"
                >
                  <Sparkles size={18} />
                  {isLoading ? 'Extraindo e Classificando com Mistral...' : 'Extrair Dados da Nota Fiscal'}
                </ClayButton>

                {isLoading && statusMessage && (
                  <p className="text-xs text-center text-[var(--color-primary-700)] mt-2 animate-pulse">
                    {statusMessage}
                  </p>
                )}
              </div>
            </div>
          </ClayCard>
        </div>

        {/* Resumo lateral das diretrizes de extração */}
        <div className="space-y-4">
          <ClayCard className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Layers size={16} />
              Estrutura de Extração
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
                <Building size={14} className="shrink-0 mt-0.5 text-[var(--color-primary-600)]" />
                <div>
                  <strong>Fornecedor:</strong> Razão Social, Fantasia e CNPJ.
                </div>
              </div>

              <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
                <User size={14} className="shrink-0 mt-0.5 text-[var(--color-primary-600)]" />
                <div>
                  <strong>Faturado:</strong> Nome Completo e CPF.
                </div>
              </div>

              <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
                <Calendar size={14} className="shrink-0 mt-0.5 text-[var(--color-primary-600)]" />
                <div>
                  <strong>Datas & Parcelas:</strong> Emissão, Vencimento e lista de Parcelas (com suporte a múltiplas).
                </div>
              </div>

              <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
                <DollarSign size={14} className="shrink-0 mt-0.5 text-[var(--color-primary-600)]" />
                <div>
                  <strong>Valor Total:</strong> Montante total da nota fiscal.
                </div>
              </div>

              <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
                <Tag size={14} className="shrink-0 mt-0.5 text-[var(--color-primary-600)]" />
                <div>
                  <strong>Tipo de Despesa:</strong> Classificação inteligente inferida pelo modelo com base nos produtos.
                </div>
              </div>
            </div>
          </ClayCard>
        </div>
      </div>

      {/* Painel do Resultado: Exibição Estrita do Bloco JSON na Tela */}
      {rawJsonString && (
        <ClayCard className="p-6 border-2 border-[var(--color-primary-500)] shadow-lg">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    Dados Extraídos em Formato JSON (Resultado na Tela)
                  </h2>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Conforme exigido na atividade, o Mistral OCR extraiu os dados do PDF e classificou a despesa devolvendo o JSON puro abaixo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ClayButton
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5"
                >
                  {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {isCopied ? 'Copiado!' : 'Copiar JSON'}
                </ClayButton>

                <ClayButton
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1.5"
                >
                  <Download size={14} />
                  Baixar .json
                </ClayButton>
              </div>
            </div>

            {/* Bloco de Código JSON */}
            <div className="relative rounded-xl overflow-hidden bg-[#0d1117] border border-[#30363d] text-[#c9d1d9]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] text-xs text-[#8b949e] font-mono">
                <span>invoice_result.json</span>
                <span>application/json</span>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed max-h-[600px] select-all">
                <code>{rawJsonString}</code>
              </pre>
            </div>
          </div>
        </ClayCard>
      )}
    </div>
  );
}
