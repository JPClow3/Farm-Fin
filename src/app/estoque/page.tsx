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
import { ClayModal } from '../../components/ui/ClayModal';
import { ClayTabs } from '../../components/ui/ClayTabs';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { StockItem, KardexReportItem, LotTraceabilityReport } from '../../lib/types';
import { getTodayDateString } from '../../lib/dateUtils';
import { calculateStockAlertSummary, getStockAlertCategory, getExpiryAlertCategory } from '../../lib/stockAlerts';
import { useModuleGuard } from '../../lib/useModuleGuard';
import { AppShellSkeleton } from '../../components/layout/AppShellSkeleton';
import {
  Package,
  Sprout,
  AlertTriangle,
  ClipboardList,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  FileSpreadsheet,
  Calendar,
  Tag,
  MapPin,
  ShieldAlert,
  Search,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  ShoppingBag,
} from 'lucide-react';

export default function EstoquePage() {
  const moduleAllowed = useModuleGuard('estoque');
  const {
    activeFarm,
    activeFarmId,
    activeStockItems,
    activeStockMovements,
    activeFields,
    suppliers,
    machinery,
    employees,
    addStockItem,
    addStockMovement,
  } = useFarm();

  const { addToast } = useToast();
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Active Tab: 'posicao' | 'kardex' | 'lotes' | 'alertas'
  const [activeTab, setActiveTab] = useState<'posicao' | 'kardex' | 'lotes' | 'alertas'>('posicao');

  // Filters
  const [selectedCat, setSelectedCat] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'minimo' | 'critico' | 'vencendo'>('todos');

  // Kardex specific filters
  const [kardexItemFilter, setKardexItemFilter] = useState<string>('todos');
  const [kardexTypeFilter, setKardexTypeFilter] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [kardexStartDate, setKardexStartDate] = useState<string>('');
  const [kardexEndDate, setKardexEndDate] = useState<string>('');
  const [isExportingKardex, setIsExportingKardex] = useState(false);
  const [kardexLotSearch, setKardexLotSearch] = useState<string>('');

  // Lot traceability filter
  const [lotSearchTerm, setLotSearchTerm] = useState<string>('');
  const [selectedLotDetail, setSelectedLotDetail] = useState<LotTraceabilityReport | null>(null);

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Item / Entry Form
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<
    'Sementes' | 'Fertilizantes' | 'Defensivos' | 'Combustíveis'
  >('Fertilizantes');
  const [unit, setUnit] = useState<'kg' | 'L' | 'sc' | 'ton'>('ton');
  const [quantity, setQuantity] = useState('50');
  const [unitPrice, setUnitPrice] = useState('3200.00');
  const [minQuantity, setMinQuantity] = useState('20');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [documentNumber, setDocumentNumber] = useState('NF-e 98402');
  const [batchNumber, setBatchNumber] = useState('LT-2026-');
  const [location, setLocation] = useState('Galpão Principal - Baia A');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [entryDate, setEntryDate] = useState(todayStr);

  // Exit / Application Form
  const [selectedStockId, setSelectedStockId] = useState(activeStockItems[0]?.id || '');
  const [exitQuantity, setExitQuantity] = useState('10');
  const [fieldId, setFieldId] = useState(activeFields[0]?.id || '');
  const [selectedMachinery, setSelectedMachinery] = useState(machinery[0]?.name || '');
  const [operator, setOperator] = useState(employees[0]?.name || 'Marcos Silva');
  const [exitBatchNumber, setExitBatchNumber] = useState('');
  const [applicationDate, setApplicationDate] = useState(todayStr);

  // Alert Summary
  const alertSummary = useMemo(() => {
    return calculateStockAlertSummary(activeStockItems, todayStr);
  }, [activeStockItems, todayStr]);

  // Total Imobilized Stock Value
  const totalStockValue = useMemo(() => {
    return activeStockItems.reduce((sum, item) => sum + item.quantity * item.averageCost, 0);
  }, [activeStockItems]);

  // Existing item matching for dynamic CMP simulator in Entry modal
  const matchedExistingItem = useMemo(() => {
    if (!itemName.trim()) return null;
    return activeStockItems.find(
      (i) => i.name.trim().toLowerCase() === itemName.trim().toLowerCase()
    );
  }, [itemName, activeStockItems]);

  // Projected CMP calculation
  const projectedCMP = useMemo(() => {
    const qtyInput = parseFloat(quantity) || 0;
    const priceInput = parseFloat(unitPrice.replace(',', '.')) || 0;

    if (!matchedExistingItem) {
      return {
        isNew: true,
        newAvgCost: priceInput,
        currentQty: 0,
        currentAvgCost: 0,
        totalQty: qtyInput,
      };
    }

    const currQty = matchedExistingItem.quantity;
    const currCost = matchedExistingItem.averageCost;
    const totalQty = currQty + qtyInput;
    const totalVal = currQty * currCost + qtyInput * priceInput;
    const newAvgCost = totalQty > 0 ? totalVal / totalQty : priceInput;

    return {
      isNew: false,
      newAvgCost: parseFloat(newAvgCost.toFixed(2)),
      currentQty: currQty,
      currentAvgCost: currCost,
      totalQty,
    };
  }, [matchedExistingItem, quantity, unitPrice]);

  // Filtered Stock Items for Posicao Tab
  const filteredItems = useMemo(() => {
    return activeStockItems.filter((item) => {
      const matchCat =
        selectedCat === 'todos' || item.category.toLowerCase() === selectedCat.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.lastSupplier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.batchNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(searchTerm.toLowerCase());

      let matchStatus = true;
      const stockCat = getStockAlertCategory(item.quantity, item.minQuantity);
      const expiryCat = getExpiryAlertCategory(item.expiryDate, todayStr);

      if (statusFilter === 'minimo') {
        matchStatus = stockCat === 'minimo' || stockCat === 'critico' || stockCat === 'zerado';
      } else if (statusFilter === 'critico') {
        matchStatus = stockCat === 'critico' || stockCat === 'zerado';
      } else if (statusFilter === 'vencendo') {
        matchStatus = expiryCat === 'vencido' || expiryCat === 'vencendo_30d' || expiryCat === 'vencendo_60d';
      }

      return matchCat && matchSearch && matchStatus;
    });
  }, [activeStockItems, selectedCat, searchTerm, statusFilter, todayStr]);

  // Compute Kardex rows with chronological running balance
  const kardexData = useMemo<KardexReportItem[]>(() => {
    const movements = [...activeStockMovements].sort((a, b) => a.date.localeCompare(b.date));

    let runningQty = 0;
    let runningVal = 0;

    const fullChronological: KardexReportItem[] = [];

    for (const m of movements) {
      const item = activeStockItems.find((i) => i.id === m.stockItemId || i.name === m.itemName);
      const unitPrice =
        m.quantity > 0 && m.totalCost > 0
          ? parseFloat((m.totalCost / m.quantity).toFixed(2))
          : item?.averageCost || 0;

      if (m.type === 'entrada') {
        runningQty += m.quantity;
        runningVal += m.totalCost;
      } else {
        runningQty = Math.max(0, runningQty - m.quantity);
        runningVal = Math.max(0, runningVal - m.totalCost);
      }

      fullChronological.push({
        id: m.id,
        date: m.date,
        stockItemId: m.stockItemId,
        itemName: m.itemName,
        category: item?.category || 'Insumos',
        type: (m.type as 'entrada' | 'saida') || 'entrada',
        documentNumber: m.documentNumber || (m.type === 'entrada' ? 'NF-e Entrada' : 'Req. Campo'),
        batchNumber: m.batchNumber || item?.batchNumber || 'LT-PADRÃO',
        location: m.location || item?.location || 'Galpão Principal',
        fieldOrSupplier:
          m.type === 'entrada'
            ? item?.lastSupplier || 'Fornecedor'
            : m.fieldName || 'Aplicação no Talhão',
        quantity: m.quantity,
        unit: m.unit,
        unitCost: unitPrice,
        totalCost: m.totalCost,
        runningBalanceQty: parseFloat(runningQty.toFixed(2)),
        runningBalanceValue: parseFloat(runningVal.toFixed(2)),
      });
    }

    // Apply user filters
    let filtered = fullChronological;

    if (kardexItemFilter !== 'todos') {
      filtered = filtered.filter(
        (m) => m.stockItemId === kardexItemFilter || m.itemName === kardexItemFilter
      );
    }

    if (kardexTypeFilter !== 'todos') {
      filtered = filtered.filter((m) => m.type === kardexTypeFilter);
    }

    if (kardexLotSearch.trim()) {
      filtered = filtered.filter(
        (m) =>
          m.batchNumber.toLowerCase().includes(kardexLotSearch.toLowerCase()) ||
          m.documentNumber.toLowerCase().includes(kardexLotSearch.toLowerCase())
      );
    }

    if (kardexStartDate) {
      filtered = filtered.filter((m) => m.date >= kardexStartDate);
    }

    if (kardexEndDate) {
      filtered = filtered.filter((m) => m.date <= kardexEndDate);
    }

    return filtered.reverse();
  }, [
    activeStockMovements,
    activeStockItems,
    kardexItemFilter,
    kardexTypeFilter,
    kardexLotSearch,
    kardexStartDate,
    kardexEndDate,
  ]);

  // Compute Lot Traceability data
  const lotTraceabilityData = useMemo<LotTraceabilityReport[]>(() => {
    const lotMap = new Map<string, { item: StockItem; entries: typeof activeStockMovements; exits: typeof activeStockMovements }>();

    for (const item of activeStockItems) {
      const lotKey = item.batchNumber || `LT-${item.id.slice(0, 8)}`;
      if (!lotMap.has(lotKey)) {
        lotMap.set(lotKey, { item, entries: [], exits: [] });
      }
    }

    for (const m of activeStockMovements) {
      const lotKey = m.batchNumber || `LT-${m.stockItemId.slice(0, 8)}`;
      if (!lotMap.has(lotKey)) {
        const item = activeStockItems.find((i) => i.id === m.stockItemId || i.name === m.itemName);
        if (item) {
          lotMap.set(lotKey, { item, entries: [], exits: [] });
        }
      }

      const rec = lotMap.get(lotKey);
      if (rec) {
        if (m.type === 'entrada') rec.entries.push(m);
        else rec.exits.push(m);
      }
    }

    const list: LotTraceabilityReport[] = [];

    lotMap.forEach((val, key) => {
      if (lotSearchTerm && !key.toLowerCase().includes(lotSearchTerm.toLowerCase()) && !val.item.name.toLowerCase().includes(lotSearchTerm.toLowerCase())) {
        return;
      }

      const totalEntered = val.entries.reduce((sum, e) => sum + e.quantity, 0) || val.item.quantity;
      const totalExited = val.exits.reduce((sum, e) => sum + e.quantity, 0);
      const remaining = Math.max(0, totalEntered - totalExited);
      const expiryStatus = getExpiryAlertCategory(val.item.expiryDate, todayStr);

      list.push({
        batchNumber: key,
        stockItemId: val.item.id,
        itemName: val.item.name,
        category: val.item.category,
        unit: val.item.unit,
        location: val.item.location || 'Galpão Principal - Baia A',
        expiryDate: val.item.expiryDate || null,
        expiryStatus,
        totalEnteredQty: totalEntered,
        totalExitedQty: totalExited,
        remainingQty: remaining,
        averageCost: val.item.averageCost,
        totalImmobilizedValue: parseFloat((remaining * val.item.averageCost).toFixed(2)),
        entries: val.entries,
        applications: val.exits,
      });
    });

    return list;
  }, [activeStockItems, activeStockMovements, lotSearchTerm, todayStr]);

  // Handlers
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity) || 0;
    const cost = parseFloat(unitPrice.replace(',', '.')) || 0;
    const minQ = parseFloat(minQuantity) || 0;
    const selectedSup = suppliers.find((s) => s.id === supplierId) || suppliers[0];

    if (!itemName.trim() || qty <= 0) {
      addToast({
        type: 'warning',
        title: 'Dados Incompletos',
        message: 'Preencha o nome do insumo e informe uma quantidade válida.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addStockItem({
        farmId: activeFarmId,
        name: itemName.trim(),
        category: itemCategory,
        unit,
        quantity: qty,
        minQuantity: minQ,
        averageCost: cost,
        unitPrice: cost,
        lastSupplier: selectedSup?.name || 'Fornecedor',
        batchNumber: batchNumber.trim() || `LT-${Date.now().toString().slice(-6)}`,
        location: location.trim() || 'Galpão Principal',
        expiryDate: expiryDate || '2027-12-31',
        documentNumber: documentNumber.trim() || 'NF-e',
        createdAt: entryDate,
      });

      addToast({
        type: 'success',
        title: 'Entrada Registrada com Sucesso!',
        message: `${qty} ${unit} de "${itemName}" integrados ao almoxarifado. Custo Médio Ponderado (CMP) atualizado para R$ ${projectedCMP.newAvgCost.toFixed(2)}/${unit}.`,
      });

      setIsEntryModalOpen(false);
      setItemName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateExit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem =
      activeStockItems.find((s) => s.id === selectedStockId) || activeStockItems[0];
    const targetField = activeFields.find((f) => f.id === fieldId) || activeFields[0];
    const qty = parseFloat(exitQuantity) || 0;

    if (!targetItem || qty <= 0) {
      addToast({
        type: 'warning',
        title: 'Dados Inválidos',
        message: 'Selecione o insumo e a quantidade a aplicar.',
      });
      return;
    }

    if (qty > targetItem.quantity) {
      addToast({
        type: 'danger',
        title: 'Estoque Insuficiente',
        message: `Saldo disponível no galpão: ${targetItem.quantity} ${targetItem.unit}.`,
      });
      return;
    }

    const exitCost = qty * targetItem.averageCost;

    setIsSubmitting(true);
    try {
      await addStockMovement({
        farmId: activeFarmId,
        stockItemId: targetItem.id,
        itemName: targetItem.name,
        type: 'saida',
        quantity: qty,
        unit: targetItem.unit,
        date: applicationDate,
        fieldId: targetField?.id,
        fieldName: targetField?.name,
        machinery: selectedMachinery,
        operator,
        documentNumber: `Req. Talhão ${targetField?.name || 'Geral'}`,
        batchNumber: exitBatchNumber || targetItem.batchNumber,
        location: targetItem.location,
        totalCost: parseFloat(exitCost.toFixed(2)),
      });

      addToast({
        type: 'success',
        title: 'Aplicação no Talhão Registrada!',
        message: `Baixa de ${qty} ${targetItem.unit} no ${targetField?.name}. Custo direto alocado: R$ ${exitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (CMP: R$ ${targetItem.averageCost.toFixed(2)}/${targetItem.unit}).`,
      });

      setIsExitModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingKardex(true);
    try {
      const itemFilterName =
        kardexItemFilter === 'todos'
          ? 'Todos os Insumos'
          : activeStockItems.find((i) => i.id === kardexItemFilter)?.name || 'Insumo Selecionado';

      const { exportKardexToExcel } = await import('../../lib/exportKardexExcel');
      exportKardexToExcel({
        kardexRows: kardexData,
        stockItems: activeStockItems,
        farmName: activeFarm?.name || 'Fazenda Modelo',
        selectedItemName: itemFilterName,
        periodLabel:
          kardexStartDate || kardexEndDate
            ? `${kardexStartDate || 'Início'} até ${kardexEndDate || 'Hoje'}`
            : 'Histórico Completo',
      });

      addToast({
        type: 'success',
        title: 'Download Iniciado',
        message: 'Planilha Excel do Livro Kardex gerada com sucesso!',
      });
    } catch (err) {
      console.error('Error exporting Kardex to Excel:', err);
      addToast({
        type: 'danger',
        title: 'Erro na Exportação',
        message: 'Não foi possível gerar a planilha do Livro Kardex.',
      });
    } finally {
      setIsExportingKardex(false);
    }
  };

  const kardexColumns: Column<KardexReportItem>[] = [
    {
      key: 'date',
      header: 'Data',
      render: (row) => <span className="td-date">{row.date}</span>,
    },
    {
      key: 'itemName',
      header: 'Insumo & Lote',
      render: (row) => (
        <div className="flex-col" style={{ gap: '2px' }}>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{row.itemName}</span>
          <div className="flex-row" style={{ gap: '6px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
            <span style={{ background: 'var(--bg-surface-2)', padding: '1px 6px', borderRadius: '4px' }}>
              Lote: {row.batchNumber}
            </span>
            <span>•</span>
            <span>{row.location}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Operação',
      render: (row) => (
        <span className={`badge ${row.type === 'entrada' ? 'badge--success' : 'badge--warning'}`}>
          {row.type === 'entrada' ? 'Entrada (NF-e)' : 'Aplicação Talhão'}
        </span>
      ),
    },
    {
      key: 'fieldOrSupplier',
      header: 'Origem / Destino',
      render: (row) => (
        <div className="flex-col" style={{ gap: '2px' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {row.fieldOrSupplier}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Doc: {row.documentNumber}
            {row.machinery ? ` • ${row.machinery}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qtd. Mov.',
      render: (row) => (
        <span
          style={{
            fontWeight: 'bold',
            color: row.type === 'entrada' ? 'var(--color-success-700)' : 'var(--color-danger-700)',
          }}
        >
          {row.type === 'entrada' ? '+' : '-'}{row.quantity.toLocaleString('pt-BR')} {row.unit}
        </span>
      ),
    },
    {
      key: 'unitCost',
      header: 'Custo Unit. (CMP)',
      align: 'right',
      render: (row) => (
        <span className="td-money" style={{ fontSize: 'var(--text-xs)' }}>
          R$ {row.unitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/{row.unit}
        </span>
      ),
    },
    {
      key: 'runningBalanceQty',
      header: 'Saldo Físico',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
          {row.runningBalanceQty.toLocaleString('pt-BR')} {row.unit}
        </span>
      ),
    },
    {
      key: 'runningBalanceValue',
      header: 'Saldo Valorizado (CMP)',
      align: 'right',
      render: (row) => (
        <span className="td-money" style={{ fontWeight: 'bold' }}>
          R$ {row.runningBalanceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
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
          <h1 className="page-title">Estoque de Insumos & Livro Kardex</h1>
          <p className="page-subtitle">
            Gestão física e contábil com Custo Médio Ponderado (CMP), rastreabilidade ponta-a-ponta de lotes e alertas de ressuprimento
          </p>
        </div>
        <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
          <ClayButton variant="secondary" onClick={() => setIsExitModalOpen(true)}>
            <ArrowUpFromLine size={15} style={{ marginRight: '6px' }} />
            Baixa / Aplicação no Talhão
          </ClayButton>
          <ClayButton variant="primary" onClick={() => setIsEntryModalOpen(true)}>
            <ArrowDownToLine size={15} style={{ marginRight: '6px' }} />
            Nova Entrada (Compra)
          </ClayButton>
        </div>
      </div>

      {/* Low Stock & Expiry Alert Notice Banner */}
      {alertSummary.totalAlertsCount > 0 && (
        <ClayCard
          className="clay-card--secondary"
          style={{
            borderLeft: alertSummary.outOfStockCount > 0 || alertSummary.criticalStockCount > 0
              ? '4px solid var(--color-danger-500)'
              : '4px solid var(--color-warning-500)',
          }}
        >
          <div className="flex-between flex-wrap" style={{ gap: 'var(--space-3)' }}>
            <div className="flex-row" style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
              <ShieldAlert
                size={28}
                color={alertSummary.outOfStockCount > 0 ? 'var(--color-danger-600)' : 'var(--color-warning-600)'}
              />
              <div>
                <strong style={{ color: 'var(--color-danger-700)', fontSize: 'var(--text-sm)' }}>
                  Atenção: {alertSummary.lowStockCount} insumo(s) em nível crítico/mínimo e {alertSummary.expiredLotsCount + alertSummary.expiring30dLotsCount} lote(s) com atenção de validade!
                </strong>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Custo estimado para recomposição de estoque de segurança: <strong>R$ {alertSummary.totalReplenishmentCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </p>
              </div>
            </div>
            <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
              <ClayButton size="sm" variant="ghost" onClick={() => setActiveTab('alertas')}>
                Ver Central de Alertas ({alertSummary.totalAlertsCount})
              </ClayButton>
              <ClayButton size="sm" variant="danger" onClick={() => setIsEntryModalOpen(true)}>
                <ShoppingBag size={14} style={{ marginRight: '4px' }} />
                Comprar / Repor
              </ClayButton>
            </div>
          </div>
        </ClayCard>
      )}

      {/* Top Analytical KPIs */}
      <div className="grid-4">
        <KpiCard
          label="Valor Total em Almoxarifado"
          value={`R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Package size={20} />}
          iconColor="blue"
          subtext="Patrimônio imobilizado avaliado por CMP"
        />
        <KpiCard
          label="Insumos Cadastrados"
          value={`${activeStockItems.length} itens`}
          icon={<Sprout size={20} />}
          iconColor="green"
          subtext="Fertilizantes, defensivos, sementes, diesel"
        />
        <KpiCard
          label="Alertas de Ressuprimento"
          value={`${alertSummary.lowStockCount} em risco`}
          icon={<AlertTriangle size={20} />}
          iconColor="red"
          subtext={
            alertSummary.outOfStockCount > 0
              ? `${alertSummary.outOfStockCount} zerado(s) • ${alertSummary.criticalStockCount} crítico(s)`
              : 'Abaixo do ponto de pedido'
          }
        />
        <KpiCard
          label="Lançamentos no Kardex"
          value={`${activeStockMovements.length} movimentos`}
          icon={<ClipboardList size={20} />}
          iconColor="amber"
          subtext="Livro contábil sincronizado"
        />
      </div>

      {/* Navigation Tabs */}
      <ClayTabs
        tabs={[
          { id: 'posicao', label: `Posição do Almoxarifado (${activeStockItems.length})` },
          { id: 'kardex', label: `Livro Kardex Cronológico (${kardexData.length})` },
          { id: 'lotes', label: `Rastreabilidade de Lotes (${lotTraceabilityData.length})` },
          { id: 'alertas', label: `Alertas & Reposição (${alertSummary.totalAlertsCount})` },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* TAB 1: POSIÇÃO DO ALMOXARIFADO */}
      {activeTab === 'posicao' && (
        <>
          {/* Filter Toolbar */}
          <ClayCard size="sm">
            <div className="flex-between flex-wrap" style={{ gap: 'var(--space-3)' }}>
              <div className="filter-pills">
                {['todos', 'Fertilizantes', 'Defensivos', 'Sementes', 'Combustíveis'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-pill ${selectedCat.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setSelectedCat(cat)}
                  >
                    {cat === 'todos' ? 'Todos os Insumos' : cat}
                  </button>
                ))}
              </div>

              <div className="flex-row flex-wrap" style={{ gap: 'var(--space-2)' }}>
                <ClaySelect
                  label=""
                  options={[
                    { value: 'todos', label: 'Todos os Status' },
                    { value: 'minimo', label: 'Abaixo do Mínimo' },
                    { value: 'critico', label: 'Estoque Crítico / Zerado' },
                    { value: 'vencendo', label: 'Vencendo / Vencidos' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  style={{ minWidth: '170px', height: '38px', fontSize: 'var(--text-xs)' }}
                />

                <ClayInput
                  placeholder="Buscar por insumo, lote ou local..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '220px', height: '38px', fontSize: 'var(--text-xs)' }}
                />
              </div>
            </div>
          </ClayCard>

          {/* Stock Cards Grid */}
          {filteredItems.length === 0 ? (
            <EmptyState
              title="Nenhum insumo encontrado"
              description="Ajuste os filtros de busca ou cadastre uma nova entrada de estoque para começar."
            />
          ) : (
          <div className="grid-3">
            {filteredItems.map((item) => {
              const stockCat = getStockAlertCategory(item.quantity, item.minQuantity);
              const expiryCat = getExpiryAlertCategory(item.expiryDate, todayStr);
              const isLow = stockCat === 'minimo' || stockCat === 'critico' || stockCat === 'zerado';
              const percentage = Math.min(100, (item.quantity / (item.minQuantity * 2 || 1)) * 100);

              return (
                <ClayCard
                  key={item.id}
                  className={isLow ? 'clay-card--secondary' : ''}
                  style={
                    stockCat === 'zerado'
                      ? { borderLeft: '4px solid var(--color-danger-700)' }
                      : stockCat === 'critico'
                        ? { borderLeft: '4px solid var(--color-danger-500)' }
                        : isLow
                          ? { borderLeft: '4px solid var(--color-warning-500)' }
                          : undefined
                  }
                >
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                      {item.category}
                    </span>
                    <div className="flex-row" style={{ gap: '4px' }}>
                      {stockCat === 'zerado' && (
                        <span className="badge badge--danger" style={{ fontSize: '10px' }}>
                          ZERADO
                        </span>
                      )}
                      {stockCat === 'critico' && (
                        <span className="badge badge--danger" style={{ fontSize: '10px' }}>
                          CRÍTICO
                        </span>
                      )}
                      {stockCat === 'minimo' && (
                        <span className="badge badge--warning" style={{ fontSize: '10px' }}>
                          Abaixo Mínimo
                        </span>
                      )}
                      {expiryCat === 'vencido' && (
                        <span className="badge badge--danger" style={{ fontSize: '10px' }}>
                          Lote Vencido!
                        </span>
                      )}
                      {expiryCat === 'vencendo_30d' && (
                        <span className="badge badge--warning" style={{ fontSize: '10px' }}>
                          Vence em &lt;30d
                        </span>
                      )}
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: 'var(--text-md)',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </h3>

                  <div
                    className="flex-col"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                      marginBottom: '12px',
                      gap: '2px',
                    }}
                  >
                    <div className="flex-between">
                      <span>Lote: <strong>{item.batchNumber || 'N/A'}</strong></span>
                      <span>{item.location || 'Galpão Geral'}</span>
                    </div>
                    {item.expiryDate && (
                      <div style={{ fontSize: '11px', color: expiryCat === 'vencido' ? 'var(--color-danger-700)' : 'var(--text-secondary)' }}>
                        Validade: {item.expiryDate}
                      </div>
                    )}
                  </div>

                  <div className="flex-between" style={{ marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Saldo Disponível
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--text-xl)',
                          fontWeight: 'bold',
                          color: isLow ? 'var(--color-danger-700)' : 'var(--text-primary)',
                        }}
                      >
                        {item.quantity.toLocaleString('pt-BR')} {item.unit}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Custo Médio (CMP)
                      </div>
                      <div
                        className="td-money"
                        style={{ fontSize: 'var(--text-md)', color: 'var(--color-primary-700)' }}
                      >
                        R$ {item.averageCost.toFixed(2)}/{item.unit}
                      </div>
                    </div>
                  </div>

                  <div className="flex-col" style={{ gap: '4px', marginBottom: '12px' }}>
                    <div
                      className="flex-between"
                      style={{ fontSize: '11px', color: 'var(--text-secondary)' }}
                    >
                      <span>Nível de Segurança</span>
                      <span>Mínimo: {item.minQuantity} {item.unit}</span>
                    </div>
                    <ProgressBar
                      value={percentage}
                      variant={isLow ? 'danger' : 'primary'}
                      height="8px"
                    />
                  </div>

                  <div
                    className="flex-between"
                    style={{ paddingTop: '8px', borderTop: '1px solid rgba(212, 201, 186, 0.4)' }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      Total Imobilizado:
                    </span>
                    <span
                      className="td-money"
                      style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}
                    >
                      R$ {(item.quantity * item.averageCost).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </ClayCard>
              );
            })}
          </div>
          )}
        </>
      )}

      {/* TAB 2: LIVRO KARDEX */}
      {activeTab === 'kardex' && (
        <ClayCard>
          <div className="card-header flex-between flex-wrap" style={{ gap: 'var(--space-4)' }}>
            <div>
              <h2 className="card-title">Ficha Kardex — Movimentações Contábeis</h2>
              <p className="card-subtitle">
                Livro contábil de entradas por NF-e e saídas para aplicação com apuração contínua do saldo físico e valorizado (CMP)
              </p>
            </div>

            <div className="flex-row flex-wrap" style={{ gap: 'var(--space-2)' }}>
              <ClayButton
                variant="secondary"
                size="sm"
                onClick={handleExportExcel}
                loading={isExportingKardex}
              >
                <FileSpreadsheet size={15} style={{ marginRight: '6px' }} />
                Exportar Kardex (Excel)
              </ClayButton>
            </div>
          </div>

          {/* Kardex Filters Bar */}
          <div
            className="grid-4"
            style={{
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-3)',
              background: 'var(--bg-surface-2)',
              borderRadius: 'var(--radius-md)',
              gap: 'var(--space-3)',
            }}
          >
            <ClaySelect
              label="Filtrar Insumo"
              options={[
                { value: 'todos', label: 'Todos os Insumos' },
                ...activeStockItems.map((i) => ({ value: i.id, label: i.name })),
              ]}
              value={kardexItemFilter}
              onChange={(e) => setKardexItemFilter(e.target.value)}
            />

            <ClaySelect
              label="Tipo de Operação"
              options={[
                { value: 'todos', label: 'Todas as Operações' },
                { value: 'entrada', label: 'Entradas (Compras/NF)' },
                { value: 'saida', label: 'Saídas (Aplicações)' },
              ]}
              value={kardexTypeFilter}
              onChange={(e) => setKardexTypeFilter(e.target.value as any)}
            />

            <ClayInput
              label="Data Inicial"
              type="date"
              value={kardexStartDate}
              onChange={(e) => setKardexStartDate(e.target.value)}
            />

            <ClayInput
              label="Data Final"
              type="date"
              value={kardexEndDate}
              onChange={(e) => setKardexEndDate(e.target.value)}
            />
          </div>

          <ClayTable
            columns={kardexColumns}
            data={kardexData}
            keyExtractor={(m) => m.id}
            emptyMessage="Nenhuma movimentação registrada no livro Kardex para os filtros selecionados."
          />
        </ClayCard>
      )}

      {/* TAB 3: RASTREABILIDADE DE LOTES */}
      {activeTab === 'lotes' && (
        <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayCard size="sm">
            <div className="flex-between flex-wrap" style={{ gap: 'var(--space-3)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>
                  Rastreabilidade Completa de Lotes e Aplicação Agronômica
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  Acompanhe cada lote adquirido desde a nota fiscal até os talhões de aplicação, maquinários e operadores
                </p>
              </div>
              <ClayInput
                placeholder="Buscar por lote ou insumo..."
                value={lotSearchTerm}
                onChange={(e) => setLotSearchTerm(e.target.value)}
                style={{ width: '250px', height: '36px' }}
              />
            </div>
          </ClayCard>

          {lotTraceabilityData.length === 0 ? (
            <EmptyState
              title="Nenhum lote rastreável encontrado"
              description="Ajuste a busca ou registre uma entrada de estoque com número de lote para habilitar a rastreabilidade."
            />
          ) : (
          <div className="grid-2">
            {lotTraceabilityData.map((lot) => (
              <ClayCard key={lot.batchNumber}>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
                    <span className="badge badge--primary" style={{ fontWeight: 'bold' }}>
                      LOTE: {lot.batchNumber}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {lot.category}
                    </span>
                  </div>

                  <span
                    className={`badge ${
                      lot.expiryStatus === 'vencido'
                        ? 'badge--danger'
                        : lot.expiryStatus === 'vencendo_30d'
                          ? 'badge--warning'
                          : 'badge--success'
                    }`}
                  >
                    {lot.expiryStatus === 'vencido'
                      ? 'Vencido'
                      : lot.expiryStatus === 'vencendo_30d'
                        ? 'Vence em <30d'
                        : 'Válido'}
                  </span>
                </div>

                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'bold', marginBottom: '6px' }}>
                  {lot.itemName}
                </h3>

                <div
                  className="grid-3"
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Entrada Total</div>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                      {lot.totalEnteredQty.toLocaleString('pt-BR')} {lot.unit}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Aplicado em Campo</div>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', color: 'var(--color-danger-700)' }}>
                      {lot.totalExitedQty.toLocaleString('pt-BR')} {lot.unit}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Saldo em Galpão</div>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', color: 'var(--color-success-700)' }}>
                      {lot.remainingQty.toLocaleString('pt-BR')} {lot.unit}
                    </div>
                  </div>
                </div>

                <div className="flex-col" style={{ gap: '4px', fontSize: 'var(--text-xs)', marginBottom: '12px' }}>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Armazenamento:</span>
                    <span>{lot.location}</span>
                  </div>
                  {lot.expiryDate && (
                    <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Data de Validade:</span>
                      <span>{lot.expiryDate}</span>
                    </div>
                  )}
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Patrimônio Restante:</span>
                    <span className="td-money" style={{ fontWeight: 'bold' }}>
                      R$ {lot.totalImmobilizedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Applications list */}
                {lot.applications.length > 0 ? (
                  <div style={{ borderTop: '1px solid rgba(212, 201, 186, 0.4)', paddingTop: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                      Destinação nos Talhões ({lot.applications.length} aplicações):
                    </div>
                    <div className="flex-col" style={{ gap: '4px' }}>
                      {lot.applications.map((app) => (
                        <div
                          key={app.id}
                          className="flex-between"
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: 'var(--bg-surface-2)',
                            borderRadius: '4px',
                          }}
                        >
                          <div>
                            <strong>{app.fieldName || 'Talhão Geral'}</strong>
                            <span style={{ color: 'var(--text-tertiary)', marginLeft: '6px' }}>
                              ({app.date} • {app.machinery || 'Trator'})
                            </span>
                          </div>
                          <span style={{ fontWeight: 'bold', color: 'var(--color-danger-700)' }}>
                            -{app.quantity} {app.unit} (R$ {app.totalCost.toLocaleString('pt-BR')})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    Nenhuma baixa de aplicação registrada para este lote até o momento.
                  </div>
                )}
              </ClayCard>
            ))}
          </div>
          )}
        </div>
      )}

      {/* TAB 4: CENTRAL DE ALERTAS E REPOSIÇÃO */}
      {activeTab === 'alertas' && (
        <ClayCard>
          <div className="card-header flex-between flex-wrap">
            <div>
              <h2 className="card-title">Central de Alertas & Plano de Ressuprimento</h2>
              <p className="card-subtitle">
                Diagnóstico de ruptura de insumos, pontos de reposição preventiva e estimativa de compras
              </p>
            </div>
            <ClayButton variant="primary" size="sm" onClick={() => setIsEntryModalOpen(true)}>
              <ShoppingBag size={14} style={{ marginRight: '6px' }} />
              Nova Ordem de Compra
            </ClayButton>
          </div>

          <div className="flex-col" style={{ gap: 'var(--space-3)' }}>
            {alertSummary.alerts.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                }}
              >
                <CheckCircle2 size={40} color="var(--color-success-600)" style={{ margin: '0 auto 8px auto' }} />
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  Todos os insumos estão em níveis seguros de estoque!
                </h3>
                <p style={{ fontSize: 'var(--text-xs)' }}>
                  Nenhum item abaixo do estoque de segurança ou com lote próximo ao vencimento.
                </p>
              </div>
            ) : (
              alertSummary.alerts.map((al) => (
                <div
                  key={al.id}
                  className="flex-between flex-wrap"
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-lg)',
                    gap: 'var(--space-3)',
                    borderLeft:
                      al.stockAlertCategory === 'zerado'
                        ? '4px solid var(--color-danger-700)'
                        : al.stockAlertCategory === 'critico'
                          ? '4px solid var(--color-danger-500)'
                          : '4px solid var(--color-warning-500)',
                  }}
                >
                  <div className="flex-col" style={{ gap: '2px', minWidth: '220px' }}>
                    <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                        {al.name}
                      </span>
                      <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                        {al.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Saldo Atual: <strong>{al.quantity} {al.unit}</strong> • Estoque Mínimo: <strong>{al.minQuantity} {al.unit}</strong>
                    </div>
                    {al.expiryDate && (
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        Lote: {al.batchNumber || 'N/A'} • Validade: {al.expiryDate}
                      </div>
                    )}
                  </div>

                  <div className="flex-col" style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Sugestão de Reposição
                    </div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-primary-700)' }}>
                      +{al.suggestedReorderQty} {al.unit}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      Custo Est.: R$ {al.suggestedReorderCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <ClayButton
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setItemName(al.name);
                      setItemCategory(al.category as any);
                      setUnit(al.unit as any);
                      setQuantity(String(al.suggestedReorderQty || al.minQuantity * 2));
                      setUnitPrice(String(al.averageCost));
                      setMinQuantity(String(al.minQuantity));
                      setIsEntryModalOpen(true);
                    }}
                  >
                    Comprar {al.suggestedReorderQty} {al.unit}
                  </ClayButton>
                </div>
              ))
            )}
          </div>
        </ClayCard>
      )}

      {/* Modal: Nova Entrada (Compra com Simulador de CMP) */}
      <ClayModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Entrada de Insumo no Almoxarifado"
        subtitle="Registre uma nota fiscal de compra com recálculo automático de Custo Médio Ponderado (CMP)"
      >
        <form onSubmit={handleCreateEntry} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Nome do Produto / Insumo"
            placeholder="Ex: Fertilizante NPK 04-14-08 Granel"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />

          <div className="form-grid-2">
            <ClaySelect
              label="Categoria"
              options={[
                { value: 'Fertilizantes', label: 'Fertilizantes & Corretivos' },
                { value: 'Defensivos', label: 'Defensivos Químicos' },
                { value: 'Sementes', label: 'Sementes & Mudas' },
                { value: 'Combustíveis', label: 'Combustíveis & Lubrificantes' },
              ]}
              value={itemCategory}
              onChange={(e) =>
                setItemCategory(
                  e.target.value as 'Sementes' | 'Fertilizantes' | 'Defensivos' | 'Combustíveis'
                )
              }
            />
            <ClaySelect
              label="Unidade de Medida"
              options={[
                { value: 'ton', label: 'Toneladas (ton)' },
                { value: 'kg', label: 'Quilogramas (kg)' },
                { value: 'L', label: 'Litros (L)' },
                { value: 'sc', label: 'Sacas (sc)' },
              ]}
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'kg' | 'L' | 'sc' | 'ton')}
            />
          </div>

          <div className="form-grid-2">
            <ClayInput
              label="Quantidade Comprada"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <ClayInput
              label="Preço Unitário da NF (R$)"
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
          </div>

          {/* CMP Live Simulator Box */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--bg-surface-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(212, 201, 186, 0.5)',
            }}
          >
            <div className="flex-between" style={{ marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                {matchedExistingItem ? 'Simulador de Custo Médio Ponderado (CMP)' : 'Novo Cadastro de Insumo'}
              </span>
              <span className="badge badge--success" style={{ fontSize: '10px' }}>
                CMP Projetado: R$ {projectedCMP.newAvgCost.toFixed(2)}/{unit}
              </span>
            </div>
            {matchedExistingItem ? (
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Saldo atual: <strong>{matchedExistingItem.quantity} {unit}</strong> (CMP atual: R$ {matchedExistingItem.averageCost.toFixed(2)}) + 
                Entrada: <strong>{quantity || 0} {unit}</strong> (a R$ {unitPrice || 0}) ➔ 
                Novo Estoque Total: <strong>{projectedCMP.totalQty} {unit}</strong>
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Insumo inédito. O custo inicial de estoque será fixado em R$ {(parseFloat(unitPrice) || 0).toFixed(2)}/{unit}.
              </div>
            )}
          </div>

          <div className="form-grid-2">
            <ClayInput
              label="Número do Lote do Fabricante"
              placeholder="LT-2026-0482"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
            <ClayInput
              label="Data de Validade do Lote"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <ClaySelect
              label="Fornecedor"
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            />
            <ClayInput
              label="Local de Armazenamento"
              placeholder="Galpão 01 - Baia A"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <ClayInput
              label="Estoque Mínimo de Segurança"
              type="number"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
            />
            <ClayInput
              label="Número da NF-e / Documento"
              placeholder="NF-e 84920"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
          </div>

          <ClayInput
            label="Data da Entrada"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />

          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsEntryModalOpen(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary" loading={isSubmitting}>
              Salvar Entrada no Almoxarifado
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Baixa / Aplicação no Talhão */}
      <ClayModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        title="Baixa / Aplicação de Insumo no Talhão"
        subtitle="Aloque insumos diretamente em um talhão com baixa automática no estoque e rastreabilidade de lote"
      >
        <form onSubmit={handleCreateExit} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClaySelect
            label="Insumo a Aplicar"
            options={activeStockItems.map((s) => ({
              value: s.id,
              label: `${s.name} (Saldo: ${s.quantity} ${s.unit} • CMP: R$ ${s.averageCost.toFixed(2)}/${s.unit}${s.batchNumber ? ` • Lote: ${s.batchNumber}` : ''})`,
            }))}
            value={selectedStockId || (activeStockItems[0]?.id ?? '')}
            onChange={(e) => setSelectedStockId(e.target.value)}
            required
          />

          <div className="form-grid-2">
            <ClayInput
              label="Quantidade a Aplicar"
              type="number"
              value={exitQuantity}
              onChange={(e) => setExitQuantity(e.target.value)}
              required
            />
            <ClaySelect
              label="Talhão de Destino"
              options={activeFields.map((f) => ({
                value: f.id,
                label: `${f.name} (${f.area} ha - ${f.currentCrop})`,
              }))}
              value={fieldId || (activeFields[0]?.id ?? '')}
              onChange={(e) => setFieldId(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <ClaySelect
              label="Maquinário Utilizado"
              options={[
                { value: 'Manual / Costal', label: 'Aplicação Manual / Pulverizador Costal' },
                ...machinery.map((m) => ({
                  value: m.name,
                  label: `${m.name} (${m.plate ? `Placa: ${m.plate}` : m.type})`,
                })),
              ]}
              value={selectedMachinery}
              onChange={(e) => setSelectedMachinery(e.target.value)}
            />
            <ClaySelect
              label="Operador Responsável"
              options={[
                ...employees.map((e) => ({
                  value: e.name,
                  label: `${e.name} (${e.role})`,
                })),
                { value: 'Operador Terceirizado', label: 'Operador Terceirizado / Diarista' },
              ]}
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            />
          </div>

          <ClayInput
            label="Data da Aplicação"
            type="date"
            value={applicationDate}
            onChange={(e) => setApplicationDate(e.target.value)}
            required
          />

          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsExitModalOpen(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary" loading={isSubmitting}>
              Confirmar Aplicação no Talhão
            </ClayButton>
          </div>
        </form>
      </ClayModal>
    </div>
  );
}
