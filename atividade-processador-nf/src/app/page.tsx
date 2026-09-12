'use client';

import React, { useState, useRef } from 'react';
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
  CheckCircle2,
  FileCode,
} from 'lucide-react';

interface ExtractedData {
  fornecedor: {
    razaoSocial: string;
    nomeFantasia?: string | null;
    cnpj: string;
  };
  faturado: {
    nomeCompleto: string;
    cpf: string;
  };
  numeroNotaFiscal: string;
  dataEmissao: string;
  descricaoProdutos: string[];
  quantidadeParcelas: number;
  parcelas: Array<{
    numero: number;
    dataVencimento: string;
    valor: number;
  }>;
  dataVencimento: string;
  valorTotal: number;
  tipoDespesa: string;
  classificacaoDespesa: string[];
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [rawJsonString, setRawJsonString] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo no formato PDF (.pdf).');
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
      alert('Por favor, arraste um arquivo no formato PDF (.pdf).');
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

  const handleLoadSamplePdf = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Carregando PDF de exemplo...');
      const response = await fetch('/exemplo-danfe.pdf');
      if (!response.ok) {
        throw new Error('PDF de exemplo não encontrado.');
      }
      const blob = await response.blob();
      const sampleFile = new File([blob], 'DANFE_Oleo_Diesel_Exemplo.pdf', {
        type: 'application/pdf',
      });
      setSelectedFile(sampleFile);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage('Não foi possível carregar o arquivo de exemplo.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleProcessPdf = async () => {
    if (!selectedFile) {
      alert('Selecione uma nota fiscal em PDF antes de iniciar o processamento.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Enviando documento e acionando Agente Gemini...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (apiKey.trim()) {
        formData.append('apiKey', apiKey.trim());
      }

      setStatusMessage('Gemini analisando visão do PDF e classificando despesas...');

      const response = await fetch('/api/extrair-nf', {
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido durante o processamento.';
      setErrorMessage(msg);
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
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      alert('Não foi possível copiar para a área de transferência.');
    }
  };

  const handleDownloadJson = () => {
    if (!rawJsonString) return;
    const blob = new Blob([rawJsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nf = extractedData?.numeroNotaFiscal ? `_${extractedData.numeroNotaFiscal}` : '';
    link.href = url;
    link.download = `nota_fiscal${nf}_extraida.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      {/* Header Acadêmico */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span
            style={{
              padding: '0.2rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '9999px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              border: '1px solid var(--primary-border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Sparkles size={12} />
            PRÁTICA DE ENGENHARIA DE SOFTWARE
          </span>
          <span
            style={{
              padding: '0.2rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '9999px',
              backgroundColor: '#f1f5f9',
              color: 'var(--text-muted)',
            }}
          >
            ATIVIDADE 1° ETAPA
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>
              Processador de PDF de Nota Fiscal (Contas a Pagar)
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Extração de dados fiscais com Agents (Gemini) e classificação semântica de despesas com retorno estrito em JSON na tela.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="btn btn-outline btn-sm"
              title="Configurar chave de API customizada"
            >
              <KeyRound size={14} />
              {showApiKeyInput ? 'Ocultar Chave API' : 'Informar Chave API'}
            </button>
          </div>
        </div>
      </div>

      {/* Caixa de Regras e Requisitos da Atividade */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--primary-border)',
          backgroundColor: 'var(--primary-light)',
          fontSize: '0.8125rem',
          color: '#065f46',
          marginBottom: '1.5rem',
          lineHeight: '1.6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          <Info size={16} />
          Especificações da Atividade 1° Etapa
        </div>
        <div>
          <strong>Campos obrigatórios extraídos:</strong> Fornecedor (Razão Social / Fantasia / CNPJ), Faturado (Nome Completo / CPF), Número da Nota Fiscal, Data de Emissão, Descrição dos produtos, Quantidade de Parcelas, Data de Vencimento e Valor Total.
        </div>
        <div style={{ marginTop: '0.35rem' }}>
          <strong>Classificação inteligente de DESPESA:</strong> O campo Despesa NÃO é extraído do texto físico, mas interpretado pelo Gemini conforme os produtos. Exemplo: <em>Compra de Óleo Diesel</em> &rarr; <strong>MANUTENÇÃO E OPERAÇÃO</strong> | <em>Compra de Material Hidráulico</em> &rarr; <strong>INFRAESTRUTURA E UTILIDADES</strong>.
        </div>
      </div>

      {/* Campo Opcional de Chave de API */}
      {showApiKeyInput && (
        <div className="card" style={{ marginBottom: '1.5rem', borderStyle: 'dashed', backgroundColor: '#f8fafc' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <KeyRound size={14} />
            Chave da API do Google Gemini (GEMINI_API_KEY)
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            A chave padrão já está pré-configurada no arquivo <code>.env</code> do projeto. Você só precisa digitar aqui caso queira testar com outra chave.
          </p>
          <input
            type="password"
            placeholder="Cole sua GEMINI_API_KEY aqui..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8125rem',
              fontFamily: 'monospace',
            }}
          />
        </div>
      )}

      {/* Upload e Execução */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Carregar Nota Fiscal (PDF)
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleLoadSamplePdf}
              className="btn btn-secondary btn-sm"
              title="Carrega um PDF de teste de compra de Óleo Diesel e Filtro"
            >
              <FileCode size={14} />
              Carregar PDF de Exemplo (Teste Rápido)
            </button>
            {selectedFile && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: 600,
                }}
              >
                <RotateCcw size={12} />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className={`dropzone ${selectedFile ? 'active' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {selectedFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={24} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {selectedFile.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Clique ou arraste outro PDF para substituir
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UploadCloud size={24} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                Clique aqui para selecionar ou arraste o PDF da Nota Fiscal
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Documentos DANFE, NF-e e NFS-e em formato PDF (máx. 20MB)
              </span>
            </div>
          )}
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--danger-light)',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertTriangle size={16} />
            <div>
              <strong>Erro:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Botão de Extração */}
        <div style={{ marginTop: '1.25rem' }}>
          <button
            type="button"
            disabled={!selectedFile || isLoading}
            onClick={handleProcessPdf}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isLoading ? <div className="spinner" /> : <Sparkles size={18} />}
            {isLoading ? 'Extraindo e Classificando com Gemini...' : 'Extrair Dados da Nota Fiscal'}
          </button>

          {isLoading && statusMessage && (
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: 600 }}>
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      {/* Painel do Resultado: Devolve os Dados em Formato JSON na TELA */}
      {rawJsonString && (
        <div className="card" style={{ border: '2px solid var(--primary)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '0.625rem',
                  height: '0.625rem',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'inline-block',
                }}
              />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Resultado da Extração (JSON Puro na Tela)
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleCopyJson} className="btn btn-secondary btn-sm">
                {isCopied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                {isCopied ? 'Copiado!' : 'Copiar JSON'}
              </button>

              <button onClick={handleDownloadJson} className="btn btn-outline btn-sm">
                <Download size={14} />
                Baixar .json
              </button>
            </div>
          </div>

          <div className="json-container">
            <div className="json-header">
              <span>resultado_extracao.json</span>
              <span>application/json</span>
            </div>
            <pre className="json-body">
              <code>{rawJsonString}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
