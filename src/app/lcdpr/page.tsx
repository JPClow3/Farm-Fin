'use client';

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayModal } from '../../components/ui/ClayModal';

interface LcdprEntry {
  id: string;
  date: string;
  propertyCode: string;
  bankAccountCode: string;
  docType: string;
  docNumber: string;
  history: string;
  participantDoc: string;
  entryType: '1 - Receita da Atividade' | '2 - Despesa de Custeio' | '3 - Despesa de Investimento';
  amount: number;
  balanceType: 'E' | 'S';
}

export default function LcdprPage() {
  const { activeFarm, activeSeason, activePayables, activeReceivables } = useFarm();
  const { addToast } = useToast();

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Simulated LCDPR ledger entries
  const entries: LcdprEntry[] = [
    {
      id: 'lcdpr-1',
      date: '2026-08-01',
      propertyCode: '001',
      bankAccountCode: '001',
      docType: '1 - Nota Fiscal',
      docNumber: 'NF-e 1042',
      history: 'Recebimento Venda Soja Safra 25/26 - Amaggi Exportação',
      participantDoc: '03.007.331/0001-41',
      entryType: '1 - Receita da Atividade',
      amount: 1350000.0,
      balanceType: 'E',
    },
    {
      id: 'lcdpr-2',
      date: '2026-08-04',
      propertyCode: '001',
      bankAccountCode: '001',
      docType: '1 - Nota Fiscal',
      docNumber: 'NF-e 78912',
      history: 'Pagamento Revisão Colheitadeira S770 - John Deere',
      participantDoc: '01.234.567/0001-88',
      entryType: '2 - Despesa de Custeio',
      amount: 28400.0,
      balanceType: 'S',
    },
    {
      id: 'lcdpr-3',
      date: '2026-08-08',
      propertyCode: '001',
      bankAccountCode: '001',
      docType: '3 - Recibo',
      docNumber: 'REC 049',
      history: 'Aquisição Diesel S10 Abastecimento Frota Tratores',
      participantDoc: '34.274.233/0001-02',
      entryType: '2 - Despesa de Custeio',
      amount: 93750.0,
      balanceType: 'S',
    },
    {
      id: 'lcdpr-4',
      date: '2026-08-10',
      propertyCode: '001',
      bankAccountCode: '002',
      docType: '1 - Nota Fiscal',
      docNumber: 'NF-e 84920',
      history: 'Adubação e Fertilizante NPK - Yara Brasil S.A.',
      participantDoc: '00.000.000/0001-91',
      entryType: '2 - Despesa de Custeio',
      amount: 384000.0,
      balanceType: 'S',
    },
  ];

  const totalReceitas = entries
    .filter((e) => e.balanceType === 'E')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDespesas = entries
    .filter((e) => e.balanceType === 'S')
    .reduce((sum, e) => sum + e.amount, 0);

  const saldoFiscal = totalReceitas - totalDespesas;

  // Generate simulated Layout 1.3 text file
  const generatedTxtContent = `0000|LCDPR|1.30|12345678900|ANTONIO DA SILVA CARVALHO|0|01012026|31122026
0010|1|
0030|001|FAZENDA SANTA FE|MT|5107909|1234567-8|2400.00|1|100.00|${activeFarm.carNumber}
0040|001|001|1240-5|48912-3|BANCO DO BRASIL AGRO
0040|002|748|0810|105820-1|SICREDI UNIAO MT
${entries
  .map(
    (e, idx) =>
      `Q100|${e.date.replace(/-/g, '')}|${e.propertyCode}|${e.bankAccountCode}|${idx + 1}|${e.docType.charAt(0)}|${e.docNumber}|${e.history}|${e.participantDoc}|${e.entryType.charAt(0)}|${e.amount.toFixed(2)}|${e.balanceType}`
  )
  .join('\n')}
9999|${entries.length + 5}|`;

  const handleDownloadTxt = () => {
    const blob = new Blob([generatedTxtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LCDPR_2026_${activeFarm.name.replace(/\s+/g, '_')}_Layout1.3.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Arquivo LCDPR Gerado!',
      message: 'Arquivo .txt gerado com sucesso em conformidade com a Receita Federal.',
    });
  };

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Livro Caixa Digital do Produtor Rural (LCDPR)</h1>
          <p className="page-subtitle">
            Conformidade fiscal com a Receita Federal do Brasil (Layout Oficial 1.3 para e-CAC)
          </p>
        </div>
        <div className="flex-row">
          <ClayButton variant="ghost" onClick={() => setIsPreviewModalOpen(true)}>
            🔍 Visualizar Layout .TXT
          </ClayButton>
          <ClayButton variant="primary" onClick={handleDownloadTxt}>
            📥 Baixar Arquivo LCDPR (.txt)
          </ClayButton>
        </div>
      </div>

      {/* Compliance Alert */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-6)',
          background: 'var(--color-primary-100)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-primary-300)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <span style={{ fontSize: '2rem' }}>🏛️</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 'var(--text-base)', color: 'var(--color-primary-900)' }}>
            Obrigatoriedade e Conformidade Fiscal
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-800)', marginTop: '2px' }}>
            Válido para produtores pessoas físicas com receita bruta da atividade rural superior a R$ 4.800.000,00. Todos os lançamentos estão vinculados ao CAFIR e CAR da propriedade.
          </div>
        </div>
      </div>

      {/* Fiscal KPIs */}
      <div className="grid-3">
        <KpiCard
          label="Total de Receitas da Atividade Rural"
          value={`R$ ${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="💰"
          iconColor="green"
          subtext="Entradas tributáveis"
        />
        <KpiCard
          label="Total de Despesas (Custeio e Investimento)"
          value={`R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="💳"
          iconColor="red"
          subtext="Deduções autorizadas pela RFB"
        />
        <KpiCard
          label="Resultado Líquido Apurado no Livro Caixa"
          value={`R$ ${saldoFiscal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="📊"
          iconColor="blue"
          subtext="Base de apuração do IRPF"
        />
      </div>

      {/* Imóveis Rurais Cadastrados */}
      <ClayCard>
        <div className="card-header">
          <div>
            <h2 className="card-title">Cadastro dos Imóveis Rurais (Registro 0030)</h2>
            <p className="card-subtitle">Identificação cadastral com SNCR, CAFIR e CAR</p>
          </div>
        </div>

        <div
          className="flex-between"
          style={{
            padding: 'var(--space-4)',
            background: 'var(--bg-surface-2)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="flex-col" style={{ gap: '2px' }}>
            <div style={{ fontWeight: 'bold', fontSize: 'var(--text-base)' }}>
              Cód 001 — {activeFarm.name}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              CAFIR: 1234567-8 • Município: {activeFarm.location} • Área: {activeFarm.totalArea} ha
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              CAR: {activeFarm.carNumber}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge--success">Exploração Individual (100%)</span>
          </div>
        </div>
      </ClayCard>

      {/* Classified Bookkeeping Ledger */}
      <ClayCard>
        <div className="card-header">
          <div>
            <h2 className="card-title">Lançamentos do Livro Caixa (Registro Q100)</h2>
            <p className="card-subtitle">Classificação padronizada por documento, participante e tipo de despesa</p>
          </div>
        </div>

        <div className="clay-table-wrapper">
          <table className="clay-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo / Doc</th>
                <th>Histórico do Lançamento</th>
                <th>CPF / CNPJ Participante</th>
                <th>Classificação RFB</th>
                <th style={{ textAlign: 'right' }}>Valor (R$)</th>
                <th style={{ textAlign: 'center' }}>E/S</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item) => (
                <tr key={item.id}>
                  <td className="td-date">{item.date}</td>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: 'var(--text-xs)' }}>
                      {item.docNumber}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                      {item.docType}
                    </div>
                  </td>
                  <td style={{ maxWidth: '280px' }}>{item.history}</td>
                  <td style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}>
                    {item.participantDoc}
                  </td>
                  <td>
                    <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                      {item.entryType}
                    </span>
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      color: item.balanceType === 'E' ? 'var(--color-primary-700)' : 'var(--color-secondary-700)',
                    }}
                  >
                    {item.balanceType === 'E' ? '+' : '-'} R${' '}
                    {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`badge ${
                        item.balanceType === 'E' ? 'badge--success' : 'badge--warning'
                      }`}
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                    >
                      {item.balanceType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ClayCard>

      {/* Preview Modal for Layout .txt */}
      {isPreviewModalOpen && (
        <ClayModal
          isOpen={true}
          onClose={() => setIsPreviewModalOpen(false)}
          title="Prévia do Arquivo LCDPR (Layout 1.3)"
          subtitle="Formato oficial delimitado por pipes (|) para validação no PVA da Receita Federal"
          maxWidth="700px"
        >
          <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
            <pre
              style={{
                background: '#221e19',
                color: '#89ad79',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                lineHeight: 1.6,
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: '340px',
              }}
            >
              {generatedTxtContent}
            </pre>

            <div className="modal__footer">
              <ClayButton variant="ghost" onClick={() => setIsPreviewModalOpen(false)}>
                Fechar
              </ClayButton>
              <ClayButton variant="primary" onClick={handleDownloadTxt}>
                📥 Baixar Arquivo .TXT
              </ClayButton>
            </div>
          </div>
        </ClayModal>
      )}
    </div>
  );
}
