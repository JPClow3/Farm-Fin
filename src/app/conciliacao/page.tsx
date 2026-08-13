'use client';

import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClaySelect } from '../../components/ui/ClaySelect';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function ConciliacaoPage() {
  const { bankAccounts, bankStatements, matchStatement } = useFarm();
  const { addToast } = useToast();

  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || 'bank-1');
  const [isUploading, setIsUploading] = useState(false);

  const selectedBank = useMemo(() => {
    return bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];
  }, [bankAccounts, selectedBankId]);

  const bankItems = useMemo(() => {
    return bankStatements.filter((stmt) => stmt.bankAccountId === selectedBankId);
  }, [bankStatements, selectedBankId]);

  const matchedCount = bankItems.filter((item) => item.matched).length;
  const pendingCount = bankItems.filter((item) => !item.matched).length;

  const handleSimulateOfxUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      addToast({
        type: 'success',
        title: 'Extrato OFX Importado!',
        message: `Extrato do ${selectedBank.bankName} carregado com sucesso (${bankItems.length} lançamentos encontrados).`,
      });
    }, 600);
  };

  const handleAutoMatchAll = () => {
    bankItems.forEach((item) => {
      if (!item.matched && item.matchedTransactionId) {
        matchStatement(item.id, item.matchedTransactionId);
      }
    });

    addToast({
      type: 'success',
      title: 'Conciliação Automática Concluída!',
      message: 'Todas as transações com correspondência confirmada foram conciliadas.',
    });
  };

  const handleManualMatch = (statementId: string) => {
    matchStatement(statementId, 'manual-match');
    addToast({
      type: 'info',
      title: 'Item Conciliado Manualmente',
      message: 'Lançamento bancário conciliado com o extrato do sistema.',
    });
  };

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Conciliação Bancária</h1>
          <p className="page-subtitle">
            Importação de arquivos OFX/CSV, match automático com lançamentos e conferência de saldo
          </p>
        </div>
        <div className="flex-row">
          <ClayButton variant="ghost" onClick={handleSimulateOfxUpload}>
            {isUploading ? 'Importando...' : '📥 Carregar Extrato Demo (OFX)'}
          </ClayButton>
          <ClayButton variant="primary" onClick={handleAutoMatchAll}>
            ⚡ Conciliar Tudo (Auto-Match)
          </ClayButton>
        </div>
      </div>

      {/* Bank Selector Bar */}
      <ClayCard size="sm">
        <div className="flex-between flex-wrap" style={{ gap: 'var(--space-4)' }}>
          <div className="flex-row" style={{ gap: 'var(--space-3)' }}>
            <span style={{ fontSize: '1.25rem' }}>🏦</span>
            <ClaySelect
              label="Conta Bancária Selecionada"
              options={bankAccounts.map((b) => ({
                value: b.id,
                label: `${b.bankName} (Ag: ${b.agency} • CC: ${b.accountNumber})`,
              }))}
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              style={{ minWidth: '320px', height: '40px' }}
            />
          </div>

          <div className="flex-row" style={{ gap: 'var(--space-6)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Saldo Registrado no Sistema</div>
              <div className="td-money" style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
                R$ {selectedBank.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Saldo no Extrato OFX</div>
              <div className="td-money" style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-primary-700)' }}>
                R$ {selectedBank.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </ClayCard>

      {/* KPIs */}
      <div className="grid-3">
        <KpiCard
          label="Itens no Extrato Importado"
          value={`${bankItems.length} transações`}
          icon="📄"
          iconColor="blue"
          subtext="Último período bancário"
        />
        <KpiCard
          label="Transações Conciliadas"
          value={`${matchedCount} itens`}
          icon="✓"
          iconColor="green"
          subtext="Saldos conferidos e validados"
        />
        <KpiCard
          label="Pendências de Match"
          value={`${pendingCount} itens`}
          icon="⚠️"
          iconColor="amber"
          subtext={pendingCount > 0 ? 'Aguardando revisão manual' : '100% conciliado'}
        />
      </div>

      {/* Upload Dropzone */}
      <div
        style={{
          padding: 'var(--space-8)',
          background: 'var(--bg-surface-1)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--clay-shadow-md)',
          border: '2px dashed var(--color-neutral-300)',
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={handleSimulateOfxUpload}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>📂</div>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Arraste e solte o arquivo de extrato bancário (.OFX ou .CSV)
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
          Suporte automático a Banco do Brasil, Sicredi, Sicoob, Bradesco, Santander e Itaú
        </p>
        <ClayButton variant="ghost" size="sm">
          Selecionar Arquivo do Computador
        </ClayButton>
      </div>

      {/* Statements Match Table */}
      <ClayCard>
        <div className="card-header">
          <div>
            <h2 className="card-title">Transações do Extrato vs Lançamentos do Sistema</h2>
            <p className="card-subtitle">
              O motor de IA identifica automaticamente contas a pagar e receber correspondentes por valor e data
            </p>
          </div>
        </div>

        <div className="clay-table-wrapper">
          <table className="clay-table">
            <thead>
              <tr>
                <th>Data Extrato</th>
                <th>Histórico no Banco</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th>Correspondência Identificada</th>
                <th style={{ textAlign: 'center' }}>Grau de Confiança</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {bankItems.map((item) => (
                <tr key={item.id}>
                  <td className="td-date">{item.date}</td>
                  <td style={{ fontWeight: '600', maxWidth: '240px' }}>{item.description}</td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      color: item.amount >= 0 ? 'var(--color-primary-700)' : 'var(--color-secondary-700)',
                    }}
                  >
                    {item.amount >= 0 ? '+' : ''} R${' '}
                    {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    {item.matchedTransactionId ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        ✓ Lançamento #{item.matchedTransactionId} (Valor idêntico)
                      </span>
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        Sem vínculo direto (Débito operacional)
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.confidenceScore ? (
                      <span className="badge badge--success" style={{ fontSize: '10px' }}>
                        Match {item.confidenceScore}%
                      </span>
                    ) : (
                      <span className="badge badge--neutral" style={{ fontSize: '10px' }}>
                        Manual
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.matched ? (
                      <span className="badge badge--pago">Conciliado</span>
                    ) : (
                      <span className="badge badge--pendente">Pendente</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!item.matched && (
                      <ClayButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleManualMatch(item.id)}
                      >
                        Confirmar
                      </ClayButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ClayCard>
    </div>
  );
}
