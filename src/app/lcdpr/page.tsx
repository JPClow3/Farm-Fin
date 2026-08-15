'use client';

import React, { useState, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayModal } from '../../components/ui/ClayModal';
import { Skeleton, SkeletonKpiCard } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { getLCDPREntries, generateLCDPR, LCDPREntry } from '../../actions/lcdpr';
import { useModuleGuard } from '../../lib/useModuleGuard';
import { AppShellSkeleton } from '../../components/layout/AppShellSkeleton';
import {
  Landmark,
  FileCode2,
  Download,
  CircleDollarSign,
  CreditCard,
  BarChart3,
} from 'lucide-react';

export default function LcdprPage() {
  const moduleAllowed = useModuleGuard('lcdpr');
  const { activeFarm, activeFarmId } = useFarm();
  const { addToast } = useToast();

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [entries, setEntries] = useState<LCDPREntry[]>([]);
  const [totalReceitas, setTotalReceitas] = useState(0);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [saldoFiscal, setSaldoFiscal] = useState(0);
  const [generatedTxtContent, setGeneratedTxtContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadLCDPR = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [resEntries, resTxt] = await Promise.all([
        getLCDPREntries(activeFarmId, 2026),
        generateLCDPR(2026, activeFarmId),
      ]);

      if (resEntries.success) {
        setEntries(resEntries.entries);
        setTotalReceitas(resEntries.totalReceitas);
        setTotalDespesas(resEntries.totalDespesas);
        setSaldoFiscal(resEntries.saldoFiscal);
      } else {
        setEntries([]);
        setLoadError('Não foi possível apurar os lançamentos do Livro Caixa Digital.');
      }

      if (resTxt.success && resTxt.data) {
        setGeneratedTxtContent(resTxt.data.content);
      }
    } catch (err) {
      console.error('Failed to load LCDPR:', err);
      setEntries([]);
      setLoadError('Falha de comunicação ao carregar o LCDPR. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [activeFarmId]);

  useEffect(() => {
    loadLCDPR();
  }, [loadLCDPR]);

  const handleDownloadTxt = async () => {
    setIsDownloading(true);
    try {
      let txt = generatedTxtContent;
      if (!txt) {
        const res = await generateLCDPR(2026, activeFarmId);
        if (res.success && res.data) {
          txt = res.data.content;
        }
      }

      if (!txt) {
        addToast({
          type: 'warning',
          title: 'Nada para Gerar',
          message: 'Não há lançamentos suficientes para gerar o arquivo LCDPR.',
        });
        return;
      }

      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LCDPR_2026_${activeFarm?.name?.replace(/\s+/g, '_') || 'Fazenda'}_Layout1.3.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast({
        type: 'success',
        title: 'Arquivo LCDPR Gerado!',
        message:
          'Arquivo .txt gerado com sucesso em conformidade com a Receita Federal do Brasil (Layout 1.3).',
      });
    } catch (err) {
      console.error('Failed to generate LCDPR download:', err);
      addToast({
        type: 'danger',
        title: 'Erro ao Gerar Arquivo',
        message: 'Não foi possível gerar o arquivo LCDPR (.txt).',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!moduleAllowed) {
    return <AppShellSkeleton />;
  }

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Livro Caixa Digital do Produtor Rural (LCDPR)</h1>
          <p className="page-subtitle">
            Conformidade fiscal com a Receita Federal do Brasil (Layout Oficial 1.3 para e-CAC) com
            apuração direta do banco de dados
          </p>
        </div>
        <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
          <ClayButton variant="ghost" onClick={() => setIsPreviewModalOpen(true)}>
            <FileCode2 size={15} style={{ marginRight: '6px' }} />
            Visualizar Layout .TXT
          </ClayButton>
          <ClayButton
            variant="primary"
            onClick={handleDownloadTxt}
            loading={isDownloading}
            disabled={isLoading}
          >
            <Download size={15} style={{ marginRight: '6px' }} />
            Baixar Arquivo LCDPR (.txt)
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
        <Landmark size={28} color="var(--color-primary-800)" style={{ flexShrink: 0 }} />
        <div>
          <div
            style={{
              fontWeight: 'bold',
              fontSize: 'var(--text-base)',
              color: 'var(--color-primary-900)',
            }}
          >
            Obrigatoriedade e Conformidade Fiscal
          </div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-primary-800)',
              marginTop: '2px',
            }}
          >
            Válido para produtores pessoas físicas com receita bruta da atividade rural superior a
            R$ 4.800.000,00. Todos os lançamentos estão vinculados ao CAFIR e CAR da propriedade.
          </div>
        </div>
      </div>

      {/* Fiscal KPIs */}
      <div className="grid-3">
        <KpiCard
          loading={isLoading}
          label="Total de Receitas da Atividade Rural"
          value={`R$ ${totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CircleDollarSign size={20} />}
          iconColor="green"
          subtext="Entradas tributáveis"
        />
        <KpiCard
          loading={isLoading}
          label="Total de Despesas (Custeio e Investimento)"
          value={`R$ ${totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CreditCard size={20} />}
          iconColor="red"
          subtext="Deduções autorizadas pela RFB"
        />
        <KpiCard
          loading={isLoading}
          label="Resultado Líquido Apurado no Livro Caixa"
          value={`R$ ${saldoFiscal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<BarChart3 size={20} />}
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
              Cód 001 — {activeFarm?.name || 'Fazenda'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              CAFIR: 1234567-8 • Município: {activeFarm?.location || 'MT'} • Área:{' '}
              {activeFarm?.totalArea || 0} ha
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              CAR: {activeFarm?.carNumber || 'MT-5107909-ABCD'}
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
            <p className="card-subtitle">
              Classificação padronizada por documento, participante e tipo de despesa
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-col" style={{ gap: '10px' }}>
            <Skeleton variant="text" count={6} />
          </div>
        ) : loadError ? (
          <ErrorState
            title="Não foi possível carregar os lançamentos"
            description={loadError}
            onRetry={loadLCDPR}
          />
        ) : entries.length === 0 ? (
          <EmptyState
            title="Nenhum lançamento registrado em 2026"
            description="Ainda não há contas pagas ou recebidas classificadas para o Livro Caixa Digital deste ano."
          />
        ) : (
        <div className="clay-table-wrapper">
          <table className="clay-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo / Doc</th>
                <th>Histórico do Lançamento</th>
                <th>Participante / Doc</th>
                <th>Classificação RFB</th>
                <th style={{ textAlign: 'right' }}>Valor (R$)</th>
                <th style={{ textAlign: 'center' }}>E/S</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item) => (
                <tr key={item.id}>
                  <td className="td-date">{item.data}</td>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: 'var(--text-xs)' }}>
                      {item.numDoc}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                      {item.tipoDoc}
                    </div>
                  </td>
                  <td
                    style={{
                      maxWidth: '280px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.historico}
                  </td>
                  <td>
                    <div style={{ fontWeight: '500', fontSize: 'var(--text-xs)' }}>
                      {item.participante}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {item.cpfCnpj}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                      {item.tipoLancamento}
                    </span>
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      color:
                        item.tipo === 'E'
                          ? 'var(--color-primary-700)'
                          : 'var(--color-secondary-700)',
                    }}
                  >
                    {item.tipo === 'E' ? '+' : '-'} R${' '}
                    {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`badge ${item.tipo === 'E' ? 'badge--success' : 'badge--warning'}`}
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                    >
                      {item.tipo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
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
