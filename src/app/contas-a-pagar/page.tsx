'use client';

import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { ClayInput } from '../../components/ui/ClayInput';
import { ClaySelect } from '../../components/ui/ClaySelect';
import { ClayTable, Column } from '../../components/ui/ClayTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ClayModal } from '../../components/ui/ClayModal';
import { ClayTabs } from '../../components/ui/ClayTabs';
import { AgingAnalysisView } from '../../components/finance/AgingAnalysisView';
import { DueDateAlertsBanner } from '../../components/finance/DueDateAlertsBanner';
import { Payable, RecurrencePattern, DueDateAlertCategory } from '../../lib/types';
import {
  getTodayDateString,
  addMonthsToDate,
  calculateDateDifferenceDays,
} from '../../lib/dateUtils';
import { calculateDueDateAlertSummary, getDueDateAlertCategory } from '../../lib/financeAlerts';
import { sendDueDateAlertsNotificationAction } from '../../actions/finance';
import { useModuleGuard } from '../../lib/useModuleGuard';
import { AppShellSkeleton } from '../../components/layout/AppShellSkeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  Plus,
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Paperclip,
  Pencil,
  Trash2,
  FileText,
  RefreshCw,
  Check,
  X,
  ShieldAlert,
  Repeat,
  Layers,
  ListFilter,
} from 'lucide-react';

export default function ContasAPagarPage() {
  const moduleAllowed = useModuleGuard('contas-a-pagar');
  const {
    activeFarmId,
    activeSeasonId,
    activePayables,
    activeReceivables,
    suppliers,
    activeFields,
    bankAccounts,
    addPayable,
    updatePayable,
    approvePayable,
    rejectPayable,
    payPayable,
    deletePayable,
    kpis,
  } = useFarm();

  const { addToast } = useToast();

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'lancamentos' | 'aging'>('lancamentos');

  // Filters State
  const [statusFilter, setStatusFilter] = useState<
    'todos' | 'pendente' | 'vencido' | 'aprovacao' | 'pago' | 'barter'
  >('todos');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [alertCategoryFilter, setAlertCategoryFilter] = useState<DueDateAlertCategory | null>(null);

  // Modals State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingPayable, setEditingPayable] = useState<Payable | null>(null);
  const [payingPayable, setPayingPayable] = useState<Payable | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<Payable | null>(null);
  const [rejectingPayable, setRejectingPayable] = useState<Payable | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [deletingPayable, setDeletingPayable] = useState<Payable | null>(null);

  // New Payable Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => addMonthsToDate(todayStr, 0));
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [category, setCategory] = useState('Insumos > Fertilizantes');
  const [fieldId, setFieldId] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('1');
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('none');
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Edit Form State
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editFieldId, setEditFieldId] = useState('');

  // Payment Form State
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [discountInterest, setDiscountInterest] = useState('0');

  // Consolidated Due Date Alerts
  const alertsSummary = useMemo(() => {
    return calculateDueDateAlertSummary(activePayables, [], todayStr);
  }, [activePayables, todayStr]);

  // Filtered List
  const filteredPayables = useMemo(() => {
    return activePayables.filter((p) => {
      // Alert chip filter override if clicked
      if (alertCategoryFilter) {
        const cat = getDueDateAlertCategory(p.dueDate, p.status, todayStr);
        if (cat !== alertCategoryFilter) return false;
      }

      let matchStatus = true;
      if (statusFilter === 'vencido') {
        matchStatus = p.status === 'vencido' || (p.status === 'pendente' && p.dueDate < todayStr);
      } else if (statusFilter === 'aprovacao') {
        matchStatus =
          p.requiresApproval === true &&
          p.approvalStatus !== 'aprovado' &&
          p.status !== 'pago' &&
          p.status !== 'cancelado';
      } else if (statusFilter === 'barter') {
        matchStatus =
          p.isBarter ||
          p.barterStatus === 'vinculado' ||
          p.barterStatus === 'liquidado' ||
          !!p.linkedReceivableId;
      } else if (statusFilter !== 'todos') {
        matchStatus = p.status === statusFilter;
      }

      const matchSupplier = !supplierFilter || p.supplierId === supplierFilter;
      const matchSearch =
        !searchTerm ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchStatus && matchSupplier && matchSearch;
    });
  }, [activePayables, statusFilter, supplierFilter, searchTerm, alertCategoryFilter, todayStr]);

  // Handlers
  const handleCreatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
    if (!description || numAmount <= 0) {
      addToast({
        type: 'warning',
        title: 'Erro',
        message: 'Preencha a descrição e valor válidos.',
      });
      return;
    }

    const selectedSup = suppliers.find((s) => s.id === supplierId) || suppliers[0];
    const totalInst = parseInt(installmentsCount, 10) || 1;

    await addPayable({
      farmId: activeFarmId,
      cropSeasonId: activeSeasonId,
      fieldId: fieldId || undefined,
      supplierId: selectedSup?.id || '',
      supplierName: selectedSup?.name || 'Fornecedor',
      category,
      description,
      amount: numAmount,
      dueDate,
      status: requiresApproval ? 'pendente' : 'pendente',
      installmentsCount: totalInst,
      recurrencePattern,
      requiresApproval,
      approvalStatus: requiresApproval ? 'pendente' : 'aprovado',
      hasAttachment: true,
    });

    const recLabel =
      recurrencePattern !== 'none'
        ? ` recorrente (${recurrencePattern})`
        : totalInst > 1
          ? ` em ${totalInst} parcelas`
          : '';

    addToast({
      type: 'success',
      title: 'Lançamento Criado!',
      message: `Conta cadastrada${recLabel} para ${selectedSup?.name || 'Fornecedor'}${requiresApproval ? ' (Aguardando Aprovação)' : ''}.`,
    });

    setIsNewModalOpen(false);
    setDescription('');
    setAmount('');
    setRecurrencePattern('none');
    setRequiresApproval(false);
  };

  const handleApprove = async (p: Payable) => {
    await approvePayable(p.id, 'Diretoria Financeira');
    addToast({
      type: 'success',
      title: 'Conta Aprovada!',
      message: `A despesa "${p.description}" foi aprovada e está liberada para pagamento.`,
    });
  };

  const handleOpenReject = (p: Payable) => {
    setRejectingPayable(p);
    setRejectionReasonText('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayable) return;
    if (!rejectionReasonText.trim()) {
      addToast({
        type: 'warning',
        title: 'Justificativa Necessária',
        message: 'Por favor, informe o motivo da rejeição.',
      });
      return;
    }

    await rejectPayable(rejectingPayable.id, rejectionReasonText, 'Diretoria Financeira');
    addToast({
      type: 'info',
      title: 'Conta Rejeitada',
      message: `A despesa foi cancelada com a justificativa: "${rejectionReasonText}".`,
    });

    setRejectingPayable(null);
    setRejectionReasonText('');
  };

  const handleDispatchAlerts = async (channel: 'email' | 'push' | 'whatsapp') => {
    const res = await sendDueDateAlertsNotificationAction(channel, activeFarmId);
    if (res.success && res.data) {
      addToast({
        type: 'success',
        title: 'Notificações Enviadas',
        message: res.data.message,
      });
    }
  };

  const handleOpenEdit = (p: Payable) => {
    setEditingPayable(p);
    setEditDescription(p.description);
    setEditAmount(String(p.amount));
    setEditDueDate(p.dueDate);
    setEditCategory(p.category);
    setEditFieldId(p.fieldId || '');
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayable) return;

    const numAmount =
      parseFloat(editAmount.replace(/\./g, '').replace(',', '.')) || editingPayable.amount;

    await updatePayable(editingPayable.id, {
      description: editDescription,
      amount: numAmount,
      dueDate: editDueDate,
      category: editCategory,
      fieldId: editFieldId || undefined,
    });

    addToast({
      type: 'success',
      title: 'Conta Atualizada!',
      message: `Alterações em "${editDescription}" salvas com sucesso.`,
    });

    setEditingPayable(null);
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayable) return;

    if (payingPayable.requiresApproval && payingPayable.approvalStatus !== 'aprovado') {
      addToast({
        type: 'warning',
        title: 'Aprovação Pendente',
        message: 'Esta despesa requer aprovação da diretoria antes do pagamento.',
      });
      return;
    }

    const diff = parseFloat(discountInterest.replace(/\./g, '').replace(',', '.')) || 0;
    const finalAmount = Math.max(0, payingPayable.amount + diff);
    const bankId = selectedBankAccountId || bankAccounts[0]?.id;

    await payPayable(payingPayable.id, bankId, finalAmount, paymentDate);

    addToast({
      type: 'success',
      title: 'Pagamento Concluído!',
      message: `Baixa de R$ ${finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} realizada com sucesso.`,
    });

    setPayingPayable(null);
  };

  const columns: Column<Payable>[] = [
    {
      key: 'description',
      header: 'Descrição / Documento',
      render: (row) => {
        const linkedRec = activeReceivables.find((r) => r.id === row.linkedReceivableId);
        const isBarterRow =
          row.isBarter ||
          row.barterStatus === 'vinculado' ||
          row.barterStatus === 'liquidado' ||
          !!row.linkedReceivableId;
        const isRecRow =
          row.isRecurring || (row.recurrencePattern && row.recurrencePattern !== 'none');

        return (
          <div className="flex-col" style={{ gap: '2px' }}>
            <div className="flex-row items-center" style={{ gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {row.description}
              </span>
              {isRecRow && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    background: '#ede9fe',
                    color: '#5b21b6',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                  title={`Despesa Recorrente (${row.recurrencePattern})`}
                >
                  <Repeat size={10} />
                  Recorrente
                </span>
              )}
              {isBarterRow && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <RefreshCw size={10} />
                  Barter {row.barterStatus === 'liquidado' ? 'Liquidado' : 'Vinculado'}
                </span>
              )}
            </div>
            <div
              className="flex-row items-center"
              style={{ gap: '6px', fontSize: '11px', color: 'var(--text-tertiary)' }}
            >
              <span>{row.category}</span>
              {row.installments && <span>• Parc: {row.installments}</span>}
              {linkedRec && (
                <span style={{ color: '#0369a1', fontWeight: '500' }}>
                  • Venda de Grãos: {linkedRec.description}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'supplierName',
      header: 'Fornecedor',
      render: (row) => (
        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{row.supplierName}</span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Vencimento',
      render: (row) => {
        const isOverdue =
          row.status === 'vencido' || (row.status === 'pendente' && row.dueDate < todayStr);
        const isToday = row.status === 'pendente' && row.dueDate === todayStr;

        return (
          <span
            className="td-date"
            style={{
              fontWeight: isOverdue || isToday ? 'bold' : 'normal',
              color: isOverdue
                ? 'var(--color-danger)'
                : isToday
                  ? 'var(--color-warning-dark)'
                  : undefined,
            }}
          >
            {row.dueDate}
            {isToday && <span style={{ fontSize: '10px', marginLeft: '4px' }}>(Hoje)</span>}
          </span>
        );
      },
    },
    {
      key: 'amount',
      header: 'Valor',
      align: 'right',
      render: (row) => (
        <span className="td-money" style={{ color: 'var(--text-primary)' }}>
          R$ {row.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status & Aprovação',
      align: 'center',
      render: (row) => {
        if (row.requiresApproval && row.approvalStatus !== 'aprovado' && row.status !== 'pago') {
          return (
            <div className="flex-col" style={{ alignItems: 'center', gap: '2px' }}>
              <StatusBadge
                status={row.approvalStatus === 'rejeitado' ? 'rejeitado' : 'aguardando_aprovacao'}
              />
              {row.rejectionReason && (
                <span
                  style={{ fontSize: '10px', color: 'var(--color-danger)' }}
                  title={row.rejectionReason}
                >
                  Motivo informado
                </span>
              )}
            </div>
          );
        }
        return <StatusBadge status={row.status} />;
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) => {
        const isPendingApproval =
          row.requiresApproval && row.approvalStatus === 'pendente' && row.status !== 'pago';
        const isRejected = row.approvalStatus === 'rejeitado' || row.status === 'cancelado';

        return (
          <div
            className="flex-row"
            style={{ justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}
          >
            {/* Quick Approval Actions */}
            {isPendingApproval && (
              <>
                <ClayButton
                  variant="primary"
                  size="sm"
                  title="Aprovar Despesa"
                  onClick={() => handleApprove(row)}
                  style={{
                    background: '#059669',
                    borderColor: '#059669',
                    padding: '4px 8px',
                    fontSize: '11px',
                    height: '28px',
                  }}
                >
                  <Check size={13} style={{ marginRight: '2px' }} />
                  Aprovar
                </ClayButton>
                <ClayButton
                  variant="ghost"
                  size="sm"
                  title="Rejeitar Despesa"
                  onClick={() => handleOpenReject(row)}
                  style={{ color: '#dc2626', padding: '4px 8px', fontSize: '11px', height: '28px' }}
                >
                  <X size={13} style={{ marginRight: '2px' }} />
                  Rejeitar
                </ClayButton>
              </>
            )}

            {row.hasAttachment && (
              <ClayButton
                variant="ghost"
                size="sm"
                iconOnly
                title="Ver Comprovante / NF"
                onClick={() => setViewingAttachment(row)}
              >
                <Paperclip size={15} />
              </ClayButton>
            )}
            <ClayButton
              variant="ghost"
              size="sm"
              iconOnly
              title="Editar Conta"
              onClick={() => handleOpenEdit(row)}
            >
              <Pencil size={15} />
            </ClayButton>
            {row.status !== 'pago' && !isRejected && (
              <ClayButton
                variant="primary"
                size="sm"
                disabled={isPendingApproval}
                title={
                  isPendingApproval ? 'Requer aprovação antes de pagar' : 'Dar baixa no pagamento'
                }
                onClick={() => {
                  if (isPendingApproval) {
                    addToast({
                      type: 'warning',
                      title: 'Aprovação Pendente',
                      message: 'Esta despesa requer aprovação da diretoria antes do pagamento.',
                    });
                    return;
                  }
                  setPayingPayable(row);
                  setSelectedBankAccountId(bankAccounts[0]?.id || '');
                }}
              >
                Baixar
              </ClayButton>
            )}
            <ClayButton
              variant="ghost"
              size="sm"
              iconOnly
              title="Excluir Lançamento"
              onClick={() => setDeletingPayable(row)}
            >
              <Trash2 size={15} />
            </ClayButton>
          </div>
        );
      },
    },
  ];

  if (!moduleAllowed) {
    return <AppShellSkeleton />;
  }

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Contas a Pagar</h1>
          <p className="page-subtitle">
            Controle de compromissos, parcelamentos automáticos, vencimentos e baixas financeiras
            integradas
          </p>
        </div>
        <ClayButton variant="primary" onClick={() => setIsNewModalOpen(true)}>
          <Plus size={16} style={{ marginRight: '6px' }} />
          Nova Conta a Pagar
        </ClayButton>
      </div>

      {/* KPIs Grid */}
      <div className="grid-4">
        <KpiCard
          label="Total a Pagar (Aberto)"
          value={`R$ ${kpis.totalPendingPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CreditCard size={20} />}
          iconColor="amber"
          subtext="Contas pendentes na safra"
        />
        <KpiCard
          label="Contas Vencidas"
          value={`R$ ${kpis.totalOverduePayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<AlertTriangle size={20} />}
          iconColor="red"
          subtext={`${kpis.overduePayablesCount} conta(s) em atraso`}
        />
        <KpiCard
          label="Vencem Hoje"
          value={`R$ ${kpis.totalDueTodayPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Clock size={20} />}
          iconColor="terra"
          subtext="Atenção ao prazo limite"
        />
        <KpiCard
          label="Total Pago no Mês"
          value={`R$ ${kpis.totalPaidThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CheckCircle2 size={20} />}
          iconColor="green"
          subtext="Baixas efetivadas"
        />
      </div>

      {/* Due Date Alerts Cockpit */}
      {alertsSummary.totalAlerts > 0 && (
        <DueDateAlertsBanner
          summary={alertsSummary}
          activeFilter={alertCategoryFilter}
          onFilterChange={(cat) => {
            setAlertCategoryFilter(cat);
            if (cat) setActiveTab('lancamentos');
          }}
          onDispatchAlerts={handleDispatchAlerts}
        />
      )}

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-color)',
          gap: 'var(--space-1)',
          marginBottom: '-2px',
        }}
      >
        {[
          { id: 'lancamentos', label: 'Lançamentos', icon: <ListFilter size={15} /> },
          { id: 'aging', label: 'Aging List (30/60/90+)', icon: <Layers size={15} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'lancamentos' | 'aging')}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderBottom:
                activeTab === tab.id
                  ? '2px solid var(--color-primary-600)'
                  : '2px solid transparent',
              background: 'none',
              color: activeTab === tab.id ? 'var(--color-primary-700)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? '700' : '500',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'lancamentos' && (
        <>
          {/* Filters Card */}
          <ClayCard size="sm">
            <div className="flex-between flex-wrap" style={{ gap: 'var(--space-4)' }}>
              {/* Quick Status Pills */}
              <div className="filter-pills">
                {(
                  [
                    { id: 'todos', label: 'Todas as Contas' },
                    { id: 'pendente', label: 'Pendentes' },
                    { id: 'vencido', label: 'Vencidas' },
                    { id: 'aprovacao', label: '🔐 Aguard. Aprovação' },
                    { id: 'pago', label: 'Pagas' },
                    { id: 'barter', label: '🔄 Barter Insumos' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`filter-pill ${
                      statusFilter === item.id
                        ? 'active'
                        : item.id === 'aprovacao' && kpis.pendingApprovalPayablesCount > 0
                          ? 'filter-pill--alert'
                          : ''
                    }`}
                    onClick={() => setStatusFilter(item.id)}
                    style={
                      item.id === 'aprovacao' && kpis.pendingApprovalPayablesCount > 0
                        ? { position: 'relative' }
                        : {}
                    }
                  >
                    {item.label}
                    {item.id === 'aprovacao' && kpis.pendingApprovalPayablesCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: '#dc2626',
                          color: '#fff',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {kpis.pendingApprovalPayablesCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search & Supplier Filter */}
              <div className="flex-row flex-wrap" style={{ gap: 'var(--space-3)' }}>
                <ClaySelect
                  options={[
                    { value: '', label: 'Todos os Fornecedores' },
                    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '220px',
                    height: '38px',
                    fontSize: 'var(--text-xs)',
                  }}
                />
                <ClayInput
                  placeholder="Buscar conta ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '240px',
                    height: '38px',
                    fontSize: 'var(--text-xs)',
                  }}
                />
              </div>
            </div>
          </ClayCard>

          {/* Table */}
          <ClayTable
            columns={columns}
            data={filteredPayables}
            keyExtractor={(p) => p.id}
            emptyMessage="Nenhuma conta a pagar encontrada com os filtros selecionados."
          />
        </>
      )}

      {activeTab === 'aging' && (
        <AgingAnalysisView
          items={activePayables}
          type="payable"
          onSelectAction={(p) => {
            setPayingPayable(p);
            setSelectedBankAccountId(bankAccounts[0]?.id || '');
            setActiveTab('lancamentos');
          }}
        />
      )}

      {/* Modal: Nova Conta a Pagar */}
      <ClayModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Nova Conta a Pagar"
        subtitle="Cadastre uma obrigação financeira com parcelamento automático no banco de dados"
      >
        <form onSubmit={handleCreatePayable} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Descrição da Despesa"
            placeholder="Ex: Compra de Fertilizante NPK 04-14-08"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="form-grid-2">
            <ClayInput
              label="Valor Total (R$)"
              placeholder="0,00"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <ClayInput
              label="Data do 1º Vencimento"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <ClaySelect
              label="Fornecedor"
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
            />
            <ClaySelect
              label="Condição de Pagamento"
              options={[
                { value: '1', label: 'À Vista (1 Parcela)' },
                { value: '2', label: 'Parcelado em 2x (30/60 dias)' },
                { value: '3', label: 'Parcelado em 3x (Safra)' },
                { value: '6', label: 'Parcelado em 6x (Semestral)' },
                { value: '12', label: 'Parcelado em 12x (Anual)' },
              ]}
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <ClaySelect
              label="Categoria Financeira"
              options={[
                { value: 'Insumos > Fertilizantes', label: 'Insumos > Fertilizantes' },
                { value: 'Insumos > Defensivos', label: 'Insumos > Defensivos' },
                { value: 'Insumos > Sementes', label: 'Insumos > Sementes' },
                { value: 'Combustíveis e Lubrificantes', label: 'Combustíveis e Lubrificantes' },
                { value: 'Manutenção de Maquinário', label: 'Manutenção de Maquinário' },
                { value: 'Arrendamento de Terras', label: 'Arrendamento de Terras' },
                { value: 'Despesas Administrativas', label: 'Despesas Administrativas' },
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <ClaySelect
              label="Talhão de Destino"
              options={[
                { value: '', label: 'Rateio Geral da Fazenda' },
                ...activeFields.map((f) => ({ value: f.id, label: `${f.name} (${f.area} ha)` })),
              ]}
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <ClaySelect
              label="Recorrência"
              options={[
                { value: 'none', label: 'Sem Recorrência (Avulso)' },
                { value: 'biweekly', label: 'Quinzenal (a cada 14 dias)' },
                { value: 'monthly', label: 'Mensal (todo mês)' },
                { value: 'quarterly', label: 'Trimestral' },
                { value: 'semiannual', label: 'Semestral' },
                { value: 'yearly', label: 'Anual' },
              ]}
              value={recurrencePattern}
              onChange={(e) => setRecurrencePattern(e.target.value as RecurrencePattern)}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                paddingBottom: '4px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${requiresApproval ? 'var(--color-primary-500)' : 'var(--border-color)'}`,
                  background: requiresApproval ? 'var(--color-primary-50)' : 'var(--bg-surface-2)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary-600)' }}
                />
                <div>
                  <div style={{ fontWeight: '600' }}>Exige Aprovação da Diretoria</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    Bloqueia o pagamento até aprovação
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsNewModalOpen(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              <ShieldAlert size={15} style={{ marginRight: '6px' }} />
              Salvar Conta no Banco de Dados
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Editar Conta */}
      {editingPayable && (
        <ClayModal
          isOpen={true}
          onClose={() => setEditingPayable(null)}
          title="Editar Conta a Pagar"
          subtitle={`Atualizar dados de ${editingPayable.description}`}
        >
          <form onSubmit={handleConfirmEdit} className="flex-col" style={{ gap: 'var(--space-4)' }}>
            <ClayInput
              label="Descrição"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              required
            />
            <div className="form-grid-2">
              <ClayInput
                label="Valor (R$)"
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
              />
              <ClayInput
                label="Data de Vencimento"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                required
              />
            </div>
            <div className="form-grid-2">
              <ClaySelect
                label="Categoria"
                options={[
                  { value: 'Insumos > Fertilizantes', label: 'Insumos > Fertilizantes' },
                  { value: 'Insumos > Defensivos', label: 'Insumos > Defensivos' },
                  { value: 'Insumos > Sementes', label: 'Insumos > Sementes' },
                  { value: 'Combustíveis e Lubrificantes', label: 'Combustíveis e Lubrificantes' },
                  { value: 'Manutenção de Maquinário', label: 'Manutenção de Maquinário' },
                  { value: 'Arrendamento de Terras', label: 'Arrendamento de Terras' },
                  { value: 'Despesas Administrativas', label: 'Despesas Administrativas' },
                ]}
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              />
              <ClaySelect
                label="Talhão"
                options={[
                  { value: '', label: 'Rateio Geral' },
                  ...activeFields.map((f) => ({ value: f.id, label: f.name })),
                ]}
                value={editFieldId}
                onChange={(e) => setEditFieldId(e.target.value)}
              />
            </div>
            <div className="modal__footer">
              <ClayButton type="button" variant="ghost" onClick={() => setEditingPayable(null)}>
                Cancelar
              </ClayButton>
              <ClayButton type="submit" variant="primary">
                Salvar Alterações
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}

      {/* Modal: Baixa de Pagamento */}
      {payingPayable && (
        <ClayModal
          isOpen={true}
          onClose={() => setPayingPayable(null)}
          title="Confirmar Baixa de Pagamento"
          subtitle={`Quitação de ${payingPayable.description}`}
        >
          <form onSubmit={handleConfirmPay} className="flex-col" style={{ gap: 'var(--space-4)' }}>
            <div
              style={{
                padding: 'var(--space-4)',
                background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div className="flex-between" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Fornecedor:
                </span>
                <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                  {payingPayable.supplierName}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Valor Original:
                </span>
                <span
                  className="td-money"
                  style={{ fontSize: 'var(--text-lg)', color: 'var(--color-primary-700)' }}
                >
                  R$ {payingPayable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <ClaySelect
              label="Conta Bancária de Saída (Débito)"
              options={bankAccounts.map((b) => ({
                value: b.id,
                label: `${b.bankName} (Saldo: R$ ${b.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
              }))}
              value={selectedBankAccountId || (bankAccounts[0]?.id ?? '')}
              onChange={(e) => setSelectedBankAccountId(e.target.value)}
              required
            />

            <div className="form-grid-2">
              <ClayInput
                label="Data Efetiva do Pagamento"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
              <ClayInput
                label="Juros (+) ou Desconto (-)"
                type="number"
                step="0.01"
                value={discountInterest}
                onChange={(e) => setDiscountInterest(e.target.value)}
                hint="Digite valor positivo para juros ou negativo para desconto"
              />
            </div>

            <div className="modal__footer">
              <ClayButton type="button" variant="ghost" onClick={() => setPayingPayable(null)}>
                Cancelar
              </ClayButton>
              <ClayButton type="submit" variant="primary">
                Efetivar Pagamento no Banco
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}

      {/* Modal: Visualizar Anexo */}
      {viewingAttachment && (
        <ClayModal
          isOpen={true}
          onClose={() => setViewingAttachment(null)}
          title="Documento Anexado"
          subtitle={`Comprovante vinculado a ${viewingAttachment.description}`}
        >
          <div
            className="flex-col"
            style={{ alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) 0' }}
          >
            <div
              style={{
                width: '100%',
                padding: 'var(--space-8)',
                background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-lg)',
                border: '2px dashed var(--color-neutral-300)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>📄</div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--text-base)' }}>
                NF-e_84920_{viewingAttachment.supplierName.replace(/\s+/g, '_')}.pdf
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  marginTop: '4px',
                }}
              >
                Valor: R${' '}
                {viewingAttachment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} •
                Vencimento: {viewingAttachment.dueDate}
              </div>
            </div>
            <ClayButton variant="ghost" onClick={() => setViewingAttachment(null)}>
              Fechar Visualização
            </ClayButton>
          </div>
        </ClayModal>
      )}

      {/* Modal: Rejeitar Conta / Despesa */}
      {rejectingPayable && (
        <ClayModal
          isOpen={true}
          onClose={() => setRejectingPayable(null)}
          title="Rejeitar Despesa"
          subtitle={`Informe a justificativa da rejeição para ${rejectingPayable.description}`}
        >
          <form
            onSubmit={handleConfirmReject}
            className="flex-col"
            style={{ gap: 'var(--space-4)' }}
          >
            <div
              style={{
                padding: 'var(--space-4)',
                background: '#fef2f2',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #fecaca',
              }}
            >
              <div className="flex-between" style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: '#991b1b', fontWeight: '600' }}>
                  Fornecedor:
                </span>
                <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', color: '#991b1b' }}>
                  {rejectingPayable.supplierName}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: 'var(--text-xs)', color: '#991b1b', fontWeight: '600' }}>
                  Valor:
                </span>
                <span style={{ fontWeight: '800', fontSize: 'var(--text-base)', color: '#991b1b' }}>
                  R$ {rejectingPayable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <ClayInput
              label="Justificativa da Rejeição / Cancelamento"
              placeholder="Ex: Valor divergente da cotação aprovada / Aguardando entrega técnica"
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              required
            />

            <div className="modal__footer">
              <ClayButton type="button" variant="ghost" onClick={() => setRejectingPayable(null)}>
                Cancelar
              </ClayButton>
              <ClayButton
                type="submit"
                variant="primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
              >
                Confirmar Rejeição
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}

      <ConfirmDialog
        isOpen={!!deletingPayable}
        onClose={() => setDeletingPayable(null)}
        onConfirm={async () => {
          if (!deletingPayable) return;
          await deletePayable(deletingPayable.id);
          addToast({
            type: 'info',
            title: 'Excluído',
            message: 'Lançamento removido do banco de dados.',
          });
          setDeletingPayable(null);
        }}
        title="Excluir Lançamento"
        description={
          deletingPayable
            ? `Tem certeza que deseja excluir "${deletingPayable.description}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
}
