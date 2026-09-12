'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CostApportionmentMethod,
  OverheadExpenseItem,
  ApportionmentCalculationResult,
  Field,
} from '@/lib/types';
import { calculateCostApportionment } from '@/actions/costs';
import { DEFAULT_OVERHEAD_EXPENSES } from '@/lib/overheadDefaults';
import { ClayCard } from '../ui/ClayCard';
import { ClayButton } from '../ui/ClayButton';
import { ClayInput } from '../ui/ClayInput';
import { useToast } from '@/context/ToastContext';
import {
  Scale,
  DollarSign,
  Maximize2,
  PieChart,
  CheckCircle2,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ApportionmentMatrixProps {
  farmId: string;
  seasonId?: string;
  fields: Field[];
  onApportionmentApplied?: (result: ApportionmentCalculationResult) => void;
}

export const ApportionmentMatrix: React.FC<ApportionmentMatrixProps> = ({
  farmId,
  seasonId,
  fields,
  onApportionmentApplied,
}) => {
  const { addToast } = useToast();
  const [method, setMethod] = useState<CostApportionmentMethod>('planted_area');
  const [overheadItems, setOverheadItems] =
    useState<OverheadExpenseItem[]>(DEFAULT_OVERHEAD_EXPENSES);
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({});
  const [calculationResult, setCalculationResult] = useState<ApportionmentCalculationResult | null>(
    null
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('Administração & Sede');
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Initialize custom percentages evenly if not set
  useEffect(() => {
    if (fields.length > 0 && Object.keys(customPercentages).length === 0) {
      const initial: Record<string, number> = {};
      const share = parseFloat((100 / fields.length).toFixed(2));
      fields.forEach((f) => {
        initial[f.id] = share;
      });
      setCustomPercentages(initial);
    }
  }, [fields, customPercentages]);

  // Recalculate apportionment when method, items, or custom percentages change
  useEffect(() => {
    async function runCalculation() {
      setIsSimulating(true);
      try {
        const res = await calculateCostApportionment({
          farmId,
          seasonId,
          method,
          customItems: overheadItems,
          customPercentages,
        });
        setCalculationResult(res);
      } catch (err) {
        console.error('Failed to calculate apportionment:', err);
      } finally {
        setIsSimulating(false);
      }
    }
    runCalculation();
  }, [farmId, seasonId, method, overheadItems, customPercentages]);

  const handleToggleIncludeItem = (itemId: string) => {
    setOverheadItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, included: item.included === false ? true : false } : item
      )
    );
  };

  const handleUpdateItemAmount = (itemId: string, newAmount: number) => {
    setOverheadItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, amount: newAmount } : item))
    );
  };

  const handleAddCustomExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newExpenseAmount.replace(/\./g, '').replace(',', '.')) || 0;
    if (!newExpenseDesc || parsedAmount <= 0) {
      addToast({
        type: 'warning',
        title: 'Atenção',
        message: 'Informe a descrição e o valor da despesa.',
      });
      return;
    }

    const newItem: OverheadExpenseItem = {
      id: `ovh-custom-${Date.now()}`,
      description: newExpenseDesc,
      category: newExpenseCat,
      amount: parsedAmount,
      source: 'custom',
      included: true,
      dueDate: new Date().toISOString().split('T')[0],
    };

    setOverheadItems((prev) => [...prev, newItem]);
    setNewExpenseDesc('');
    setNewExpenseAmount('');
    setIsAddingExpense(false);
    addToast({
      type: 'success',
      title: 'Despesa Indireta Adicionada',
      message: `${newExpenseDesc} incluída no motor de rateio.`,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setOverheadItems((prev) => prev.filter((i) => i.id !== itemId));
    addToast({
      type: 'info',
      title: 'Despesa Removida',
      message: 'Item excluído do rateio.',
    });
  };

  const handleCustomPercentageChange = (fieldId: string, value: number) => {
    setCustomPercentages((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleApplyRateio = () => {
    if (calculationResult) {
      if (onApportionmentApplied) {
        onApportionmentApplied(calculationResult);
      }
      addToast({
        type: 'success',
        title: 'Rateio Aplicado com Sucesso!',
        message: `R$ ${calculationResult.totalOverheadAmount.toLocaleString('pt-BR')} distribuídos entre ${calculationResult.allocations.length} talhões via critério "${getMethodLabel(method)}".`,
      });
    }
  };

  const getMethodLabel = (m: CostApportionmentMethod) => {
    switch (m) {
      case 'planted_area':
        return 'Proporcional à Área Plantada (ha)';
      case 'equal_split':
        return 'Divisão Igualitária entre Talhões';
      case 'direct_cost':
        return 'Proporcional ao Custo Direto Acumulado';
      case 'production_volume':
        return 'Proporcional ao Volume de Produção (sc)';
      case 'custom_percentage':
        return 'Percentual Customizado Manual';
    }
  };

  const totalIncludedOverhead = useMemo(() => {
    return overheadItems
      .filter((i) => i.included !== false)
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }, [overheadItems]);

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Method Selection Cards */}
      <ClayCard>
        <div className="card-header">
          <div>
            <h2 className="card-title">Critério de Rateio de Custos Fixos & Indiretos</h2>
            <p className="card-subtitle">
              Escolha a base agronômica para alocação dos custos gerais e administrativos da fazenda
            </p>
          </div>
        </div>

        <div className="grid-3" style={{ gap: 'var(--space-3)' }}>
          {/* Option 1: Planted Area */}
          <div
            onClick={() => setMethod('planted_area')}
            className={`clay-card ${method === 'planted_area' ? 'clay-card--primary' : ''}`}
            style={{
              cursor: 'pointer',
              border:
                method === 'planted_area'
                  ? '2px solid var(--color-primary-600)'
                  : '1px solid rgba(212, 201, 186, 0.5)',
              padding: 'var(--space-4)',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: 'var(--text-sm)' }}>
                🌾 Área Plantada (ha)
              </span>
              {method === 'planted_area' && <span className="badge badge--primary">Ativo</span>}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
              Padrão oficial do agronegócio. Cada hectare recebe o mesmo valor de overhead.
            </p>
          </div>

          {/* Option 2: Equal Split */}
          <div
            onClick={() => setMethod('equal_split')}
            className={`clay-card ${method === 'equal_split' ? 'clay-card--primary' : ''}`}
            style={{
              cursor: 'pointer',
              border:
                method === 'equal_split'
                  ? '2px solid var(--color-primary-600)'
                  : '1px solid rgba(212, 201, 186, 0.5)',
              padding: 'var(--space-4)',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: 'var(--text-sm)' }}>
                ⚖️ Divisão Igual
              </span>
              {method === 'equal_split' && <span className="badge badge--primary">Ativo</span>}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
              Divisão simétrica e idêntica entre todos os talhões cadastrados na propriedade.
            </p>
          </div>

          {/* Option 3: Direct Cost */}
          <div
            onClick={() => setMethod('direct_cost')}
            className={`clay-card ${method === 'direct_cost' ? 'clay-card--primary' : ''}`}
            style={{
              cursor: 'pointer',
              border:
                method === 'direct_cost'
                  ? '2px solid var(--color-primary-600)'
                  : '1px solid rgba(212, 201, 186, 0.5)',
              padding: 'var(--space-4)',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: 'var(--text-sm)' }}>💰 Custo Direto</span>
              {method === 'direct_cost' && <span className="badge badge--primary">Ativo</span>}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
              Talhões com mais insumos e operações mecanizadas absorvem mais despesas fixas.
            </p>
          </div>

          {/* Option 4: Production Volume */}
          <div
            onClick={() => setMethod('production_volume')}
            className={`clay-card ${method === 'production_volume' ? 'clay-card--primary' : ''}`}
            style={{
              cursor: 'pointer',
              border:
                method === 'production_volume'
                  ? '2px solid var(--color-primary-600)'
                  : '1px solid rgba(212, 201, 186, 0.5)',
              padding: 'var(--space-4)',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: 'var(--text-sm)' }}>
                📦 Volume de Produção (sc)
              </span>
              {method === 'production_volume' && (
                <span className="badge badge--primary">Ativo</span>
              )}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
              Proporcional ao volume estimado de sacas de cada cultura (ex: Soja vs Milho).
            </p>
          </div>

          {/* Option 5: Custom % */}
          <div
            onClick={() => setMethod('custom_percentage')}
            className={`clay-card ${method === 'custom_percentage' ? 'clay-card--primary' : ''}`}
            style={{
              cursor: 'pointer',
              border:
                method === 'custom_percentage'
                  ? '2px solid var(--color-primary-600)'
                  : '1px solid rgba(212, 201, 186, 0.5)',
              padding: 'var(--space-4)',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: 'var(--text-sm)' }}>
                ✍️ Percentual Manual
              </span>
              {method === 'custom_percentage' && (
                <span className="badge badge--primary">Ativo</span>
              )}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
              Defina os percentuais exatos atribuídos a cada talhão individualmente.
            </p>
          </div>
        </div>
      </ClayCard>

      {/* Overhead Expenses Pool Table */}
      <ClayCard>
        <div
          className="card-header flex-between"
          style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}
        >
          <div>
            <h2 className="card-title">Despesas Fixas & Indiretas Elegíveis (Overhead Pool)</h2>
            <p className="card-subtitle">
              Selecione ou adicione contas gerais da fazenda a serem apportionadas no rateio
            </p>
          </div>
          <ClayButton
            size="sm"
            variant="secondary"
            onClick={() => setIsAddingExpense(!isAddingExpense)}
          >
            <Plus size={14} style={{ marginRight: '4px' }} />
            Adicionar Despesa Indireta
          </ClayButton>
        </div>

        {/* Add Expense Form Drawer/Box */}
        {isAddingExpense && (
          <form
            onSubmit={handleAddCustomExpense}
            className="flex-col"
            style={{
              padding: 'var(--space-4)',
              background: 'var(--bg-surface-2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)',
              gap: 'var(--space-3)',
            }}
          >
            <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
              Nova Despesa Fixa para Rateio
            </h4>
            <div className="grid-3">
              <ClayInput
                label="Descrição"
                placeholder="Ex: Consultoria Jurídica Agrária"
                value={newExpenseDesc}
                onChange={(e) => setNewExpenseDesc(e.target.value)}
              />
              <ClayInput
                label="Categoria"
                placeholder="Ex: Jurídico / Contábil"
                value={newExpenseCat}
                onChange={(e) => setNewExpenseCat(e.target.value)}
              />
              <ClayInput
                label="Valor (R$)"
                placeholder="0,00"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
              />
            </div>
            <div className="flex-row" style={{ justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <ClayButton
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsAddingExpense(false)}
              >
                Cancelar
              </ClayButton>
              <ClayButton type="submit" size="sm" variant="primary">
                Incluir no Rateio
              </ClayButton>
            </div>
          </form>
        )}

        <div className="clay-table-wrapper">
          <table className="clay-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>Incluir</th>
                <th>Descrição da Despesa</th>
                <th>Categoria</th>
                <th>Fornecedor / Beneficiário</th>
                <th style={{ textAlign: 'right' }}>Valor (R$)</th>
                <th style={{ width: '50px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {overheadItems.map((item) => (
                <tr key={item.id} style={{ opacity: item.included === false ? 0.5 : 1 }}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={item.included !== false}
                      onChange={() => handleToggleIncludeItem(item.id)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    {item.description}
                    {item.source === 'custom' && (
                      <span
                        className="badge badge--info"
                        style={{ marginLeft: '6px', fontSize: '9px' }}
                      >
                        Custom
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge--neutral">{item.category}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {item.supplierName || 'Geral da Fazenda'}
                  </td>
                  <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.source === 'custom' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-secondary-600)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Remover despesa"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Overhead Summary Bar */}
        <div
          className="flex-between flex-wrap"
          style={{
            marginTop: 'var(--space-4)',
            padding: '12px 16px',
            background: 'var(--bg-surface-2)',
            borderRadius: 'var(--radius-md)',
            gap: '12px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Total de Custos Indiretos Selecionados:
            </span>
            <div
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'bold',
                color: 'var(--color-primary-700)',
              }}
            >
              R$ {totalIncludedOverhead.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Custo Médio de Overhead por Hectare:
            </span>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
              R$ {calculationResult?.summary?.avgOverheadCostPerHa?.toFixed(2) || '0.00'} / ha
            </div>
          </div>
        </div>
      </ClayCard>

      {/* Live Apportionment Matrix */}
      {calculationResult && (
        <ClayCard>
          <div
            className="card-header flex-between"
            style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}
          >
            <div>
              <h2 className="card-title">Matriz de Rateio por Talhão ({getMethodLabel(method)})</h2>
              <p className="card-subtitle">
                Demonstração da absorção de custos indiretos e impacto final no custo por hectare
              </p>
            </div>
            <ClayButton variant="primary" onClick={handleApplyRateio}>
              <CheckCircle2 size={15} style={{ marginRight: '6px' }} />
              Aplicar Rateio à Safra
            </ClayButton>
          </div>

          <div className="clay-table-wrapper">
            <table className="clay-table">
              <thead>
                <tr>
                  <th>Talhão</th>
                  <th>Área (ha)</th>
                  <th>Cultura</th>
                  <th style={{ textAlign: 'right' }}>Custos Diretos (R$)</th>
                  <th style={{ textAlign: 'center' }}>% do Rateio</th>
                  <th style={{ textAlign: 'right' }}>Overhead Alocado (R$)</th>
                  <th style={{ textAlign: 'right' }}>Custo Final Total (R$)</th>
                  <th style={{ textAlign: 'right' }}>Custo Final / ha</th>
                </tr>
              </thead>
              <tbody>
                {calculationResult.allocations.map((alloc) => (
                  <tr key={alloc.fieldId}>
                    <td style={{ fontWeight: '600' }}>{alloc.fieldName}</td>
                    <td>{alloc.area} ha</td>
                    <td>
                      <span className="badge badge--primary">{alloc.crop}</span>
                    </td>
                    <td className="td-money" style={{ textAlign: 'right' }}>
                      R$ {alloc.directCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center', width: '130px' }}>
                      {method === 'custom_percentage' ? (
                        <input
                          type="number"
                          step="0.1"
                          value={customPercentages[alloc.fieldId] ?? alloc.allocationPercentage}
                          onChange={(e) =>
                            handleCustomPercentageChange(
                              alloc.fieldId,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          style={{
                            width: '65px',
                            textAlign: 'center',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-primary-400)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                        />
                      ) : (
                        <div className="flex-col" style={{ gap: '2px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '11px' }}>
                            {alloc.allocationPercentage.toFixed(1)}%
                          </span>
                          <div className="progress" style={{ width: '80px', height: '6px' }}>
                            <div
                              className="progress__fill progress__fill--primary"
                              style={{
                                width: `${Math.min(alloc.allocationPercentage * 2.5, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td
                      className="td-money"
                      style={{
                        textAlign: 'right',
                        color: 'var(--color-primary-700)',
                        fontWeight: '600',
                      }}
                    >
                      R${' '}
                      {alloc.allocatedOverhead.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      R${' '}
                      {alloc.finalTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className="td-money"
                      style={{
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color:
                          alloc.finalTotalCostPerHa > 1200
                            ? 'var(--color-secondary-600)'
                            : 'var(--color-primary-700)',
                      }}
                    >
                      R$ {alloc.finalTotalCostPerHa.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-surface-2)', fontWeight: 'bold' }}>
                  <td>Total Geral</td>
                  <td>{calculationResult.summary.totalArea} ha</td>
                  <td>-</td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    R${' '}
                    {calculationResult.summary.totalDirectCost.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td style={{ textAlign: 'center' }}>100.0%</td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--color-primary-700)' }}
                  >
                    R${' '}
                    {calculationResult.totalOverheadAmount.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    R${' '}
                    {calculationResult.summary.totalFinalCost.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--color-primary-700)' }}
                  >
                    R$ {calculationResult.summary.avgFinalCostPerHa.toFixed(2)}/ha
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </ClayCard>
      )}
    </div>
  );
};
