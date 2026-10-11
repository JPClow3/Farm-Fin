'use client';

import React, { useState } from 'react';
import { SeasonHistoricalMetrics } from '@/lib/types';
import { ClayButton } from '../ui/ClayButton';
import { BarChart3, TrendingUp, Layers } from 'lucide-react';

interface CrossSeasonChartProps {
  seasons: SeasonHistoricalMetrics[];
}

export const CrossSeasonChart: React.FC<CrossSeasonChartProps> = ({ seasons }) => {
  const [viewMode, setViewMode] = useState<'financial' | 'costPerHa' | 'productivity'>('financial');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!seasons || seasons.length === 0) {
    return (
      <div
        style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-tertiary)' }}
      >
        Nenhum dado de safra disponível para o comparativo.
      </div>
    );
  }

  // Max calculations for normalization
  const maxRevenue = Math.max(...seasons.map((s) => s.grossRevenue), 1);
  const maxCostHa = Math.max(...seasons.map((s) => s.costPerHa), 1);
  const maxProd = Math.max(
    ...seasons.map((s) => Math.max(s.productivityScHa, s.breakevenYieldScHa)),
    1
  );

  return (
    <div className="flex-col" style={{ gap: 'var(--space-4)', width: '100%' }}>
      {/* Mode Switcher */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
          <ClayButton
            variant={viewMode === 'financial' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('financial')}
          >
            <TrendingUp size={14} style={{ marginRight: '4px' }} />
            Receita x Custo x Lucro
          </ClayButton>
          <ClayButton
            variant={viewMode === 'costPerHa' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('costPerHa')}
          >
            <Layers size={14} style={{ marginRight: '4px' }} />
            Estrutura de Custos (R$/ha)
          </ClayButton>
          <ClayButton
            variant={viewMode === 'productivity' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('productivity')}
          >
            <BarChart3 size={14} style={{ marginRight: '4px' }} />
            Produtividade x Breakeven (sc/ha)
          </ClayButton>
        </div>

        {/* Legend */}
        <div className="flex-row" style={{ gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
          {viewMode === 'financial' && (
            <>
              <div className="flex-row" style={{ gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: 'var(--color-primary-600)',
                  }}
                />
                <span>Receita Bruta</span>
              </div>
              <div className="flex-row" style={{ gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: 'var(--color-secondary-500)',
                  }}
                />
                <span>Custo Total</span>
              </div>
              <div className="flex-row" style={{ gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: 'var(--color-success-600)',
                  }}
                />
                <span>Lucro Líquido</span>
              </div>
            </>
          )}

          {viewMode === 'costPerHa' && (
            <>
              <div className="flex-row" style={{ gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: 'var(--color-primary-600)',
                  }}
                />
                <span>Insumos</span>
              </div>
              <div className="flex-row" style={{ gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: 'var(--color-warning-500)',
                  }}
                />
                <span>Maquinário & Diesel</span>
              </div>
              <div className="flex-row" style={{ gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: 'var(--color-info-500)',
                  }}
                />
                <span>Mão de Obra</span>
              </div>
              <div className="flex-row" style={{ gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: 'var(--color-secondary-400)',
                  }}
                />
                <span>Overhead / Rateio</span>
              </div>
            </>
          )}

          {viewMode === 'productivity' && (
            <>
              <div className="flex-row" style={{ gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: 'var(--color-success-600)',
                  }}
                />
                <span>Produtividade Realizada (sc/ha)</span>
              </div>
              <div className="flex-row" style={{ gap: '4px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: 'var(--color-secondary-600)',
                  }}
                />
                <span>Ponto de Equilíbrio (sc/ha)</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart Canvas / SVG Container */}
      <div
        style={{
          background: 'var(--bg-surface-2)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-4) var(--space-2)',
          minHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${seasons.length}, 1fr)`,
            gap: 'var(--space-4)',
            alignItems: 'flex-end',
            height: '200px',
            paddingBottom: 'var(--space-2)',
            borderBottom: '1px solid rgba(212, 201, 186, 0.4)',
          }}
        >
          {seasons.map((season, idx) => {
            const isHovered = hoveredIdx === idx;

            if (viewMode === 'financial') {
              const revHeight = (season.grossRevenue / maxRevenue) * 100;
              const costHeight = (season.totalCost / maxRevenue) * 100;
              const profitHeight = (season.netProfit / maxRevenue) * 100;

              return (
                <div
                  key={season.seasonId}
                  className="flex-col"
                  style={{
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    opacity: hoveredIdx === null || isHovered ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        background: 'var(--bg-surface)',
                        boxShadow: 'var(--shadow-clay-card)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        zIndex: 10,
                        textAlign: 'center',
                      }}
                    >
                      <strong style={{ color: 'var(--color-primary-700)' }}>
                        {season.seasonName}
                      </strong>
                      <div>Receita: R$ {(season.grossRevenue / 1000000).toFixed(2)}M</div>
                      <div>Custo: R$ {(season.totalCost / 1000000).toFixed(2)}M</div>
                      <div style={{ color: 'var(--color-success-700)', fontWeight: 'bold' }}>
                        Lucro: R$ {(season.netProfit / 1000000).toFixed(2)}M ({season.netProfitPct}
                        %)
                      </div>
                    </div>
                  )}

                  <div
                    className="flex-row"
                    style={{ gap: '4px', alignItems: 'flex-end', height: '100%' }}
                  >
                    {/* Revenue Bar */}
                    <div
                      style={{
                        width: '16px',
                        height: `${Math.max(revHeight, 4)}%`,
                        background: 'var(--color-primary-600)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                      title={`Receita: R$ ${season.grossRevenue.toLocaleString('pt-BR')}`}
                    />
                    {/* Cost Bar */}
                    <div
                      style={{
                        width: '16px',
                        height: `${Math.max(costHeight, 4)}%`,
                        background: 'var(--color-secondary-500)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                      title={`Custo: R$ ${season.totalCost.toLocaleString('pt-BR')}`}
                    />
                    {/* Profit Bar */}
                    <div
                      style={{
                        width: '16px',
                        height: `${Math.max(profitHeight, 4)}%`,
                        background: 'var(--color-success-600)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                      title={`Lucro: R$ ${season.netProfit.toLocaleString('pt-BR')}`}
                    />
                  </div>
                </div>
              );
            }

            if (viewMode === 'costPerHa') {
              const area = season.plantedArea || 1;
              const insumosHa =
                (season.directCosts.fertilizantes +
                  season.directCosts.defensivos +
                  season.directCosts.sementes) /
                area;
              const maquinasHa =
                (season.directCosts.combustivel + season.directCosts.manutencao) / area;
              const maoDeObraHa = season.directCosts.maoDeObra / area;
              const overheadHa = season.overheadCosts.total / area;

              const insumosPct = (insumosHa / maxCostHa) * 100;
              const maquinasPct = (maquinasHa / maxCostHa) * 100;
              const maoDeObraPct = (maoDeObraHa / maxCostHa) * 100;
              const overheadPct = (overheadHa / maxCostHa) * 100;

              return (
                <div
                  key={season.seasonId}
                  className="flex-col"
                  style={{
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    opacity: hoveredIdx === null || isHovered ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        background: 'var(--bg-surface)',
                        boxShadow: 'var(--shadow-clay-card)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        zIndex: 10,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <strong style={{ color: 'var(--color-primary-700)' }}>
                        {season.seasonName}
                      </strong>
                      <div>Insumos: R$ {insumosHa.toFixed(2)}/ha</div>
                      <div>Maquinário: R$ {maquinasHa.toFixed(2)}/ha</div>
                      <div>Mão de Obra: R$ {maoDeObraHa.toFixed(2)}/ha</div>
                      <div>Overhead: R$ {overheadHa.toFixed(2)}/ha</div>
                    </div>
                  )}

                  <div
                    className="flex-col-reverse"
                    style={{
                      width: '36px',
                      borderRadius: '4px 4px 0 0',
                      overflow: 'hidden',
                      height: '100%',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <div
                      style={{ height: `${insumosPct}%`, background: 'var(--color-primary-600)' }}
                      title={`Insumos: R$ ${insumosHa.toFixed(2)}/ha`}
                    />
                    <div
                      style={{ height: `${maquinasPct}%`, background: 'var(--color-warning-500)' }}
                      title={`Maquinário: R$ ${maquinasHa.toFixed(2)}/ha`}
                    />
                    <div
                      style={{ height: `${maoDeObraPct}%`, background: 'var(--color-info-500)' }}
                      title={`Mão de Obra: R$ ${maoDeObraHa.toFixed(2)}/ha`}
                    />
                    <div
                      style={{
                        height: `${overheadPct}%`,
                        background: 'var(--color-secondary-400)',
                      }}
                      title={`Overhead: R$ ${overheadHa.toFixed(2)}/ha`}
                    />
                  </div>
                </div>
              );
            }

            // viewMode === 'productivity'
            const prodHeight = (season.productivityScHa / maxProd) * 100;
            const beHeight = (season.breakevenYieldScHa / maxProd) * 100;
            const marginBags = season.productivityScHa - season.breakevenYieldScHa;

            return (
              <div
                key={season.seasonId}
                className="flex-col"
                style={{
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  opacity: hoveredIdx === null || isHovered ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      background: 'var(--bg-surface)',
                      boxShadow: 'var(--shadow-clay-card)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      zIndex: 10,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <strong style={{ color: 'var(--color-primary-700)' }}>
                      {season.seasonName}
                    </strong>
                    <div>Produtividade: {season.productivityScHa} sc/ha</div>
                    <div>Ponto de Equilíbrio: {season.breakevenYieldScHa} sc/ha</div>
                    <div
                      style={{
                        color:
                          marginBags >= 0
                            ? 'var(--color-success-700)'
                            : 'var(--color-danger-700)',
                        fontWeight: 'bold',
                      }}
                    >
                      Margem: {marginBags > 0 ? `+${marginBags.toFixed(1)}` : marginBags.toFixed(1)} sc/ha
                    </div>
                  </div>
                )}
                <div
                  className="flex-row"
                  style={{ gap: '6px', alignItems: 'flex-end', height: '100%' }}
                >
                  {/* Realized Productivity */}
                  <div
                    style={{
                      width: '20px',
                      height: `${Math.max(prodHeight, 4)}%`,
                      background: 'var(--color-success-600)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                    title={`Produtividade: ${season.productivityScHa} sc/ha`}
                  />
                  {/* Breakeven Yield */}
                  <div
                    style={{
                      width: '20px',
                      height: `${Math.max(beHeight, 4)}%`,
                      background: 'var(--color-secondary-600)',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                    title={`Ponto de Equilíbrio: ${season.breakevenYieldScHa} sc/ha`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X Axis Labels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${seasons.length}, 1fr)`,
            gap: 'var(--space-4)',
            paddingTop: 'var(--space-2)',
            textAlign: 'center',
          }}
        >
          {seasons.map((season) => (
            <div key={season.seasonId} className="flex-col" style={{ gap: '2px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: season.isCurrent ? '700' : '500',
                  color: season.isCurrent ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {season.seasonName
                  .replace(' (Histórico)', '')
                  .replace(' (Passada)', '')
                  .replace(' (Atual)', '')
                  .replace(' (Projetada)', '')}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                {viewMode === 'costPerHa'
                  ? `R$ ${season.costPerHa.toFixed(0)}/ha`
                  : viewMode === 'productivity'
                    ? `${season.productivityScHa} sc/ha`
                    : `R$ ${(season.grossRevenue / 1000000).toFixed(1)}M`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
