'use client';

import React from 'react';

export interface FieldCostItem {
  fieldName: string;
  area: number;
  totalCost: number;
  costPerHa: number;
}

interface FieldComparisonChartProps {
  fieldsData?: FieldCostItem[];
}

const DEFAULT_FIELDS: FieldCostItem[] = [
  { fieldName: 'Talhão 01 - Sede', area: 450, totalCost: 486000, costPerHa: 1080 },
  { fieldName: 'Talhão 02 - Pivô Central', area: 320, totalCost: 396800, costPerHa: 1240 },
  { fieldName: 'Talhão 03 - Chapadão', area: 680, totalCost: 652800, costPerHa: 960 },
  { fieldName: 'Talhão 04 - Estrada Velha', area: 550, totalCost: 561000, costPerHa: 1020 },
];

export const FieldComparisonChart: React.FC<FieldComparisonChartProps> = ({
  fieldsData = DEFAULT_FIELDS,
}) => {
  const maxCostPerHa = Math.max(...fieldsData.map((f) => f.costPerHa), 1500);

  return (
    <div className="flex-col" style={{ gap: 'var(--space-3)', width: '100%' }}>
      {fieldsData.map((item) => {
        const barWidth = (item.costPerHa / maxCostPerHa) * 100;
        const isHigher = item.costPerHa > 1150;

        return (
          <div key={item.fieldName} className="flex-col" style={{ gap: '4px' }}>
            <div className="flex-between" style={{ fontSize: 'var(--text-xs)' }}>
              <span
                style={{
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {item.fieldName} ({item.area} ha)
              </span>
              <div className="flex-row" style={{ gap: '8px', flexShrink: 0 }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Total: R$ {item.totalCost.toLocaleString('pt-BR')}
                </span>
                <span
                  style={{
                    fontWeight: 'bold',
                    color: isHigher ? 'var(--color-secondary-600)' : 'var(--color-primary-700)',
                  }}
                >
                  R$ {item.costPerHa.toFixed(2)}/ha
                </span>
              </div>
            </div>
            <div className="progress" style={{ height: '10px' }}>
              <div
                className={`progress__fill ${
                  isHigher ? 'progress__fill--accent' : 'progress__fill--primary'
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
