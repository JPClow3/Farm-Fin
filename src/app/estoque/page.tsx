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
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StockItem, StockMovement } from '../../lib/types';
import { getTodayDateString } from '../../lib/dateUtils';
import {
  Package,
  Sprout,
  AlertTriangle,
  ClipboardList,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
} from 'lucide-react';

export default function EstoquePage() {
  const {
    activeFarmId,
    activeStockItems,
    activeStockMovements,
    activeFields,
    suppliers,
    machinery,
    addStockItem,
    addStockMovement,
    kpis,
  } = useFarm();

  const { addToast } = useToast();
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Category filter
  const [selectedCat, setSelectedCat] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  // New Item / Entry Form
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<
    'Sementes' | 'Fertilizantes' | 'Defensivos' | 'Combustíveis'
  >('Fertilizantes');
  const [unit, setUnit] = useState<'kg' | 'L' | 'sc' | 'ton'>('ton');
  const [quantity, setQuantity] = useState('50');
  const [averageCost, setAverageCost] = useState('3200.00');
  const [minQuantity, setMinQuantity] = useState('20');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [documentNumber, setDocumentNumber] = useState('NF-e ');
  const [entryDate, setEntryDate] = useState(todayStr);

  // Exit / Application Form
  const [selectedStockId, setSelectedStockId] = useState(activeStockItems[0]?.id || '');
  const [exitQuantity, setExitQuantity] = useState('10');
  const [fieldId, setFieldId] = useState(activeFields[0]?.id || '');
  const [selectedMachinery, setSelectedMachinery] = useState(machinery[0]?.name || '');
  const [operator, setOperator] = useState('Marcos Silva');
  const [applicationDate, setApplicationDate] = useState(todayStr);

  // Total Imobilized Stock Value
  const totalStockValue = useMemo(() => {
    return activeStockItems.reduce((sum, item) => sum + item.quantity * item.averageCost, 0);
  }, [activeStockItems]);

  const filteredItems = useMemo(() => {
    return activeStockItems.filter((item) => {
      const matchCat =
        selectedCat === 'todos' || item.category.toLowerCase() === selectedCat.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.lastSupplier || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeStockItems, selectedCat, searchTerm]);

  // Handlers
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity) || 0;
    const cost = parseFloat(averageCost.replace(',', '.')) || 0;
    const minQ = parseFloat(minQuantity) || 0;
    const selectedSup = suppliers.find((s) => s.id === supplierId) || suppliers[0];

    if (!itemName || qty <= 0) {
      addToast({
        type: 'warning',
        title: 'Erro',
        message: 'Preencha o nome e quantidade válidos.',
      });
      return;
    }

    await addStockItem({
      farmId: activeFarmId,
      name: itemName,
      category: itemCategory,
      unit,
      quantity: qty,
      minQuantity: minQ,
      averageCost: cost,
      unitPrice: cost,
      lastSupplier: selectedSup?.name || 'Fornecedor',
      expiryDate: '2027-12-31',
      documentNumber,
    });

    addToast({
      type: 'success',
      title: 'Entrada Registrada!',
      message: `${qty} ${unit} de "${itemName}" integrados ao estoque com Custo Médio Ponderado atualizado.`,
    });

    setIsEntryModalOpen(false);
    setItemName('');
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
        title: 'Erro',
        message: 'Selecione o insumo e a quantidade válida.',
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
      totalCost: qty * targetItem.averageCost,
    });

    addToast({
      type: 'success',
      title: 'Aplicação no Talhão Registrada!',
      message: `Baixa de ${qty} ${targetItem.unit} no ${targetField?.name}. Custo alocado: R$ ${(qty * targetItem.averageCost).toLocaleString('pt-BR')}.`,
    });

    setIsExitModalOpen(false);
  };

  const movementColumns: Column<StockMovement>[] = [
    {
      key: 'date',
      header: 'Data',
      render: (row) => <span className="td-date">{row.date}</span>,
    },
    {
      key: 'itemName',
      header: 'Insumo',
      render: (row) => <span style={{ fontWeight: '600' }}>{row.itemName}</span>,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row) => (
        <span className={`badge ${row.type === 'entrada' ? 'badge--success' : 'badge--warning'}`}>
          {row.type === 'entrada' ? 'Entrada (NF)' : 'Aplicação Talhão'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantidade',
      render: (row) => (
        <span style={{ fontWeight: 'bold' }}>
          {row.quantity.toLocaleString('pt-BR')} {row.unit}
        </span>
      ),
    },
    {
      key: 'dest',
      header: 'Destino / Documento',
      render: (row) => (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          {row.fieldName
            ? `${row.fieldName} (${row.operator || 'Operador'})`
            : row.documentNumber || '-'}
        </span>
      ),
    },
    {
      key: 'totalCost',
      header: 'Custo Total (CMP)',
      align: 'right',
      render: (row) => (
        <span className="td-money">
          R$ {row.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Estoque de Insumos & Aplicações</h1>
          <p className="page-subtitle">
            Controle de almoxarifado, custo médio ponderado (CMP), baixas para talhão e
            rastreabilidade
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

      {/* KPIs */}
      <div className="grid-4">
        <KpiCard
          label="Valor Total em Estoque"
          value={`R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Package size={20} />}
          iconColor="blue"
          subtext="Patrimônio imobilizado no galpão"
        />
        <KpiCard
          label="Itens Cadastrados"
          value={`${activeStockItems.length} produtos`}
          icon={<Sprout size={20} />}
          iconColor="green"
          subtext="Fertilizantes, sementes, defensivos"
        />
        <KpiCard
          label="Alertas de Estoque Mínimo"
          value={`${kpis.lowStockCount} item(ns)`}
          icon={<AlertTriangle size={20} />}
          iconColor="red"
          subtext="Necessitam de reposição imediata"
        />
        <KpiCard
          label="Movimentações no Mês"
          value={`${activeStockMovements.length} lançamentos`}
          icon={<ClipboardList size={20} />}
          iconColor="amber"
          subtext="Kardex atualizado"
        />
      </div>

      {/* Filter Toolbar */}
      <ClayCard size="sm">
        <div className="flex-between flex-wrap" style={{ gap: 'var(--space-4)' }}>
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

          <ClayInput
            placeholder="Buscar insumo no galpão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '260px', height: '38px', fontSize: 'var(--text-xs)' }}
          />
        </div>
      </ClayCard>

      {/* Stock Cards Grid */}
      <div className="grid-3">
        {filteredItems.map((item) => {
          const isLow = item.quantity <= item.minQuantity;
          const percentage = Math.min(100, (item.quantity / (item.minQuantity * 2.5 || 1)) * 100);

          return (
            <ClayCard key={item.id} className={isLow ? 'clay-card--secondary' : ''}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                  {item.category}
                </span>
                {isLow && (
                  <span className="badge badge--danger" style={{ fontSize: '10px' }}>
                    Estoque Baixo!
                  </span>
                )}
              </div>

              <h3
                style={{
                  fontSize: 'var(--text-md)',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                {item.name}
              </h3>

              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  marginBottom: '12px',
                }}
              >
                Fornecedor: {item.lastSupplier || 'Não informado'}
              </div>

              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Saldo Atual
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.quantity.toLocaleString('pt-BR')} {item.unit}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Custo Médio Ponderado
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
                  <span>Nível de Estoque</span>
                  <span>
                    Mínimo: {item.minQuantity} {item.unit}
                  </span>
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
                  R${' '}
                  {(item.quantity * item.averageCost).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </ClayCard>
          );
        })}
      </div>

      {/* Movement History (Kardex) */}
      <ClayCard>
        <div className="card-header">
          <div>
            <h2 className="card-title">Histórico de Movimentações (Kardex CMP)</h2>
            <p className="card-subtitle">
              Entradas de notas fiscais e saídas para aplicação direta nos talhões
            </p>
          </div>
        </div>

        <ClayTable
          columns={movementColumns}
          data={activeStockMovements}
          keyExtractor={(m) => m.id}
          emptyMessage="Nenhuma movimentação registrada no período."
        />
      </ClayCard>

      {/* Modal: Nova Entrada (Compra) */}
      <ClayModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Entrada de Insumo no Galpão"
        subtitle="Registre uma nota fiscal de compra com cálculo automático de Custo Médio Ponderado"
      >
        <form onSubmit={handleCreateEntry} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClayInput
            label="Nome do Produto / Insumo"
            placeholder="Ex: NPK 04-14-08 Granulado"
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
              value={averageCost}
              onChange={(e) => setAverageCost(e.target.value)}
              required
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
              label="Estoque Mínimo de Segurança"
              type="number"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <ClayInput
              label="Número da NF-e / Documento"
              placeholder="NF-e 84920"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
            <ClayInput
              label="Data da Entrada"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
            />
          </div>

          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsEntryModalOpen(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              Salvar Entrada no Galpão
            </ClayButton>
          </div>
        </form>
      </ClayModal>

      {/* Modal: Baixa / Aplicação no Talhão */}
      <ClayModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        title="Baixa / Aplicação de Insumo no Talhão"
        subtitle="Aloque insumos diretamente em um talhão com baixa automática no estoque"
      >
        <form onSubmit={handleCreateExit} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <ClaySelect
            label="Insumo a Aplicar"
            options={activeStockItems.map((s) => ({
              value: s.id,
              label: `${s.name} (Disponível: ${s.quantity} ${s.unit} • Custo: R$ ${s.averageCost.toFixed(2)}/${s.unit})`,
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
                label: `${f.name} (${f.area} ha)`,
              }))}
              value={fieldId || (activeFields[0]?.id ?? '')}
              onChange={(e) => setFieldId(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <ClaySelect
              label="Maquinário Utilizado"
              options={machinery.map((m) => ({ value: m.name, label: m.name }))}
              value={selectedMachinery}
              onChange={(e) => setSelectedMachinery(e.target.value)}
            />
            <ClayInput
              label="Operador / Tratorista"
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
            <ClayButton type="submit" variant="primary">
              Confirmar Aplicação no Talhão
            </ClayButton>
          </div>
        </form>
      </ClayModal>
    </div>
  );
}
