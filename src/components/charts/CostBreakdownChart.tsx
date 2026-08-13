'use client';

import React from 'react';

export interface CostCategory {
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

interface CostBreakdownChartProps {
  categories?: CostCategory[];
}

const DEFAULT_CATEGORIES: CostCategory[] = [
  { label: 'Fertilizantes & Corretivos', amount: 480000, percentage: 42, color: 'var(--color-primary-500)' },
  { label: 'Defensivos Químicos', amount: 260000, percentage: 23, color: 'var(--color-secondary-400)' },
  { label: 'Sementes & Mudas', amount: 215000, percentage: 19, color: 'var(--color-accent-400)' },
  { label: 'Combustível & Lubrificantes', amount: 93750, percentage: 8, color: '#e07a5f' },
  { label: 'Manutenção & Horas-Máquina', amount: 56800, percentage: 5, color: '#3d405b' },
  { label: 'Mão de Obra & Operações', amount: 34450, percentage: 3, color: '#81b29a' },
];

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({
  categories = DEFAULT_CATEGORIES,
}) => {
  return (
    <div className="flex-col" style={{ gap: 'var(--space-4)', width: '100%' }}>
      {/* Visual Progress Stack */}
      <div
        style={{
          display: 'flex',
          height: '16px',
          width: '100%',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          boxShadow: 'var(--clay-shadow-inset)',
          background: 'var(--bg-surface-2)',
        }}
      >
        {categories.map((cat) => (
          <div
            key={cat.label}
            style={{
              width: `${cat.percentage}%`,
              background: cat.color,
              transition: 'width var(--transition-slow)',
            }}
            title={`${cat.label}: ${cat.percentage}%`}
          />
        ))}
      </div>

      {/* Categories List */}
      <div className="flex-col" style={{ gap: 'var(--space-2)' }}>
        {categories.map((cat) => (
          <div key={cat.label} className="flex-between" style={{ fontSize: 'var(--text-xs)' }}>
            <div className="flex-row" style={{ gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: cat.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                {cat.label}
              </span>
            </div>
            <div className="flex-row" style={{ gap: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                R$ {cat.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span
                style={{
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  width: '32px',
                  textAlign: 'right',
                }}
              >
                {cat.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
