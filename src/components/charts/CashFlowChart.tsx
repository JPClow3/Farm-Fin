'use client';

import React, { useState } from 'react';

interface CashFlowMonthData {
  month: string;
  inflow: number;
  outflow: number;
  balance: number;
}

interface CashFlowChartProps {
  data?: CashFlowMonthData[];
  scenario?: 'realista' | 'otimista' | 'pessimista' | 'personalizado';
  isPreCalculated?: boolean;
}

const DEFAULT_DATA: CashFlowMonthData[] = [
  { month: 'Mar', inflow: 350000, outflow: 480000, balance: 1290000 },
  { month: 'Abr', inflow: 920000, outflow: 320000, balance: 1890000 },
  { month: 'Mai', inflow: 2150000, outflow: 560000, balance: 3480000 },
  { month: 'Jun', inflow: 1450000, outflow: 610000, balance: 4320000 },
  { month: 'Jul', inflow: 880000, outflow: 420000, balance: 4780000 },
  { month: 'Ago', inflow: 1350000, outflow: 649000, balance: 5481000 },
  { month: 'Set (Proj)', inflow: 1870000, outflow: 750000, balance: 6601000 },
  { month: 'Out (Proj)', inflow: 950000, outflow: 890000, balance: 6661000 },
];

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  data = DEFAULT_DATA,
  scenario = 'realista',
  isPreCalculated = true,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // If not pre-calculated, apply fallback multipliers
  const multiplier = isPreCalculated
    ? 1.0
    : scenario === 'otimista'
      ? 1.15
      : scenario === 'pessimista'
        ? 0.85
        : 1.0;
  const outMultiplier = isPreCalculated ? 1.0 : scenario === 'pessimista' ? 1.08 : 1.0;

  const adjustedData = data.map((d) => ({
    ...d,
    inflow: d.inflow * multiplier,
    outflow: d.outflow * outMultiplier,
    balance: d.balance * multiplier,
  }));

  const maxVal = Math.max(...adjustedData.map((d) => Math.max(d.inflow, d.outflow, 100000)));

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Legend */}
      <div className="flex-row flex-between" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="flex-row" style={{ gap: 'var(--space-4)' }}>
          <div className="flex-row" style={{ gap: '6px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: 'var(--color-primary-500)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Recebimentos (Entradas)
            </span>
          </div>
          <div className="flex-row" style={{ gap: '6px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: 'var(--color-secondary-400)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Pagamentos (Saídas)
            </span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: '220px',
          padding: 'var(--space-2) var(--space-4) 0',
          background: 'var(--bg-surface-2)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--clay-shadow-inset)',
          gap: '8px',
        }}
      >
        {adjustedData.map((item, idx) => {
          const inflowHeight = (item.inflow / maxVal) * 160;
          const outflowHeight = (item.outflow / maxVal) * 160;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.month}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                position: 'relative',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip on Hover */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-65px',
                    left: 'clamp(0px, 50%, calc(100% - 0px))',
                    transform: 'translateX(-50%)',
                    background: 'var(--text-primary)',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: 'var(--clay-shadow-md)',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{item.month}</div>
                  <div style={{ color: 'var(--color-primary-300)' }}>
                    + R$ {(item.inflow / 1000).toFixed(1)}k
                  </div>
                  <div style={{ color: 'var(--color-secondary-300)' }}>
                    - R$ {(item.outflow / 1000).toFixed(1)}k
                  </div>
                </div>
              )}

              {/* Bars container */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '4px',
                  height: '160px',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                {/* Inflow Bar */}
                <div
                  style={{
                    width: '35%',
                    maxWidth: '22px',
                    height: `${Math.max(inflowHeight, 4)}px`,
                    background: isHovered ? 'var(--color-primary-600)' : 'var(--color-primary-500)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all var(--transition-fast)',
                    boxShadow: 'var(--clay-shadow-xs)',
                  }}
                />
                {/* Outflow Bar */}
                <div
                  style={{
                    width: '35%',
                    maxWidth: '22px',
                    height: `${Math.max(outflowHeight, 4)}px`,
                    background: isHovered
                      ? 'var(--color-secondary-500)'
                      : 'var(--color-secondary-400)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all var(--transition-fast)',
                    boxShadow: 'var(--clay-shadow-xs)',
                  }}
                />
              </div>

              {/* Month Label */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: isHovered ? 'bold' : 'normal',
                  color: isHovered ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  marginTop: '8px',
                  marginBottom: '4px',
                }}
              >
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
