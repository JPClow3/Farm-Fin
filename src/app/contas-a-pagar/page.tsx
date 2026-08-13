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
import { Payable } from '../../lib/types';
import { getTodayDateString, addMonthsToDate } from '../../lib/dateUtils';

export default function ContasAPagarPage() {
  const {
    activeFarmId,
    activeSeasonId,
    activePayables,
    suppliers,
    activeFields,
    bankAccounts,
    addPayable,
    updatePayable,
    payPayable,
    deletePayable,
    kpis,
  } = useFarm();

  const { addToast } = useToast();

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'vencido' | 'pago'>(
    'todos'
  );
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingPayable, setEditingPayable] = useState<Payable | null>(null);
  const [payingPayable, setPayingPayable] = useState<Payable | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<Payable | null>(null);

  // New Payable Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => addMonthsToDate(todayStr, 0));
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [category, setCategory] = useState('Insumos > Fertilizantes');
  const [fieldId, setFieldId] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('1');

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

  // Filtered List
  const filteredPayables = useMemo(() => {
    return activePayables.filter((p) => {
      const matchStatus =
        statusFilter === 'todos'
          ? true
          : statusFilter === 'vencido'
            ? p.status === 'vencido' || (p.status === 'pendente' && p.dueDate < todayStr)
            : p.status === statusFilter;

      const matchSupplier = !supplierFilter || p.supplierId === supplierFilter;
      const matchSearch =
        !searchTerm ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchStatus && matchSupplier && matchSearch;
    });
  }, [activePayables, statusFilter, supplierFilter, searchTerm, todayStr]);

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
      status: 'pendente',
      installmentsCount: totalInst,
      hasAttachment: true,
    });

    addToast({
      type: 'success',
      title: 'Lançamento Criado!',
      message: `${totalInst} parcela(s) lançada(s) para ${selectedSup?.name || 'Fornecedor'}.`,
    });

    setIsNewModalOpen(false);
    setDescription('');
    setAmount('');
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
      render: (row) => (
        <div className="flex-col" style={{ gap: '2px' }}>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{row.description}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{row.category}</span>
        </div>
      ),
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
        return (
          <span
            className="td-date"
            style={{
              fontWeight: isOverdue ? 'bold' : 'normal',
              color: isOverdue ? 'var(--color-danger)' : undefined,
            }}
          >
            {row.dueDate}
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
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'right',
      render: (row) => (
        <div className="flex-row" style={{ justifyContent: 'flex-end', gap: '6px' }}>
          {row.hasAttachment && (
            <ClayButton
              variant="ghost"
              size="sm"
              iconOnly
              title="Ver Comprovante / NF"
              onClick={() => setViewingAttachment(row)}
            >
              📎
            </ClayButton>
          )}
          <ClayButton
            variant="ghost"
            size="sm"
            iconOnly
            title="Editar Conta"
            onClick={() => handleOpenEdit(row)}
          >
            ✏️
          </ClayButton>
          {row.status !== 'pago' && (
            <ClayButton
              variant="primary"
              size="sm"
              onClick={() => {
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
            onClick={async () => {
              if (confirm('Tem certeza que deseja excluir esta conta?')) {
                await deletePayable(row.id);
                addToast({
                  type: 'info',
                  title: 'Excluído',
                  message: 'Lançamento removido do banco de dados.',
                });
              }
            }}
          >
            🗑️
          </ClayButton>
        </div>
      ),
    },
  ];

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
          ＋ Nova Conta a Pagar
        </ClayButton>
      </div>

      {/* KPIs Grid */}
      <div className="grid-4">
        <KpiCard
          label="Total a Pagar (Aberto)"
          value={`R$ ${kpis.totalPendingPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="💳"
          iconColor="amber"
          subtext="Contas pendentes na safra"
        />
        <KpiCard
          label="Contas Vencidas"
          value={`R$ ${kpis.totalOverduePayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="⚠️"
          iconColor="red"
          subtext={`${kpis.overduePayablesCount} conta(s) em atraso`}
        />
        <KpiCard
          label="Vencem Hoje"
          value={`R$ ${kpis.totalDueTodayPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="⏰"
          iconColor="terra"
          subtext="Atenção ao prazo limite"
        />
        <KpiCard
          label="Total Pago no Mês"
          value={`R$ ${kpis.totalPaidThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="✓"
          iconColor="green"
          subtext="Baixas efetivadas"
        />
      </div>

      {/* Filters Card */}
      <ClayCard size="sm">
        <div className="flex-between flex-wrap" style={{ gap: 'var(--space-4)' }}>
          {/* Quick Status Pills */}
          <div className="filter-pills">
            {(['todos', 'pendente', 'vencido', 'pago'] as const).map((st) => (
              <button
                key={st}
                type="button"
                className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'todos'
                  ? 'Todas as Contas'
                  : st === 'pendente'
                    ? 'Pendentes'
                    : st === 'vencido'
                      ? 'Vencidas'
                      : 'Pagas'}
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
              style={{ width: '220px', height: '38px', fontSize: 'var(--text-xs)' }}
            />
            <ClayInput
              placeholder="Buscar conta ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '240px', height: '38px', fontSize: 'var(--text-xs)' }}
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

          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsNewModalOpen(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
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
    </div>
  );
}
