'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [json, setJson] = useState('');

  async function extrair() {
    if (!file) {
      setErro('Selecione um arquivo PDF.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErro('Formato inválido. Selecione um arquivo .pdf.');
      return;
    }
    if (file.size === 0) {
      setErro('O arquivo está vazio.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErro('O arquivo excede 20MB.');
      return;
    }
    setLoading(true);
    setErro('');
    setJson('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/extrair-nf', { method: 'POST', body: form });
      const out = await res.json();
      if (!res.ok || !out.success) throw new Error(out.error || 'Falha ao extrair.');
      setJson(JSON.stringify(out.data, null, 2));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  async function copiar() {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      alert('JSON copiado.');
    } catch {
      alert('Não foi possível copiar.');
    }
  }

  return (
    <main className="wrap">
      <h1>Extração de Dados de Nota Fiscal</h1>
      <p className="sub">Carregue um PDF de nota fiscal e extraia os dados automaticamente usando IA</p>

      <section className="box">
        <h2>Upload do PDF</h2>
        <label>Selecione o arquivo PDF da nota fiscal</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file && (
          <p className="file">
            {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
        <button onClick={extrair} disabled={!file || loading}>
          {loading ? 'Extraindo...' : 'Extrair dados'}
        </button>
        {erro && <p className="erro">{erro}</p>}
      </section>

      {json && (
        <section className="box">
          <h2>Dados Extraídos</h2>
          <button onClick={copiar} className="sec">
            Copiar JSON
          </button>
          <pre>{json}</pre>
        </section>
      )}
    </main>
  );
}
