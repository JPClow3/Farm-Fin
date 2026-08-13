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
import { Receivable } from '../../lib/types';
import { getTodayDateString, addMonthsToDate } from '../../lib/dateUtils';
import {
  Plus,
  CircleDollarSign,
  CheckCircle2,
  Wheat,
  BarChart3,
  Pencil,
  Trash2,
} from 'lucide-react';

export default function ContasAReceberPage() {
  const {
    activeFarmId,
    activeSeasonId,
    activeReceivables,
    customers,
    bankAccounts,
    addReceivable,
    updateReceivable,
    receiveReceivable,
    deleteReceivable,
    kpis,
  } = useFarm();

  const { addToast } = useToast();
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);
  const [receivingItem, setReceivingItem] = useState<Receivable | null>(null);

  // New Receivable Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [crop, setCrop] = useState('Soja');
  const [description, setDescription] = useState('');
  const [bagsQuantity, setBagsQuantity] = useState('10000');
  const [unitPrice, setUnitPrice] = useState('138.50');
  const [dueDate, setDueDate] = useState(() => addMonthsToDate(todayStr, 0));
  const [contractType, setContractType] = useState<
    'Venda Spot' | 'Barter Insumos' | 'Contrato Futuro' | 'Hedge'
  >('Contrato Futuro');
  const [installmentsCount, setInstallmentsCount] = useState('1');

  // Edit Form State
  const [editDescription, setEditDescription] = useState('');
  const [editBagsQuantity, setEditBagsQuantity] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editContractType, setEditContractType] = useState<
    'Venda Spot' | 'Barter Insumos' | 'Contrato Futuro' | 'Hedge'
  >('Contrato Futuro');

  // Receiving Form State
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [receivedDate, setReceivedDate] = useState(todayStr);

  // Filtered List
  const filteredReceivables = useMemo(() => {
    return activeReceivables.filter((r) => {
      const matchStatus = statusFilter === 'todos' ? true : r.status === statusFilter;

      const matchCustomer = !customerFilter || r.customerId === customerFilter;
      const matchSearch =
        !searchTerm ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.crop.toLowerCase().includes(searchTerm.toLowerCase());

      return matchStatus && matchCustomer && matchSearch;
    });
  }, [activeReceivables, statusFilter, customerFilter, searchTerm]);

  // Total Bags Sold
  const totalBags = useMemo(() => {
    return activeReceivables.reduce((sum, r) => sum + r.bagsQuantity, 0);
  }, [activeReceivables]);

  // Calculated Total in Form
  const totalCalc = useMemo(() => {
    const bags = parseFloat(bagsQuantity) || 0;
    const price = parseFloat(unitPrice.replace(',', '.')) || 0;
    return bags * price;
  }, [bagsQuantity, unitPrice]);

  const handleCreateReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || totalCalc <= 0) {
      addToast({
        type: 'warning',
        title: 'Erro',
        message: 'Preencha os dados da venda de forma válida.',
      });
      return;
    }

    const selectedCust = customers.find((c) => c.id === customerId) || customers[0];
    const totalInst = parseInt(installmentsCount, 10) || 1;

    await addReceivable({
      farmId: activeFarmId,
      cropSeasonId: activeSeasonId,
      customerId: selectedCust?.id || '',
      customerName: selectedCust?.name || 'Cliente',
      crop,
      description,
      bagsQuantity: parseInt(bagsQuantity, 10) || 0,
      unitPrice: parseFloat(unitPrice.replace(',', '.')) || 0,
      totalAmount: totalCalc,
      dueDate,
      status: 'pendente',
      contractType,
      installmentsCount: totalInst,
    });

    addToast({
      type: 'success',
      title: 'Venda Registrada!',
      message: `Contrato de R$ ${totalCalc.toLocaleString('pt-BR')} com ${selectedCust?.name || 'Cliente'} adicionado ao banco.`,
    });

    setIsNewModalOpen(false);
    setDescription('');
  };

  const handleOpenEdit = (r: Receivable) => {
    setEditingReceivable(r);
    setEditDescription(r.description);
    setEditBagsQuantity(String(r.bagsQuantity));
    setEditUnitPrice(String(r.unitPrice));
    setEditDueDate(r.dueDate);
    setEditContractType(r.contractType);
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceivable) return;

    const bags = parseFloat(editBagsQuantity) || editingReceivable.bagsQuantity;
    const price = parseFloat(editUnitPrice.replace(',', '.')) || editingReceivable.unitPrice;
    const newTotal = bags * price;

    await updateReceivable(editingReceivable.id, {
      description: editDescription,
      bagsQuantity: bags,
      unitPrice: price,
      totalAmount: newTotal,
      dueDate: editDueDate,
      contractType: editContractType,
    });

    addToast({
      type: 'success',
      title: 'Contrato Atualizado!',
      message: `Alterações em "${editDescription}" salvas com sucesso.`,
    });

    setEditingReceivable(null);
  };

  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingItem) return;

    const bankId = selectedBankAccountId || bankAccounts[0]?.id;

    await receiveReceivable(receivingItem.id, bankId, receivedDate);

    addToast({
      type: 'success',
      title: 'Recebimento Confirmado!',
      message: `Crédito de R$ ${receivingItem.totalAmount.toLocaleString('pt-BR')} liquidado com sucesso.`,
    });

    setReceivingItem(null);
  };

  const columns: Column<Receivable>[] = [
    {
      key: 'description',
      header: 'Contrato / Descrição',
      render: (row) => (
        <div className="flex-col" style={{ gap: '2px' }}>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{row.description}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Modalidade: {row.contractType}
          </span>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Comprador / Trading',
      render: (row) => (
        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{row.customerName}</span>
      ),
    },
    {
      key: 'volume',
      header: 'Volume / Cotação',
      render: (row) => (
        <div className="flex-col" style={{ gap: '2px' }}>
          <span style={{ fontWeight: 'bold', fontSize: 'var(--text-xs)' }}>
            {row.bagsQuantity.toLocaleString('pt-BR')} sc ({row.crop})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            R$ {row.unitPrice.toFixed(2)}/sc
          </span>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Data Prevista',
      render: (row) => <span className="td-date">{row.dueDate}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Valor Total',
      align: 'right',
      render: (row) => (
        <span className="td-money" style={{ color: 'var(--color-primary-700)' }}>
          R$ {row.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          <ClayButton
            variant="ghost"
            size="sm"
            iconOnly
            title="Editar Venda"
            onClick={() => handleOpenEdit(row)}
          >
            <Pencil size={15} />
          </ClayButton>
          {row.status !== 'pago' && (
            <ClayButton
              variant="primary"
              size="sm"
              onClick={() => {
                setReceivingItem(row);
                setSelectedBankAccountId(bankAccounts[0]?.id || '');
              }}
            >
              Liquidar
            </ClayButton>
          )}
          <ClayButton
            variant="ghost"
            size="sm"
            iconOnly
            title="Excluir"
            onClick={async () => {
              if (confirm('Deseja excluir este recebimento do banco de dados?')) {
                await deleteReceivable(row.id);
                addToast({ type: 'info', title: 'Excluído', message: 'Recebimento removido.' });
              }
            }}
          >
            <Trash2 size={15} />
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
          <h1 className="page-title">Contas a Receber</h1>
          <p className="page-subtitle">
            Gestão de vendas de grãos, contratos futuros, barter e liquidações financeiras
          </p>
        </div>
        <ClayButton variant="primary" onClick={() => setIsNewModalOpen(true)}>
          <Plus size={16} style={{ marginRight: '6px' }} />
          Nova Venda / Contrato
        </ClayButton>
      </div>

      {/* KPIs Grid */}
      <div className="grid-4">
        <KpiCard
          label="Total a Receber (Safra)"
          value={`R$ ${kpis.totalPendingReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CircleDollarSign size={20} />}
          iconColor="green"
          subtext="Contratos em aberto"
        />
        <KpiCard
          label="Recebido Efetivamente"
          value={`R$ ${kpis.totalReceivedThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CheckCircle2 size={20} />}
          iconColor="blue"
          subtext="Liquidações creditadas"
        />
        <KpiCard
          label="Volume Total Comercializado"
          value={`${totalBags.toLocaleString('pt-BR')} sc`}
          icon={<Wheat size={20} />}
          iconColor="amber"
          subtext="Sacas de 60kg compromissadas"
        />
        <KpiCard
          label="Preço Médio Ponderado"
          value={
            totalBags > 0
              ? `R$ ${(kpis.estimatedCropRevenue / totalBags).toFixed(2)}/sc`
              : 'R$ 0,00/sc'
          }
          icon={<BarChart3 size={20} />}
          iconColor="terra"
          subtext="Média das fixações"
        />
      </div>

      {/* Filters Card */}
      <ClayCard size="sm">
        <div className="flex-between flex-wrap" style={{ gap: 'var(--space-4)' }}>
          {/* Quick Status Pills */}
          <div className="filter-pills">
            {(['todos', 'pendente', 'pago'] as const).map((st) => (
              <button
                key={st}
                type="button"
                className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'todos'
                  ? 'Todos os Contratos'
                  : st === 'pendente'
                    ? 'Em Aberto'
                    : 'Liquidados'}
              </button>
            ))}
          </div>

          {/* Search & Customer Filter */}
          <div className="flex-row flex-wrap" style={{ gap: 'var(--space-3)' }}>
            <ClaySelect
              options={[
                { value: '', label: 'Todos os Compradores' },
                ...customers.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              style={{ width: '100%', maxWidth: '220px', height: '38px', fontSize: 'var(--text-xs)' }}
            />
            <ClayInput
              placeholder="Buscar contrato ou cultura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', maxWidth: '240px', height: '38px', fontSize: 'var(--text-xs)' }}
            />
          </div>
        </div>
      </ClayCard>

      {/* Table */}
      <ClayTable
        columns={columns}
        data={filteredReceivables}
        keyExtractor={(r) => r.id}
        emptyMessage="Nenhum contrato a receber encontrado."
      />

      {/* Modal: Nova Venda de Produção */}
      <ClayModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Nova Venda / Contrato de Produção"
        subtitle="Registre uma venda física, contrato a termo ou operação barter persistida no banco"
      >
        <form
          onSubmit={handleCreateReceivable}
          className="flex-col"
          style={{ gap: 'var(--space-4)' }}
        >
          <ClayInput
            label="Identificação do Contrato / Lote"
            placeholder="Ex: Contrato Futuro Soja Safra 25/26 - Lote Bunge"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="form-grid-2">
            <ClaySelect
              label="Comprador / Trading"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            />
            <ClaySelect
              label="Cultura"
              options={[
                { value: 'Soja', label: 'Soja em Grão (60kg)' },
                { value: 'Milho', label: 'Milho Safrinha (60kg)' },
                { value: 'Café', label: 'Café Arábica Tipo 6' },
                { value: 'Algodão', label: 'Algodão em Pluma' },
              ]}
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <ClayInput
              label="Quantidade (Sacas de 60kg)"
              type="number"
              value={bagsQuantity}
              onChange={(e) => setBagsQuantity(e.target.value)}
              required
            />
            <ClayInput
              label="Preço por Saca (R$)"
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <ClaySelect
              label="Tipo de Operação"
              options={[
                { value: 'Contrato Futuro', label: 'Contrato a Termo / Futuro' },
                { value: 'Venda Spot', label: 'Venda Spot (Mercado Físico)' },
                { value: 'Barter Insumos', label: 'Operação Barter (Troca por Insumo)' },
                { value: 'Hedge', label: 'Hedge Financeiro' },
              ]}
              value={contractType}
              onChange={(e) =>
                setContractType(
                  e.target.value as 'Venda Spot' | 'Barter Insumos' | 'Contrato Futuro' | 'Hedge'
                )
              }
            />
            <ClayInput
              label="Previsão de Liquidação"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <ClaySelect
            label="Condição de Pagamento / Parcelas"
            options={[
              { value: '1', label: 'À Vista / Liquidação Única' },
              { value: '2', label: 'Parcelado em 2x (30/60 dias)' },
              { value: '3', label: 'Parcelado em 3x (Safra)' },
              { value: '6', label: 'Parcelado em 6x' },
            ]}
            value={installmentsCount}
            onChange={(e) => setInstallmentsCount(e.target.value)}
          />

          {/* Computed Total Box */}
          <div
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-primary-50)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-primary-200)',
            }}
          >
            <div className="flex-between">
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Valor Total do Contrato:
              </span>
              <span
                className="td-money"
                style={{ fontSize: 'var(--text-xl)', color: 'var(--color-primary-800)' }}
              >
                R$ {totalCalc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsNewModalOpen(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              Salvar Contrato no Banco
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Editar Contrato */}
      {editingReceivable && (
        <ClayModal
          isOpen={true}
          onClose={() => setEditingReceivable(null)}
          title="Editar Contrato de Venda"
          subtitle={`Atualizar dados de ${editingReceivable.description}`}
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
                label="Quantidade (Sacas)"
                type="number"
                value={editBagsQuantity}
                onChange={(e) => setEditBagsQuantity(e.target.value)}
                required
              />
              <ClayInput
                label="Preço por Saca (R$)"
                type="number"
                step="0.01"
                value={editUnitPrice}
                onChange={(e) => setEditUnitPrice(e.target.value)}
                required
              />
            </div>
            <div className="form-grid-2">
              <ClaySelect
                label="Modalidade"
                options={[
                  { value: 'Contrato Futuro', label: 'Contrato Futuro' },
                  { value: 'Venda Spot', label: 'Venda Spot' },
                  { value: 'Barter Insumos', label: 'Barter Insumos' },
                  { value: 'Hedge', label: 'Hedge' },
                ]}
                value={editContractType}
                onChange={(e) =>
                  setEditContractType(
                    e.target.value as 'Venda Spot' | 'Barter Insumos' | 'Contrato Futuro' | 'Hedge'
                  )
                }
              />
              <ClayInput
                label="Previsão de Liquidação"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                required
              />
            </div>
            <div className="modal__footer">
              <ClayButton type="button" variant="ghost" onClick={() => setEditingReceivable(null)}>
                Cancelar
              </ClayButton>
              <ClayButton type="submit" variant="primary">
                Salvar Alterações
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}

      {/* Modal: Liquidar Recebimento */}
      {receivingItem && (
        <ClayModal
          isOpen={true}
          onClose={() => setReceivingItem(null)}
          title="Liquidação de Recebimento"
          subtitle={`Confirmar crédito de ${receivingItem.description}`}
        >
          <form
            onSubmit={handleConfirmReceive}
            className="flex-col"
            style={{ gap: 'var(--space-4)' }}
          >
            <div
              style={{
                padding: 'var(--space-4)',
                background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div className="flex-between" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Comprador:
                </span>
                <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                  {receivingItem.customerName}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Valor Creditado:
                </span>
                <span
                  className="td-money"
                  style={{ fontSize: 'var(--text-lg)', color: 'var(--color-primary-700)' }}
                >
                  R${' '}
                  {receivingItem.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <ClaySelect
              label="Conta Bancária de Crédito"
              options={bankAccounts.map((b) => ({
                value: b.id,
                label: `${b.bankName} (Saldo: R$ ${b.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
              }))}
              value={selectedBankAccountId || (bankAccounts[0]?.id ?? '')}
              onChange={(e) => setSelectedBankAccountId(e.target.value)}
              required
            />

            <ClayInput
              label="Data Efetiva do Crédito"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              required
            />

            <div className="modal__footer">
              <ClayButton type="button" variant="ghost" onClick={() => setReceivingItem(null)}>
                Cancelar
              </ClayButton>
              <ClayButton type="submit" variant="primary">
                Confirmar Crédito no Banco
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}
    </div>
  );
}
