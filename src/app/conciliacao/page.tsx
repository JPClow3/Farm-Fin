'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClaySelect } from '../../components/ui/ClaySelect';
import {
  uploadAndParseBankStatement,
  autoMatchTransactions,
  confirmStatementMatch,
} from '../../actions/conciliacao';
import {
  Download,
  UploadCloud,
  Zap,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Check,
} from 'lucide-react';

export default function ConciliacaoPage() {
  const { bankAccounts, bankStatements, matchStatement, reloadFromDB } = useFarm();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedBankId, setSelectedBankId] = useState<string>(
    bankAccounts[0]?.id || 'bnk-00000000-0001'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const selectedBank = useMemo(() => {
    return bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];
  }, [bankAccounts, selectedBankId]);

  const bankItems = useMemo(() => {
    return bankStatements.filter(
      (stmt) => !stmt.bankAccountId || stmt.bankAccountId === selectedBankId
    );
  }, [bankStatements, selectedBankId]);

  const matchedCount = bankItems.filter((item) => item.matched).length;
  const pendingCount = bankItems.filter((item) => !item.matched).length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const res = await uploadAndParseBankStatement({
        bankAccountId: selectedBankId || bankAccounts[0]?.id,
        fileContent: text,
        fileName: file.name,
      });

      if (res.success) {
        addToast({
          type: 'success',
          title: 'Extrato Importado!',
          message: res.message || `${res.count} lançamentos importados com sucesso.`,
        });
        await reloadFromDB();
      } else {
        addToast({
          type: 'danger',
          title: 'Falha na Importação',
          message: res.error || 'Não foi possível interpretar o arquivo de extrato.',
        });
      }
    } catch (err) {
      console.error('Error reading file:', err);
      addToast({ type: 'danger', title: 'Erro', message: 'Erro ao processar arquivo.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSimulateOfxUpload = async () => {
    setIsUploading(true);
    const demoOfx = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<DTSERVER>20260814120000
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>001
<ACCTID>28475-9
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20260701120000
<DTEND>20260814120000
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260728120000
<TRNAMT>480000.00
<FITID>20260728001
<MEMO>TED RECEBIDA AMAGGI EXPORTACAO
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260719120000
<TRNAMT>-210000.00
<FITID>20260719002
<MEMO>PAGTO BOLETO SYNGENTA PROTECAO
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260810120000
<TRNAMT>-88500.00
<FITID>20260810003
<MEMO>PIX ENVIADO BAYER CROPSCIENCE
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260812120000
<TRNAMT>-92400.00
<FITID>20260812004
<MEMO>DEBITO TRR PETROLEO DIESEL
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>845230.00
<DTASOF>20260814120000
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

    try {
      const res = await uploadAndParseBankStatement({
        bankAccountId: selectedBankId || bankAccounts[0]?.id,
        fileContent: demoOfx,
        fileName: 'extrato_agro_2026.ofx',
      });

      if (res.success) {
        addToast({
          type: 'success',
          title: 'Extrato OFX Importado!',
          message: `${res.count} lançamentos bancários carregados e salvos no banco.`,
        });
        await reloadFromDB();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAutoMatchAll = async () => {
    setIsMatching(true);
    try {
      const res = await autoMatchTransactions(selectedBankId);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Conciliação Automática Concluída!',
          message: res.message || 'Lançamentos bancários conferidos com sucesso.',
        });
        await reloadFromDB();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMatching(false);
    }
  };

  const handleManualMatch = async (statementId: string) => {
    await matchStatement(statementId, 'manual-match');
    addToast({
      type: 'info',
      title: 'Item Conciliado Manualmente',
      message: 'Lançamento bancário conciliado no banco de dados.',
    });
  };

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".ofx,.csv,.txt"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Conciliação Bancária</h1>
          <p className="page-subtitle">
            Importação real de arquivos OFX/CSV, motor de auto-matching com lançamentos e
            conferência de saldo
          </p>
        </div>
        <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
          <ClayButton variant="ghost" onClick={handleSimulateOfxUpload} disabled={isUploading}>
            <Download size={15} style={{ marginRight: '6px' }} />
            {isUploading ? 'Importando...' : 'Carregar Extrato Demo (OFX)'}
          </ClayButton>
          <ClayButton
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <UploadCloud size={15} style={{ marginRight: '6px' }} />
            Importar OFX / CSV
          </ClayButton>
          <ClayButton variant="primary" onClick={handleAutoMatchAll} disabled={isMatching}>
            <Zap size={15} style={{ marginRight: '6px' }} />
            {isMatching ? 'Processando...' : 'Conciliar Tudo (Auto-Match)'}
          </ClayButton>
        </div>
      </div>

      {/* Bank Selector Bar */}
      <ClayCard size="sm">
        <div className="flex-between flex-wrap" style={{ gap: 'var(--space-4)' }}>
          <div className="flex-row" style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
            <Building2 size={22} color="var(--color-primary-600)" />
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
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Saldo Registrado no Sistema
              </div>
              <div className="td-money" style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
                R${' '}
                {selectedBank?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ||
                  '0,00'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Saldo no Extrato OFX
              </div>
              <div
                className="td-money"
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'bold',
                  color: 'var(--color-primary-700)',
                }}
              >
                R${' '}
                {selectedBank?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ||
                  '0,00'}
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
          icon={<FileText size={20} />}
          iconColor="blue"
          subtext="Último período bancário"
        />
        <KpiCard
          label="Transações Conciliadas"
          value={`${matchedCount} itens`}
          icon={<CheckCircle2 size={20} />}
          iconColor="green"
          subtext="Saldos conferidos e validados"
        />
        <KpiCard
          label="Pendências de Match"
          value={`${pendingCount} itens`}
          icon={<AlertTriangle size={20} />}
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
        onClick={() => fileInputRef.current?.click()}
      >
        <FolderOpen size={40} color="var(--color-primary-600)" style={{ margin: '0 auto var(--space-2)' }} />
        <h3
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}
        >
          Arraste e solte o arquivo de extrato bancário (.OFX ou .CSV)
        </h3>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            marginBottom: 'var(--space-4)',
          }}
        >
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
              O motor de correspondência identifica automaticamente contas a pagar e receber por
              valor e proximidade de data
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
                      color:
                        item.amount >= 0
                          ? 'var(--color-primary-700)'
                          : 'var(--color-secondary-700)',
                    }}
                  >
                    {item.amount >= 0 ? '+' : ''} R${' '}
                    {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    {item.matchedTransactionId ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        ✓ Lançamento #{item.matchedTransactionId.slice(0, 8)}... (Correspondência
                        encontrada)
                      </span>
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        Sem vínculo direto
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
              {bankItems.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}
                  >
                    Nenhum extrato importado para esta conta bancária. Importe um arquivo .OFX ou
                    .CSV para iniciar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ClayCard>
    </div>
  );
}
