'use client';

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { FieldComparisonChart } from '../../components/charts/FieldComparisonChart';
import { ClayModal } from '../../components/ui/ClayModal';
import { Field } from '../../lib/mockData';

interface FieldCostCalculated {
  field: Field;
  inputsCost: number;
  machineryCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  costPerHa: number;
}

export default function CustosPage() {
  const { activeFarm, activeFields, activePayables, activeStockMovements, kpis } = useFarm();
  const [selectedFieldForDetail, setSelectedFieldForDetail] = useState<Field | null>(null);

  // Compute costs dynamically for each field
  const fieldsCalculated: FieldCostCalculated[] = activeFields.map((field) => {
    // Insumos aplicados no talhão via Kardex
    const inputsApplied = activeStockMovements
      .filter((m) => m.fieldId === field.id && m.type === 'saida')
      .reduce((sum, m) => sum + m.totalCost, 0);

    // Contas a pagar diretamente alocadas ao talhão
    const payablesAllocated = activePayables
      .filter((p) => p.fieldId === field.id)
      .reduce((sum, p) => sum + p.amount, 0);

    // Realistic proportional breakdown
    const inputsCost = inputsApplied + payablesAllocated * 0.65;
    const machineryCost = field.area * 280; // Estimated machine hours
    const laborCost = field.area * 95;
    const overheadCost = field.area * 75;

    const totalCost = inputsCost + machineryCost + laborCost + overheadCost;
    const costPerHa = field.area > 0 ? totalCost / field.area : 0;

    return {
      field,
      inputsCost,
      machineryCost,
      laborCost,
      overheadCost,
      totalCost,
      costPerHa,
    };
  });

  const chartData = fieldsCalculated.map((f) => ({
    fieldName: f.field.name,
    area: f.field.area,
    totalCost: f.totalCost,
    costPerHa: f.costPerHa,
  }));

  const totalCalculatedCost = fieldsCalculated.reduce((sum, f) => sum + f.totalCost, 0);
  const totalArea = activeFarm.totalArea || 1;
  const avgCostHa = totalCalculatedCost / totalArea;

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Custo por Talhão & Safra</h1>
          <p className="page-subtitle">
            Apuração analítica de desembolsos por hectare, insumos, maquinário e mão de obra
          </p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid-4">
        <KpiCard
          label="Custo Total Consolidado"
          value={`R$ ${totalCalculatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon="🌱"
          iconColor="terra"
          subtext={`Área total: ${activeFarm.totalArea} ha`}
        />
        <KpiCard
          label="Custo Médio por Hectare"
          value={`R$ ${avgCostHa.toFixed(2)}/ha`}
          icon="📊"
          iconColor="amber"
          trend={{
            value: '-4.2%',
            direction: 'up',
            label: 'economia vs meta',
          }}
        />
        <KpiCard
          label="Custo Estimado por Saca"
          value={`R$ ${(avgCostHa / 62).toFixed(2)}/sc`}
          icon="🌾"
          iconColor="green"
          subtext="Base: 62 sc/ha produtividade"
        />
        <KpiCard
          label="Talhões Monitorados"
          value={`${activeFields.length} unidades`}
          icon="📍"
          iconColor="blue"
          subtext="100% da área coberta"
        />
      </div>

      {/* Main Comparison Chart */}
      <ClayCard>
        <div className="card-header">
          <div>
            <h2 className="card-title">Comparativo de Desempenho (R$ / Hectare)</h2>
            <p className="card-subtitle">
              Identifique talhões com sobrecusto ou maior eficiência operacional
            </p>
          </div>
        </div>
        <FieldComparisonChart fieldsData={chartData} />
      </ClayCard>

      {/* Detailed Field Cost Table */}
      <ClayCard>
        <div className="card-header">
          <div>
            <h2 className="card-title">Detalhamento de Custos por Talhão</h2>
            <p className="card-subtitle">Breakdown em insumos, maquinário, mão de obra e custos indiretos</p>
          </div>
        </div>

        <div className="clay-table-wrapper">
          <table className="clay-table">
            <thead>
              <tr>
                <th>Talhão</th>
                <th>Área (ha)</th>
                <th>Cultura</th>
                <th style={{ textAlign: 'right' }}>Insumos (R$)</th>
                <th style={{ textAlign: 'right' }}>Maquinário (R$)</th>
                <th style={{ textAlign: 'right' }}>Mão de Obra (R$)</th>
                <th style={{ textAlign: 'right' }}>Overhead (R$)</th>
                <th style={{ textAlign: 'right' }}>Custo Total</th>
                <th style={{ textAlign: 'right' }}>R$ / Hectare</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {fieldsCalculated.map((item) => (
                <tr key={item.field.id}>
                  <td style={{ fontWeight: '600' }}>{item.field.name}</td>
                  <td>{item.field.area} ha</td>
                  <td>
                    <span className="badge badge--primary">{item.field.currentCrop}</span>
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    R$ {item.inputsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    R$ {item.machineryCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    R$ {item.laborCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="td-money" style={{ textAlign: 'right' }}>
                    R$ {item.overheadCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    R$ {item.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: item.costPerHa > 1150 ? 'var(--color-secondary-600)' : 'var(--color-primary-700)',
                    }}
                  >
                    R$ {item.costPerHa.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <ClayButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFieldForDetail(item.field)}
                    >
                      Ver Extrato
                    </ClayButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ClayCard>

      {/* Field Detail Modal */}
      {selectedFieldForDetail && (
        <ClayModal
          isOpen={true}
          onClose={() => setSelectedFieldForDetail(null)}
          title={`Extrato de Custos: ${selectedFieldForDetail.name}`}
          subtitle={`Área: ${selectedFieldForDetail.area} ha • Solo: ${selectedFieldForDetail.soilType}`}
        >
          <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>
              Aplicações de Insumos Registradas:
            </h4>
            <div className="flex-col" style={{ gap: '6px' }}>
              {activeStockMovements
                .filter((m) => m.fieldId === selectedFieldForDetail.id)
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex-between"
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-surface-2)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: 'var(--text-xs)' }}>
                        {m.itemName} ({m.quantity} {m.unit})
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        {m.date} • {m.machinery} ({m.operator})
                      </div>
                    </div>
                    <span className="td-money" style={{ fontSize: 'var(--text-xs)' }}>
                      R$ {m.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              {activeStockMovements.filter((m) => m.fieldId === selectedFieldForDetail.id).length ===
                0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '8px 0' }}>
                  Nenhuma aplicação individualizada registrada. Os custos foram alocados proporcionalmente.
                </div>
              )}
            </div>

            <div className="modal__footer">
              <ClayButton variant="ghost" onClick={() => setSelectedFieldForDetail(null)}>
                Fechar Extrato
              </ClayButton>
            </div>
          </div>
        </ClayModal>
      )}
    </div>
  );
}
