'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClaySelect } from '../../components/ui/ClaySelect';
import { ClayModal } from '../../components/ui/ClayModal';
import { uploadAndParseBankStatement, autoMatchTransactions } from '../../actions/conciliacao';
import { useModuleGuard } from '../../lib/useModuleGuard';
import { AppShellSkeleton } from '../../components/layout/AppShellSkeleton';
import { BankStatementItem } from '../../lib/types';
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
  Link2,
} from 'lucide-react';

export default function ConciliacaoPage() {
  const moduleAllowed = useModuleGuard('conciliacao');
  const { bankAccounts, bankStatements, payables, receivables, matchStatement, reloadFromDB } =
    useFarm();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedBankId, setSelectedBankId] = useState<string>(
    bankAccounts[0]?.id || 'bnk-00000000-0001'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchModalStatement, setMatchModalStatement] = useState<BankStatementItem | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isConfirmingMatch, setIsConfirmingMatch] = useState(false);

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

  // Candidates for the manual N:M match modal: opposite-sign, unsettled entries
  // that could plausibly compose the statement line's amount.
  const matchCandidates = useMemo(() => {
    if (!matchModalStatement) return [];
    if (matchModalStatement.amount < 0) {
      return payables
        .filter((p) => p.status !== 'pago' && p.status !== 'cancelado')
        .map((p) => ({ id: p.id, label: p.description, amount: Number(p.amount) }));
    }
    return receivables
      .filter((r) => r.status !== 'pago')
      .map((r) => ({ id: r.id, label: r.description, amount: Number(r.totalAmount) }));
  }, [matchModalStatement, payables, receivables]);

  const selectedTotal = useMemo(
    () =>
      matchCandidates
        .filter((c) => selectedCandidateIds.includes(c.id))
        .reduce((sum, c) => sum + c.amount, 0),
    [matchCandidates, selectedCandidateIds]
  );

  const openMatchModal = (stmt: BankStatementItem) => {
    setMatchModalStatement(stmt);
    setSelectedCandidateIds([]);
  };

  const toggleCandidate = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleConfirmMatch = async () => {
    if (!matchModalStatement || selectedCandidateIds.length === 0) return;
    setIsConfirmingMatch(true);
    try {
      await matchStatement(matchModalStatement.id, selectedCandidateIds);
      addToast({
        type: 'success',
        title: 'Lançamento Conciliado',
        message:
          selectedCandidateIds.length > 1
            ? `Extrato vinculado a ${selectedCandidateIds.length} lançamentos do sistema.`
            : 'Extrato vinculado com sucesso.',
      });
      setMatchModalStatement(null);
      setSelectedCandidateIds([]);
    } catch (err) {
      console.error(err);
      addToast({ type: 'danger', title: 'Erro', message: 'Não foi possível confirmar o vínculo.' });
    } finally {
      setIsConfirmingMatch(false);
    }
  };

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

  if (!moduleAllowed) {
    return <AppShellSkeleton />;
  }

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
        <div className="flex-row flex-wrap" style={{ gap: 'var(--space-2)' }}>
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
        <FolderOpen
          size={40}
          color="var(--color-primary-600)"
          style={{ margin: '0 auto var(--space-2)' }}
        />
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
                  <td
                    style={{
                      fontWeight: '600',
                      maxWidth: '240px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.description}
                  </td>
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
                    {item.matchedTransactionIds && item.matchedTransactionIds.length > 1 ? (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        <Link2 size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                        {item.matchedTransactionIds.length} lançamentos combinados (N:M)
                      </span>
                    ) : item.matchedTransactionId ? (
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
                      <ClayButton variant="primary" size="sm" onClick={() => openMatchModal(item)}>
                        Vincular
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

      {/* Manual N:M Match Modal */}
      <ClayModal
        isOpen={!!matchModalStatement}
        onClose={() => setMatchModalStatement(null)}
        title="Vincular Lançamento do Extrato"
        subtitle={
          matchModalStatement
            ? `${matchModalStatement.description} • R$ ${matchModalStatement.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : undefined
        }
        maxWidth="640px"
        footer={
          <>
            <ClayButton variant="ghost" onClick={() => setMatchModalStatement(null)}>
              Cancelar
            </ClayButton>
            <ClayButton
              variant="primary"
              onClick={handleConfirmMatch}
              disabled={selectedCandidateIds.length === 0 || isConfirmingMatch}
            >
              <Check size={15} style={{ marginRight: '6px' }} />
              {isConfirmingMatch
                ? 'Vinculando...'
                : selectedCandidateIds.length > 1
                  ? `Vincular ${selectedCandidateIds.length} Lançamentos (N:M)`
                  : 'Confirmar Vínculo'}
            </ClayButton>
          </>
        }
      >
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
          Selecione um ou mais lançamentos do sistema que, somados, correspondem a esta transação
          bancária. Útil quando um único TED/PIX liquida várias contas de uma vez.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--bg-surface-2)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '12px',
            fontSize: 'var(--text-sm)',
          }}
        >
          <span>
            Selecionado: <strong>{selectedCandidateIds.length}</strong> lançamento(s) — R${' '}
            {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          {matchModalStatement && (
            <span
              style={{
                fontWeight: 700,
                color:
                  Math.abs(selectedTotal - Math.abs(matchModalStatement.amount)) < 0.05
                    ? 'var(--color-primary-700)'
                    : 'var(--color-secondary-700)',
              }}
            >
              {Math.abs(selectedTotal - Math.abs(matchModalStatement.amount)) < 0.05
                ? '✓ Soma confere'
                : `Diferença: R$ ${(Math.abs(matchModalStatement.amount) - selectedTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </span>
          )}
        </div>

        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {matchCandidates.length === 0 && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: '16px 0' }}>
              Nenhum lançamento em aberto compatível encontrado.
            </p>
          )}
          {matchCandidates.map((c) => (
            <label
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-neutral-200)',
                background: selectedCandidateIds.includes(c.id)
                  ? 'var(--color-primary-50, #EAF3ED)'
                  : 'var(--bg-surface-1)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={selectedCandidateIds.includes(c.id)}
                onChange={() => toggleCandidate(c.id)}
              />
              <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{c.label}</span>
              <span className="td-money" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </label>
          ))}
        </div>
      </ClayModal>
    </div>
  );
}
