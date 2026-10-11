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
import {
  Receivable,
  CommodityUnit,
  ContractType,
  HedgeType,
  PriceFixingStatus,
  RecurrencePattern,
} from '../../lib/types';
import { getTodayDateString, addMonthsToDate } from '../../lib/dateUtils';
import { AgingAnalysisView } from '../../components/finance/AgingAnalysisView';
import { useModuleGuard } from '../../lib/useModuleGuard';
import { AppShellSkeleton } from '../../components/layout/AppShellSkeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import {
  Plus,
  CircleDollarSign,
  CheckCircle2,
  Wheat,
  BarChart3,
  Pencil,
  Trash2,
  TrendingUp,
  RefreshCw,
  Lock,
  Unlock,
  ShieldCheck,
  Scale,
  Layers,
  ListFilter,
  Repeat,
} from 'lucide-react';

export default function ContasAReceberPage() {
  const moduleAllowed = useModuleGuard('contas-a-receber');
  const {
    activeFarmId,
    activeSeasonId,
    activeReceivables,
    activePayables,
    customers,
    bankAccounts,
    addReceivable,
    updateReceivable,
    receiveReceivable,
    deleteReceivable,
    fixPriceReceivable,
    settleBarterContract,
    kpis,
  } = useFarm();

  const { addToast } = useToast();
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'contratos' | 'aging'>('contratos');

  // Filters State
  const [filterMode, setFilterMode] = useState<
    'todos' | 'pendente' | 'pago' | 'barter' | 'hedge' | 'a_fixar'
  >('todos');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<Receivable | null>(null);
  const [receivingItem, setReceivingItem] = useState<Receivable | null>(null);
  const [fixingPriceItem, setFixingPriceItem] = useState<Receivable | null>(null);
  const [barterSettlingItem, setBarterSettlingItem] = useState<Receivable | null>(null);
  const [deletingReceivable, setDeletingReceivable] = useState<Receivable | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState<string | null>(null);

  // New Receivable Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [crop, setCrop] = useState('Soja');
  const [description, setDescription] = useState('');
  const [commodityUnit, setCommodityUnit] = useState<CommodityUnit>('sc');
  const [quantity, setQuantity] = useState('10000');
  const [unitPrice, setUnitPrice] = useState('138.50');
  const [dueDate, setDueDate] = useState(() => addMonthsToDate(todayStr, 0));
  const [contractType, setContractType] = useState<ContractType>('Contrato Futuro');
  const [installmentsCount, setInstallmentsCount] = useState('1');
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('none');

  // Barter Form State
  const [linkedPayableId, setLinkedPayableId] = useState<string>('');

  // Hedge Form State
  const [hedgeType, setHedgeType] = useState<HedgeType>('Futuro CME');
  const [priceFixingStatus, setPriceFixingStatus] = useState<PriceFixingStatus>('fixado');
  const [referenceIndex, setReferenceIndex] = useState('CBOT Chicago (US¢/bu)');
  const [basis, setBasis] = useState('1.20');
  const [targetPrice, setTargetPrice] = useState('145.00');

  // Fix Price Modal State
  const [newFixedPrice, setNewFixedPrice] = useState('');
  const [priceFixingDate, setPriceFixingDate] = useState(todayStr);

  // Barter Settlement Modal State
  const [barterSettlementDate, setBarterSettlementDate] = useState(todayStr);
  const [barterNotes, setBarterNotes] = useState(
    'Entrega física de grãos para quitação de insumos.'
  );

  // Edit Form State
  const [editDescription, setEditDescription] = useState('');
  const [editCommodityUnit, setEditCommodityUnit] = useState<CommodityUnit>('sc');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editContractType, setEditContractType] = useState<ContractType>('Contrato Futuro');
  const [editLinkedPayableId, setEditLinkedPayableId] = useState('');
  const [editHedgeType, setEditHedgeType] = useState<HedgeType>('Nenhum');
  const [editPriceFixingStatus, setEditPriceFixingStatus] = useState<PriceFixingStatus>('fixado');
  const [editReferenceIndex, setEditReferenceIndex] = useState('');

  // Receiving Form State
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [receivedDate, setReceivedDate] = useState(todayStr);

  // Available Open Payables for Barter Linkage
  const openPayables = useMemo(() => {
    return activePayables.filter((p) => p.status !== 'pago');
  }, [activePayables]);

  // Unit conversion helper
  const calculateNormalizedBags = (qty: number, unit: CommodityUnit) => {
    if (unit === 'ton') return qty * 16.6667;
    if (unit === '@') return qty * 0.25;
    if (unit === 'kg') return qty / 60;
    return qty;
  };

  // Filtered List
  const filteredReceivables = useMemo(() => {
    return activeReceivables.filter((r) => {
      let matchFilter = true;
      if (filterMode === 'pendente') matchFilter = r.status === 'pendente';
      else if (filterMode === 'pago') matchFilter = r.status === 'pago';
      else if (filterMode === 'barter')
        matchFilter = r.contractType === 'Barter Insumos' || !!r.linkedPayableId;
      else if (filterMode === 'hedge')
        matchFilter =
          r.contractType === 'Hedge' || Boolean(r.hedgeType && r.hedgeType !== 'Nenhum');
      else if (filterMode === 'a_fixar') matchFilter = r.priceFixingStatus === 'a_fixar';

      const matchCustomer = !customerFilter || r.customerId === customerFilter;
      const matchSearch =
        !searchTerm ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.crop.toLowerCase().includes(searchTerm.toLowerCase());

      return matchFilter && matchCustomer && matchSearch;
    });
  }, [activeReceivables, filterMode, customerFilter, searchTerm]);

  // Volume Aggregations
  const totalBags = useMemo(() => {
    return activeReceivables.reduce((sum, r) => sum + (r.bagsQuantity || 0), 0);
  }, [activeReceivables]);

  const totalMetricTons = useMemo(() => {
    return totalBags / 16.6667;
  }, [totalBags]);

  const hedgeStats = useMemo(() => {
    const hedgedContracts = activeReceivables.filter(
      (r) =>
        r.contractType === 'Hedge' ||
        Boolean(r.hedgeType && r.hedgeType !== 'Nenhum') ||
        r.contractType === 'Contrato Futuro'
    );
    const hedgedBags = hedgedContracts.reduce((sum, r) => sum + (r.bagsQuantity || 0), 0);
    const aFixarContracts = activeReceivables.filter((r) => r.priceFixingStatus === 'a_fixar');
    const aFixarBags = aFixarContracts.reduce((sum, r) => sum + (r.bagsQuantity || 0), 0);
    const barterContracts = activeReceivables.filter((r) => r.contractType === 'Barter Insumos');
    const barterTotal = barterContracts.reduce((sum, r) => sum + r.totalAmount, 0);

    return {
      hedgedBags,
      aFixarBags,
      aFixarCount: aFixarContracts.length,
      barterTotal,
      hedgedRatio: totalBags > 0 ? (hedgedBags / totalBags) * 100 : 0,
    };
  }, [activeReceivables, totalBags]);

  // Live Computed Total in Form
  const totalCalc = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice.replace(',', '.')) || 0;
    return qty * price;
  }, [quantity, unitPrice]);

  const equivalentBagsPreview = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    return calculateNormalizedBags(qty, commodityUnit);
  }, [quantity, commodityUnit]);

  const handleCreateReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!description.trim()) {
      errors.description = 'Informe a identificação do contrato ou lote.';
    }
    const rawQty = parseFloat(quantity) || 0;
    if (rawQty <= 0) {
      errors.quantity = 'Informe uma quantidade válida maior que zero.';
    }
    const parsedUnitPrice = parseFloat(unitPrice.replace(',', '.')) || 0;
    if (parsedUnitPrice <= 0) {
      errors.unitPrice = 'Informe um preço unitário válido maior que zero.';
    }
    if (!dueDate) {
      errors.dueDate = 'Informe a data de vencimento / liquidação.';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const selectedCust = customers.find((c) => c.id === customerId) || customers[0];
    const totalInst = parseInt(installmentsCount, 10) || 1;

    setIsSubmitting(true);
    try {
      await addReceivable({
        farmId: activeFarmId,
        cropSeasonId: activeSeasonId,
        customerId: selectedCust?.id || '',
        customerName: selectedCust?.name || 'Cliente',
        crop,
        description: description.trim(),
        commodityUnit,
        quantity: rawQty,
        bagsQuantity: equivalentBagsPreview,
        unitPrice: parsedUnitPrice,
        totalAmount: totalCalc,
        dueDate,
        status: 'pendente',
        contractType,
        linkedPayableId:
          contractType === 'Barter Insumos' && linkedPayableId ? linkedPayableId : undefined,
        barterStatus:
          contractType === 'Barter Insumos' ? (linkedPayableId ? 'vinculado' : 'aberto') : 'nenhum',
        hedgeType:
          contractType === 'Hedge' || contractType === 'Contrato Futuro' ? hedgeType : 'Nenhum',
        priceFixingStatus:
          contractType === 'Hedge' || contractType === 'Contrato Futuro'
            ? priceFixingStatus
            : 'fixado',
        referenceIndex:
          contractType === 'Hedge' || contractType === 'Contrato Futuro' ? referenceIndex : undefined,
        basis: contractType === 'Hedge' ? parseFloat(basis) || undefined : undefined,
        targetPrice: contractType === 'Hedge' ? parseFloat(targetPrice) || undefined : undefined,
        installmentsCount: totalInst,
        recurrencePattern,
      });

      const recMsg = recurrencePattern !== 'none' ? ` (${recurrencePattern})` : '';

      addToast({
        type: 'success',
        title: 'Venda / Contrato Registrado!',
        message: `Contrato de R$ ${totalCalc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${recMsg} com ${selectedCust?.name || 'Cliente'} persistido com sucesso.`,
      });

      setIsNewModalOpen(false);
      setDescription('');
      setLinkedPayableId('');
      setRecurrencePattern('none');
    } catch (err: unknown) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Erro ao Salvar Contrato',
        message: 'Não foi possível cadastrar o contrato no banco de dados. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (r: Receivable) => {
    setEditingReceivable(r);
    setEditDescription(r.description);
    setEditCommodityUnit(r.commodityUnit || 'sc');
    setEditQuantity(String(r.quantity || r.bagsQuantity));
    setEditUnitPrice(String(r.unitPrice));
    setEditDueDate(r.dueDate);
    setEditContractType(r.contractType);
    setEditLinkedPayableId(r.linkedPayableId || '');
    setEditHedgeType(r.hedgeType || 'Nenhum');
    setEditPriceFixingStatus(r.priceFixingStatus || 'fixado');
    setEditReferenceIndex(r.referenceIndex || '');
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceivable) return;

    const errors: Record<string, string> = {};
    if (!editDescription.trim()) {
      errors.description = 'Informe a identificação do contrato ou lote.';
    }
    const rawQty = parseFloat(editQuantity) || 0;
    if (rawQty <= 0) {
      errors.quantity = 'Informe uma quantidade válida maior que zero.';
    }
    const price = parseFloat(editUnitPrice.replace(',', '.')) || 0;
    if (price <= 0) {
      errors.unitPrice = 'Informe um preço unitário válido maior que zero.';
    }
    if (!editDueDate) {
      errors.dueDate = 'Informe a data de vencimento / liquidação.';
    }
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }
    setEditFormErrors({});

    const newTotal = rawQty * price;
    const normalizedBags = calculateNormalizedBags(rawQty, editCommodityUnit);

    setIsSubmitting(true);
    try {
      await updateReceivable(editingReceivable.id, {
        description: editDescription.trim(),
        commodityUnit: editCommodityUnit,
        quantity: rawQty,
        bagsQuantity: normalizedBags,
        unitPrice: price,
        totalAmount: newTotal,
        dueDate: editDueDate,
        contractType: editContractType,
        linkedPayableId: editLinkedPayableId || undefined,
        barterStatus:
          editContractType === 'Barter Insumos'
            ? editLinkedPayableId
              ? 'vinculado'
              : 'aberto'
            : 'nenhum',
        hedgeType: editHedgeType,
        priceFixingStatus: editPriceFixingStatus,
        referenceIndex: editReferenceIndex || undefined,
      });

      addToast({
        type: 'success',
        title: 'Contrato Atualizado!',
        message: `Alterações em "${editDescription}" salvas com sucesso.`,
      });

      setEditingReceivable(null);
    } catch (err: unknown) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Erro ao Atualizar',
        message: 'Não foi possível salvar as alterações no banco de dados. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmFixPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixingPriceItem) return;

    const parsedPrice = parseFloat(newFixedPrice.replace(',', '.')) || 0;
    if (parsedPrice <= 0) {
      addToast({
        type: 'warning',
        title: 'Preço Inválido',
        message: 'Informe um preço fixado maior que zero.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await fixPriceReceivable(fixingPriceItem.id, parsedPrice, priceFixingDate);

      addToast({
        type: 'success',
        title: 'Preço Fixado com Sucesso!',
        message: `Contrato fixado a R$ ${parsedPrice.toFixed(2)}/${fixingPriceItem.commodityUnit || 'sc'}. Receita consolidada!`,
      });

      setFixingPriceItem(null);
      setNewFixedPrice('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSettleBarter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barterSettlingItem) return;

    setIsSubmitting(true);
    try {
      await settleBarterContract(
        barterSettlingItem.id,
        barterSettlingItem.linkedPayableId || undefined,
        barterSettlementDate,
        barterNotes
      );

      addToast({
        type: 'success',
        title: 'Operação Barter Liquidada!',
        message: `Entrega física confirmada e contas a pagar vinculado compensado automaticamente.`,
      });

      setBarterSettlingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingItem) return;

    const bankId = selectedBankAccountId || bankAccounts[0]?.id;

    setIsSubmitting(true);
    try {
      await receiveReceivable(receivingItem.id, bankId, receivedDate);

      addToast({
        type: 'success',
        title: 'Recebimento Confirmado!',
        message: `Crédito de R$ ${receivingItem.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} liquidado com sucesso.`,
      });

      setReceivingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Receivable>[] = [
    {
      key: 'description',
      header: 'Contrato / Identificação',
      render: (row) => {
        const linkedPayable = activePayables.find((p) => p.id === row.linkedPayableId);
        return (
          <div className="flex-col" style={{ gap: '4px' }}>
            <div className="flex-row items-center" style={{ gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {row.description}
              </span>
              {row.contractType === 'Barter Insumos' && (
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
                  Barter{' '}
                  {row.barterStatus === 'liquidado'
                    ? 'Liquidado'
                    : row.linkedPayableId
                      ? 'Vinculado'
                      : 'Aberto'}
                </span>
              )}
              {row.priceFixingStatus === 'a_fixar' ? (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    background: '#fef3c7',
                    color: '#b45309',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <Unlock size={10} />A Fixar ({row.referenceIndex || 'CBOT'})
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    background: '#ecfdf5',
                    color: '#047857',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <Lock size={10} />
                  Fixado
                </span>
              )}
              {(row.isRecurring || (row.recurrencePattern && row.recurrencePattern !== 'none')) && (
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
                  title={`Recebimento Recorrente (${row.recurrencePattern})`}
                >
                  <Repeat size={10} />
                  Recorrente
                </span>
              )}
            </div>

            <div
              className="flex-row items-center"
              style={{ gap: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}
            >
              <span>
                Modalidade: <strong>{row.contractType}</strong>
              </span>
              {row.hedgeType && row.hedgeType !== 'Nenhum' && (
                <span>
                  • Instrumento: <strong>{row.hedgeType}</strong>
                </span>
              )}
              {linkedPayable && (
                <span style={{ color: 'var(--color-primary-700)', fontWeight: '500' }}>
                  • Insumo: {linkedPayable.supplierName} ({linkedPayable.description})
                </span>
              )}
            </div>
          </div>
        );
      },
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
      header: 'Volume Negociado / Cotação',
      render: (row) => {
        const unit = row.commodityUnit || 'sc';
        const displayQty = row.quantity || row.bagsQuantity;
        const isTon = unit === 'ton';

        return (
          <div className="flex-col" style={{ gap: '2px' }}>
            <div className="flex-row items-center" style={{ gap: '4px' }}>
              <span style={{ fontWeight: 'bold', fontSize: 'var(--text-xs)' }}>
                {displayQty.toLocaleString('pt-BR')} {unit} ({row.crop})
              </span>
              {isTon && (
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  (~{row.bagsQuantity.toLocaleString('pt-BR')} sc)
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              R$ {row.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/{unit}
            </span>
          </div>
        );
      },
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
        <div className="flex-col" style={{ alignItems: 'flex-end', gap: '2px' }}>
          <span
            className="td-money"
            style={{ color: 'var(--color-primary-700)', fontWeight: '700' }}
          >
            R$ {row.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          {row.priceFixingStatus === 'a_fixar' && (
            <span style={{ fontSize: '10px', color: '#b45309' }}>Preço estimado</span>
          )}
        </div>
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
        <div
          className="flex-row"
          style={{ justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}
        >
          {/* Price-Fixing Trigger for Unfixed contracts */}
          {row.priceFixingStatus === 'a_fixar' && row.status !== 'pago' && (
            <ClayButton
              variant="outline"
              size="sm"
              title="Fixar Preço Definitivo do Contrato"
              onClick={() => {
                setFixingPriceItem(row);
                setNewFixedPrice(String(row.unitPrice || ''));
                setPriceFixingDate(todayStr);
              }}
              style={{ borderColor: '#d97706', color: '#b45309' }}
            >
              <TrendingUp size={13} style={{ marginRight: '4px' }} />
              Fixar Preço
            </ClayButton>
          )}

          {/* Barter Direct Liquidation */}
          {row.contractType === 'Barter Insumos' && row.status !== 'pago' ? (
            <ClayButton
              variant="outline"
              size="sm"
              title="Liquidar Operação de Barter por Entrega Física de Grãos"
              onClick={() => {
                setBarterSettlingItem(row);
                setBarterSettlementDate(todayStr);
              }}
              style={{ borderColor: '#0284c7', color: '#0369a1' }}
            >
              <RefreshCw size={13} style={{ marginRight: '4px' }} />
              Liquidar Barter
            </ClayButton>
          ) : (
            row.status !== 'pago' && (
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
            )
          )}

          <ClayButton
            variant="ghost"
            size="sm"
            iconOnly
            title="Editar Venda"
            onClick={() => handleOpenEdit(row)}
          >
            <Pencil size={15} />
          </ClayButton>
          <ClayButton
            variant="ghost"
            size="sm"
            iconOnly
            title="Excluir"
            onClick={() => setDeletingReceivable(row)}
          >
            <Trash2 size={15} />
          </ClayButton>
        </div>
      ),
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
          <h1 className="page-title">Contas a Receber & Comercialização</h1>
          <p className="page-subtitle">
            Gestão de vendas físicas de grãos, operações de Barter, contratos a termo e estratégias
            de Hedge
          </p>
        </div>
        <ClayButton variant="primary" onClick={() => setIsNewModalOpen(true)}>
          <Plus size={16} style={{ marginRight: '6px' }} />
          Nova Venda / Contrato
        </ClayButton>
      </div>

      {/* Page Error State */}
      {pageError && (
        <ErrorState
          title="Erro ao processar contas a receber"
          description={pageError}
          onRetry={() => setPageError(null)}
          retryLabel="Tentar Novamente"
        />
      )}

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
          subtext={`Equivalente a ${totalMetricTons.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ton`}
        />
        <KpiCard
          label="Hedge & Proteção da Safra"
          value={`${hedgeStats.hedgedRatio.toFixed(1)}%`}
          icon={<ShieldCheck size={20} />}
          iconColor="terra"
          subtext={`${hedgeStats.aFixarCount} contrato(s) a fixar`}
        />
      </div>

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
          { id: 'contratos', label: 'Contratos & Vendas Físicas', icon: <ListFilter size={15} /> },
          {
            id: 'aging',
            label: 'Aging List de Recebimento (30/60/90+)',
            icon: <Layers size={15} />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'contratos' | 'aging')}
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

      {activeTab === 'contratos' && (
        <>
          {/* Filters Card */}
          <ClayCard size="sm">
            <div className="flex-between flex-wrap" style={{ gap: 'var(--space-4)' }}>
              {/* Quick Filter Pills */}
              <div className="filter-pills">
                {(
                  [
                    { id: 'todos', label: 'Todos os Contratos' },
                    { id: 'pendente', label: 'Em Aberto' },
                    { id: 'pago', label: 'Liquidados' },
                    { id: 'barter', label: '🔄 Barter Insumos' },
                    { id: 'hedge', label: '📈 Hedge / Futuros' },
                    { id: 'a_fixar', label: '⏳ A Fixar' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`filter-pill ${filterMode === item.id ? 'active' : ''}`}
                    onClick={() => setFilterMode(item.id)}
                  >
                    {item.label}
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
                  style={{
                    width: '100%',
                    maxWidth: '220px',
                    height: '38px',
                    fontSize: 'var(--text-xs)',
                  }}
                />
                <ClayInput
                  placeholder="Buscar contrato, comprador, cultura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '260px',
                    height: '38px',
                    fontSize: 'var(--text-xs)',
                  }}
                />
              </div>
            </div>
          </ClayCard>

          {/* Table or EmptyState */}
          {filteredReceivables.length === 0 ? (
            <EmptyState
              title={
                activeReceivables.length === 0
                  ? 'Nenhum contrato a receber encontrado'
                  : 'Nenhum registro encontrado'
              }
              description={
                activeReceivables.length === 0
                  ? 'Não há contratos ou vendas cadastrados nesta safra. Registre um novo contrato de produção ou barter.'
                  : 'Nenhum contrato corresponde aos filtros aplicados. Tente ajustar os filtros ou busca.'
              }
              actionLabel={
                activeReceivables.length === 0 ? 'Nova Venda / Contrato' : 'Limpar Filtros'
              }
              onAction={() => {
                if (activeReceivables.length === 0) {
                  setIsNewModalOpen(true);
                } else {
                  setFilterMode('todos');
                  setCustomerFilter('');
                  setSearchTerm('');
                }
              }}
            />
          ) : (
            <ClayTable
              columns={columns}
              data={filteredReceivables}
              keyExtractor={(r) => r.id}
            />
          )}
        </>
      )}

      {activeTab === 'aging' && (
        <AgingAnalysisView
          items={activeReceivables}
          type="receivable"
          onSelectAction={(r) => {
            setReceivingItem(r);
            setSelectedBankAccountId(bankAccounts[0]?.id || '');
            setActiveTab('contratos');
          }}
        />
      )}

      {/* Modal: Nova Venda / Contrato de Produção */}
      <ClayModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Nova Venda / Contrato de Produção"
        subtitle="Cadastre contratos físicos, operações de Barter com insumos ou travas de Hedge"
      >
        <form
          onSubmit={handleCreateReceivable}
          className="flex-col"
          style={{ gap: 'var(--space-4)' }}
          noValidate
        >
          <ClayInput
            label="Identificação do Contrato / Lote"
            placeholder="Ex: Contrato Futuro Soja Safra 25/26 - Lote Bunge"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: '' }));
            }}
            error={formErrors.description}
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
                { value: 'Soja', label: 'Soja em Grão' },
                { value: 'Milho', label: 'Milho Safrinha' },
                { value: 'Café', label: 'Café Arábica' },
                { value: 'Algodão', label: 'Algodão em Pluma' },
              ]}
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
            />
          </div>

          {/* Unit-Based Commodity Tracking Fields */}
          <div
            className="form-grid-3"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}
          >
            <ClaySelect
              label="Unidade de Medida"
              options={[
                { value: 'sc', label: 'Sacas de 60kg (sc)' },
                { value: 'ton', label: 'Toneladas Métricas (ton)' },
                { value: '@', label: 'Arrobas (@ 15kg)' },
                { value: 'kg', label: 'Quilogramas (kg)' },
              ]}
              value={commodityUnit}
              onChange={(e) => setCommodityUnit(e.target.value as CommodityUnit)}
            />
            <ClayInput
              label={`Quantidade (${commodityUnit})`}
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                if (formErrors.quantity) setFormErrors((prev) => ({ ...prev, quantity: '' }));
              }}
              error={formErrors.quantity}
              required
            />
            <ClayInput
              label={`Preço por ${commodityUnit} (R$)`}
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => {
                setUnitPrice(e.target.value);
                if (formErrors.unitPrice) setFormErrors((prev) => ({ ...prev, unitPrice: '' }));
              }}
              error={formErrors.unitPrice}
              required
            />
          </div>

          {/* Commodity Conversion Helper */}
          {commodityUnit !== 'sc' && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--color-primary-800)',
                background: 'var(--color-primary-50)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Scale size={14} />
              Conversão normalizada:{' '}
              <strong>
                {equivalentBagsPreview.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} sacas
                de 60kg
              </strong>
            </div>
          )}

          <div className="form-grid-2">
            <ClaySelect
              label="Modalidade Comercial"
              options={[
                { value: 'Contrato Futuro', label: 'Contrato a Termo / Futuro' },
                { value: 'Venda Spot', label: 'Venda Spot (Mercado Físico)' },
                { value: 'Barter Insumos', label: 'Operação Barter (Troca por Insumo)' },
                { value: 'Hedge', label: 'Hedge / Derivativo Financeiro' },
              ]}
              value={contractType}
              onChange={(e) => setContractType(e.target.value as ContractType)}
            />
            <ClayInput
              label="Previsão de Liquidação"
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (formErrors.dueDate) setFormErrors((prev) => ({ ...prev, dueDate: '' }));
              }}
              error={formErrors.dueDate}
              required
            />
          </div>

          {/* Conditional: Barter Contract Linkage Section */}
          {contractType === 'Barter Insumos' && (
            <div
              style={{
                padding: 'var(--space-3)',
                background: '#f0f9ff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #bae6fd',
              }}
            >
              <div className="flex-row items-center" style={{ gap: '6px', marginBottom: '8px' }}>
                <RefreshCw size={16} color="#0284c7" />
                <span style={{ fontWeight: '600', fontSize: '13px', color: '#0369a1' }}>
                  Vinculação da Operação Barter (Contas a Pagar ↔ Contas a Receber)
                </span>
              </div>
              <ClaySelect
                label="Vincular a Conta a Pagar de Insumo (Opcional)"
                options={[
                  { value: '', label: 'Sem vínculo direto / Lançamento avulso' },
                  ...openPayables.map((p) => ({
                    value: p.id,
                    label: `${p.supplierName} - ${p.description} (R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
                  })),
                ]}
                value={linkedPayableId}
                onChange={(e) => setLinkedPayableId(e.target.value)}
              />
              <p style={{ fontSize: '11px', color: '#0369a1', marginTop: '4px' }}>
                Ao vincular, a liquidação da entrega física de grãos compensará automaticamente o
                título de insumos.
              </p>
            </div>
          )}

          {/* Conditional: Hedge & Price Fixing Section */}
          {(contractType === 'Hedge' || contractType === 'Contrato Futuro') && (
            <div
              style={{
                padding: 'var(--space-3)',
                background: '#fffbeb',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #fde68a',
              }}
            >
              <div className="flex-row items-center" style={{ gap: '6px', marginBottom: '8px' }}>
                <TrendingUp size={16} color="#d97706" />
                <span style={{ fontWeight: '600', fontSize: '13px', color: '#b45309' }}>
                  Parâmetros de Hedge & Fixação de Preço
                </span>
              </div>
              <div className="form-grid-2">
                <ClaySelect
                  label="Instrumento de Proteção"
                  options={[
                    { value: 'Futuro CME', label: 'Futuro CME / CBOT Chicago' },
                    { value: 'Futuro B3', label: 'Futuro B3 (Milho/Boi)' },
                    { value: 'Opcao Venda (Put)', label: 'Opção de Venda (Put)' },
                    { value: 'Opcao Compra (Call)', label: 'Opção de Compra (Call)' },
                    { value: 'NDF Cambial', label: 'NDF Cambial (Dólar Travado)' },
                    { value: 'CPR Financeira', label: 'CPR Financeira' },
                    { value: 'Termo Físico', label: 'Contrato a Termo com Trading' },
                  ]}
                  value={hedgeType}
                  onChange={(e) => setHedgeType(e.target.value as HedgeType)}
                />
                <ClaySelect
                  label="Status da Fixação"
                  options={[
                    { value: 'fixado', label: 'Preço Já Fixado' },
                    { value: 'a_fixar', label: 'A Fixar (Basis / Cotação Aberta)' },
                  ]}
                  value={priceFixingStatus}
                  onChange={(e) => setPriceFixingStatus(e.target.value as PriceFixingStatus)}
                />
              </div>

              {priceFixingStatus === 'a_fixar' && (
                <div
                  className="form-grid-3"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr',
                    gap: 'var(--space-2)',
                    marginTop: '8px',
                  }}
                >
                  <ClaySelect
                    label="Índice de Referência"
                    options={[
                      { value: 'CBOT Chicago (US¢/bu)', label: 'CBOT Chicago (US¢/bu)' },
                      { value: 'CEPEA/ESALQ Paranaguá', label: 'CEPEA/ESALQ Paranaguá' },
                      { value: 'B3 Milho Futuro', label: 'B3 Milho Futuro' },
                      { value: 'Dólar Ptax', label: 'Dólar Ptax BACEN' },
                    ]}
                    value={referenceIndex}
                    onChange={(e) => setReferenceIndex(e.target.value)}
                  />
                  <ClayInput
                    label="Prêmio Basis (US$)"
                    placeholder="+1.20"
                    value={basis}
                    onChange={(e) => setBasis(e.target.value)}
                  />
                  <ClayInput
                    label="Alvo Desejado (R$)"
                    placeholder="145.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="form-grid-2">
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
          </div>

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
            <ClayButton type="submit" variant="primary" loading={isSubmitting}>
              Salvar Contrato no Banco
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Fixar Preço (Price-Fixing Execution) */}
      {fixingPriceItem && (
        <ClayModal
          isOpen={true}
          onClose={() => setFixingPriceItem(null)}
          title="Fixação de Preço do Contrato"
          subtitle={`Executar trava de preço para ${fixingPriceItem.description}`}
        >
          <form
            onSubmit={handleConfirmFixPrice}
            className="flex-col"
            style={{ gap: 'var(--space-4)' }}
          >
            <div
              style={{
                padding: 'var(--space-4)',
                background: '#fffbeb',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #fde68a',
              }}
            >
              <div className="flex-between" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#92400e' }}>Volume do Contrato:</span>
                <span style={{ fontWeight: '700', fontSize: '13px' }}>
                  {(fixingPriceItem.quantity || fixingPriceItem.bagsQuantity).toLocaleString(
                    'pt-BR'
                  )}{' '}
                  {fixingPriceItem.commodityUnit || 'sc'} ({fixingPriceItem.crop})
                </span>
              </div>
              <div className="flex-between" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#92400e' }}>Índice de Referência:</span>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>
                  {fixingPriceItem.referenceIndex || 'CBOT Chicago'}
                </span>
              </div>
              {fixingPriceItem.targetPrice && (
                <div className="flex-between">
                  <span style={{ fontSize: '12px', color: '#92400e' }}>Preço Alvo / Gatilho:</span>
                  <span style={{ fontWeight: '600', fontSize: '13px' }}>
                    R$ {fixingPriceItem.targetPrice.toFixed(2)}/
                    {fixingPriceItem.commodityUnit || 'sc'}
                  </span>
                </div>
              )}
            </div>

            <div className="form-grid-2">
              <ClayInput
                label={`Preço Unitário Fixado (R$/${fixingPriceItem.commodityUnit || 'sc'})`}
                type="number"
                step="0.01"
                placeholder="Ex: 142.50"
                value={newFixedPrice}
                onChange={(e) => setNewFixedPrice(e.target.value)}
                required
              />
              <ClayInput
                label="Data da Fixação"
                type="date"
                value={priceFixingDate}
                onChange={(e) => setPriceFixingDate(e.target.value)}
                required
              />
            </div>

            {/* Live Recalculated Total Preview */}
            <div
              style={{
                padding: 'var(--space-3)',
                background: 'var(--color-primary-50)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-primary-200)',
              }}
            >
              <div className="flex-between">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Novo Valor Total Consolidado:
                </span>
                <span
                  style={{
                    fontWeight: 'bold',
                    fontSize: 'var(--text-lg)',
                    color: 'var(--color-primary-800)',
                  }}
                >
                  R${' '}
                  {(
                    (fixingPriceItem.quantity || fixingPriceItem.bagsQuantity) *
                    (parseFloat(newFixedPrice.replace(',', '.')) || 0)
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="modal__footer">
              <ClayButton type="button" variant="ghost" onClick={() => setFixingPriceItem(null)}>
                Cancelar
              </ClayButton>
              <ClayButton type="submit" variant="primary" loading={isSubmitting}>
                Confirmar Fixação de Preço
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}

      {/* Modal: Liquidar Operação de Barter */}
      {barterSettlingItem && (
        <ClayModal
          isOpen={true}
          onClose={() => setBarterSettlingItem(null)}
          title="Liquidação de Operação Barter"
          subtitle={`Confirmação de entrega física de grãos para quitação de insumos`}
        >
          <form
            onSubmit={handleConfirmSettleBarter}
            className="flex-col"
            style={{ gap: 'var(--space-4)' }}
          >
            <div
              style={{
                padding: 'var(--space-4)',
                background: '#f0f9ff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #bae6fd',
              }}
            >
              <div className="flex-between" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#0369a1' }}>Contrato de Grãos:</span>
                <span style={{ fontWeight: '700', fontSize: '13px' }}>
                  {barterSettlingItem.description}
                </span>
              </div>
              <div className="flex-between" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#0369a1' }}>Volume Entregue:</span>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
                  {(barterSettlingItem.quantity || barterSettlingItem.bagsQuantity).toLocaleString(
                    'pt-BR'
                  )}{' '}
                  {barterSettlingItem.commodityUnit || 'sc'}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ fontSize: '12px', color: '#0369a1' }}>Valor da Quitação:</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#0369a1' }}>
                  R${' '}
                  {barterSettlingItem.totalAmount.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {barterSettlingItem.linkedPayableId && (
              <div
                style={{
                  padding: 'var(--space-3)',
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                ⚠️ <strong>Aviso de Compensação:</strong> O título a pagar correspondente no Contas
                a Pagar será quitado simultaneamente por compensação de Barter.
              </div>
            )}

            <ClayInput
              label="Data Efetiva da Entrega Física"
              type="date"
              value={barterSettlementDate}
              onChange={(e) => setBarterSettlementDate(e.target.value)}
              required
            />

            <ClayInput
              label="Observações / Romaneio de Entrega"
              value={barterNotes}
              onChange={(e) => setBarterNotes(e.target.value)}
            />

            <div className="modal__footer">
              <ClayButton type="button" variant="ghost" onClick={() => setBarterSettlingItem(null)}>
                Cancelar
              </ClayButton>
              <ClayButton type="submit" variant="primary" loading={isSubmitting}>
                Confirmar Entrega e Liquidar Barter
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}

      {/* Modal: Editar Contrato */}
      {editingReceivable && (
        <ClayModal
          isOpen={true}
          onClose={() => setEditingReceivable(null)}
          title="Editar Contrato de Venda"
          subtitle={`Atualizar dados de ${editingReceivable.description}`}
        >
          <form onSubmit={handleConfirmEdit} className="flex-col" style={{ gap: 'var(--space-4)' }} noValidate>
            <ClayInput
              label="Descrição"
              value={editDescription}
              onChange={(e) => {
                setEditDescription(e.target.value);
                if (editFormErrors.description) setEditFormErrors((prev) => ({ ...prev, description: '' }));
              }}
              error={editFormErrors.description}
              required
            />
            <div
              className="form-grid-3"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}
            >
              <ClaySelect
                label="Unidade"
                options={[
                  { value: 'sc', label: 'Sacas (sc)' },
                  { value: 'ton', label: 'Toneladas (ton)' },
                  { value: '@', label: 'Arrobas (@)' },
                  { value: 'kg', label: 'Quilos (kg)' },
                ]}
                value={editCommodityUnit}
                onChange={(e) => setEditCommodityUnit(e.target.value as CommodityUnit)}
              />
              <ClayInput
                label="Quantidade"
                type="number"
                value={editQuantity}
                onChange={(e) => {
                  setEditQuantity(e.target.value);
                  if (editFormErrors.quantity) setEditFormErrors((prev) => ({ ...prev, quantity: '' }));
                }}
                error={editFormErrors.quantity}
                required
              />
              <ClayInput
                label="Preço Unitário (R$)"
                type="number"
                step="0.01"
                value={editUnitPrice}
                onChange={(e) => {
                  setEditUnitPrice(e.target.value);
                  if (editFormErrors.unitPrice) setEditFormErrors((prev) => ({ ...prev, unitPrice: '' }));
                }}
                error={editFormErrors.unitPrice}
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
                onChange={(e) => setEditContractType(e.target.value as ContractType)}
              />
              <ClayInput
                label="Previsão de Liquidação"
                type="date"
                value={editDueDate}
                onChange={(e) => {
                  setEditDueDate(e.target.value);
                  if (editFormErrors.dueDate) setEditFormErrors((prev) => ({ ...prev, dueDate: '' }));
                }}
                error={editFormErrors.dueDate}
                required
              />
            </div>

            {editContractType === 'Barter Insumos' && (
              <ClaySelect
                label="Conta a Pagar Vinculada (Barter)"
                options={[
                  { value: '', label: 'Sem vínculo' },
                  ...openPayables.map((p) => ({
                    value: p.id,
                    label: `${p.supplierName} - ${p.description} (R$ ${p.amount.toLocaleString('pt-BR')})`,
                  })),
                ]}
                value={editLinkedPayableId}
                onChange={(e) => setEditLinkedPayableId(e.target.value)}
              />
            )}

            <div className="modal__footer">
              <ClayButton type="button" variant="ghost" onClick={() => setEditingReceivable(null)}>
                Cancelar
              </ClayButton>
              <ClayButton type="submit" variant="primary" loading={isSubmitting}>
                Salvar Alterações
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}

      {/* Modal: Liquidar Recebimento Normal */}
      {receivingItem && (
        <ClayModal
          isOpen={true}
          onClose={() => setReceivingItem(null)}
          title="Liquidação Financeira de Recebimento"
          subtitle={`Confirmar crédito bancário de ${receivingItem.description}`}
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
              <ClayButton type="submit" variant="primary" loading={isSubmitting}>
                Confirmar Crédito no Banco
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}

      <ConfirmDialog
        isOpen={!!deletingReceivable}
        onClose={() => setDeletingReceivable(null)}
        onConfirm={async () => {
          if (!deletingReceivable) return;
          await deleteReceivable(deletingReceivable.id);
          addToast({ type: 'info', title: 'Excluído', message: 'Recebimento removido.' });
          setDeletingReceivable(null);
        }}
        title="Excluir Recebimento"
        description={
          deletingReceivable
            ? `Deseja excluir "${deletingReceivable.description}" do banco de dados? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        variant="danger"
      />
    </div>
  );
}
