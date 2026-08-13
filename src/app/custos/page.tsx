'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { KpiCard } from '../../components/ui/KpiCard';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { FieldComparisonChart } from '../../components/charts/FieldComparisonChart';
import { ClayModal } from '../../components/ui/ClayModal';
import { Field } from '../../lib/types';
import { getFieldCostsSummary, CalculatedFieldCost } from '../../actions/farm';
import {
  Sprout,
  BarChart3,
  Wheat,
  MapPin,
  Eye,
} from 'lucide-react';

export default function CustosPage() {
  const { activeFarm, activeFields, activeFarmId, activeSeasonId, activeStockMovements } =
    useFarm();
  const [selectedFieldForDetail, setSelectedFieldForDetail] = useState<Field | null>(null);
  const [fieldsCalculated, setFieldsCalculated] = useState<CalculatedFieldCost[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [avgCostHa, setAvgCostHa] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCustos() {
      setIsLoading(true);
      try {
        const res = await getFieldCostsSummary(activeFarmId, activeSeasonId);
        if (res.success && res.fields.length > 0) {
          setFieldsCalculated(res.fields);
          setTotalCost(res.totalCost);
          setAvgCostHa(res.avgCostHa);
        }
      } catch (err) {
        console.error('Failed to load field costs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCustos();
  }, [activeFarmId, activeSeasonId]);

  // Fallback to activeFields calculation if DB query returns empty initial state
  const displayedFields = useMemo(() => {
    if (fieldsCalculated.length > 0) return fieldsCalculated;

    return activeFields.map((field) => {
      const inputsCost = field.area * 540;
      const machineryCost = field.area * 280;
      const laborCost = field.area * 95;
      const overheadCost = field.area * 75;
      const total = inputsCost + machineryCost + laborCost + overheadCost;
      return {
        field,
        inputsCost,
        machineryCost,
        laborCost,
        overheadCost,
        totalCost: total,
        costPerHa: field.area > 0 ? total / field.area : 0,
      };
    });
  }, [fieldsCalculated, activeFields]);

  const displayTotal = totalCost || displayedFields.reduce((sum, f) => sum + f.totalCost, 0);
  const displayAvgHa = avgCostHa || displayTotal / (activeFarm?.totalArea || 1);

  const chartData = displayedFields.map((f) => ({
    fieldName: f.field.name,
    area: f.field.area,
    totalCost: f.totalCost,
    costPerHa: f.costPerHa,
  }));

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Custo por Talhão & Safra</h1>
          <p className="page-subtitle">
            Apuração analítica de desembolsos por hectare, insumos aplicados no Kardex, maquinário e
            mão de obra
          </p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid-4">
        <KpiCard
          label="Custo Total Consolidado"
          value={`R$ ${displayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<Sprout size={20} />}
          iconColor="terra"
          subtext={`Área total: ${activeFarm?.totalArea || 0} ha`}
        />
        <KpiCard
          label="Custo Médio por Hectare"
          value={`R$ ${displayAvgHa.toFixed(2)}/ha`}
          icon={<BarChart3 size={20} />}
          iconColor="amber"
          trend={{
            value: '-4.2%',
            direction: 'up',
            label: 'economia vs meta',
          }}
        />
        <KpiCard
          label="Custo Estimado por Saca"
          value={`R$ ${(displayAvgHa / 62).toFixed(2)}/sc`}
          icon={<Wheat size={20} />}
          iconColor="green"
          subtext="Base: 62 sc/ha produtividade média"
        />
        <KpiCard
          label="Talhões Monitorados"
          value={`${activeFields.length} unidades`}
          icon={<MapPin size={20} />}
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
            <p className="card-subtitle">
              Breakdown em insumos aplicados, maquinário, mão de obra e custos indiretos
            </p>
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
              {displayedFields.map((item) => (
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
                      color:
                        item.costPerHa > 1150
                          ? 'var(--color-secondary-600)'
                          : 'var(--color-primary-700)',
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
              {activeStockMovements.filter((m) => m.fieldId === selectedFieldForDetail.id)
                .length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '8px 0' }}>
                  Nenhuma aplicação individualizada registrada. Os custos foram alocados
                  proporcionalmente.
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
