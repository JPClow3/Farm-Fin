'use client';

import React, { useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const PeriodCashFlowSparkline: React.FC = () => {
  const {
    periodFilteredReceivables,
    periodFilteredPayables,
    currentPeriodInfo,
  } = useFarm();

  const { totalInflow, totalOutflow, netBalance, formattedNet, pointsString, isPositive } =
    useMemo(() => {
      const inflow = periodFilteredReceivables.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
      const outflow = periodFilteredPayables.reduce((sum, p) => sum + (p.amount || 0), 0);
      const net = inflow - outflow;
      const positive = net >= 0;

      // Format compact currency (e.g. +R$ 1,2M or +R$ 450k)
      const absVal = Math.abs(net);
      let formatted = '';
      if (absVal >= 1_000_000) {
        formatted = `${(absVal / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
      } else if (absVal >= 1_000) {
        formatted = `${(absVal / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}k`;
      } else {
        formatted = absVal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      }

      // Generate 5 dynamic SVG coordinates for mini sparkline
      // Width: 38px, Height: 16px (viewBox 0 0 38 16)
      const initialY = 8;
      const mid1Y = positive ? 10 : 6;
      const mid2Y = positive ? 5 : 12;
      const mid3Y = positive ? 7 : 10;
      const endY = positive ? 3 : 13;

      const points = `1,${initialY} 10,${mid1Y} 19,${mid2Y} 28,${mid3Y} 37,${endY}`;

      return {
        totalInflow: inflow,
        totalOutflow: outflow,
        netBalance: net,
        formattedNet: `${positive ? '+' : '-'}R$ ${formatted}`,
        pointsString: points,
        isPositive: positive,
      };
    }, [periodFilteredReceivables, periodFilteredPayables]);

  const tooltipText = `Tendência do Período (${currentPeriodInfo.label}):\n• Entradas: R$ ${totalInflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n• Saídas: R$ ${totalOutflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n• Resultado Líquido: ${netBalance >= 0 ? '+' : ''}R$ ${netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const strokeColor = isPositive ? '#059669' : '#dc2626';

  return (
    <div
      className="period-sparkline-pill hide-mobile"
      title={tooltipText}
    >
      <div className="period-sparkline-pill__chart">
        <svg width="38" height="16" viewBox="0 0 38 16" fill="none" style={{ overflow: 'visible' }}>
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsString}
          />
          {/* Pulsing endpoint indicator */}
          <circle
            cx="37"
            cy={isPositive ? '3' : '13'}
            r="2.5"
            fill={strokeColor}
          />
        </svg>
      </div>

      <div className="flex-row items-center" style={{ gap: '3px' }}>
        {isPositive ? (
          <TrendingUp size={13} color="#059669" />
        ) : (
          <TrendingDown size={13} color="#dc2626" />
        )}
        <span
          className={`period-sparkline-pill__net ${
            isPositive ? 'period-sparkline-pill__net--positive' : 'period-sparkline-pill__net--negative'
          }`}
        >
          {formattedNet}
        </span>
      </div>
    </div>
  );
};
