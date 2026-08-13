'use client';

import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { KpiCard } from '../../components/ui/KpiCard';
import { CashFlowChart } from '../../components/charts/CashFlowChart';
import { ClayTabs } from '../../components/ui/ClayTabs';

interface FlowRow {
  period: string;
  initialBalance: number;
  inflows: number;
  outflows: number;
  netFlow: number;
  finalBalance: number;
}

export default function FluxoDeCaixaPage() {
  const { bankAccounts, kpis } = useFarm();

  const [periodTab, setPeriodTab] = useState<string>('mensal');
  const [scenario, setScenario] = useState<'realista' | 'otimista' | 'pessimista'>('realista');

  // Simulated Monthly Cash Flow Ledger
  const monthlyData: FlowRow[] = [
    { period: 'Março 2026', initialBalance: 1420000, inflows: 350000, outflows: 480000, netFlow: -130000, finalBalance: 1290000 },
    { period: 'Abril 2026', initialBalance: 1290000, inflows: 920000, outflows: 320000, netFlow: 600000, finalBalance: 1890000 },
    { period: 'Maio 2026', initialBalance: 1890000, inflows: 2150000, outflows: 560000, netFlow: 1590000, finalBalance: 3480000 },
    { period: 'Junho 2026', initialBalance: 3480000, inflows: 1450000, outflows: 610000, netFlow: 840000, finalBalance: 4320000 },
    { period: 'Julho 2026', initialBalance: 4320000, inflows: 880000, outflows: 420000, netFlow: 460000, finalBalance: 4780000 },
    { period: 'Agosto 2026 (Atual)', initialBalance: 4780000, inflows: 1350000, outflows: 649000, netFlow: 701000, finalBalance: 5481000 },
    { period: 'Setembro 2026 (Proj)', initialBalance: 5481000, inflows: 1870000, outflows: 750000, netFlow: 1120000, finalBalance: 6601000 },
    { period: 'Outubro 2026 (Proj)', initialBalance: 6601000, inflows: 950000, outflows: 890000, netFlow: 60000, finalBalance: 6661000 },
  ];

  // Adjust for active scenario
  const mult = scenario === 'otimista' ? 1.15 : scenario === 'pessimista' ? 0.85 : 1.0;

  const adjustedRows = monthlyData.map((row) => {
    const adjIn = row.inflows * mult;
    const adjOut = row.outflows * (scenario === 'pessimista' ? 1.08 : 1.0);
    const adjNet = adjIn - adjOut;
    return {
      ...row,
      inflows: adjIn,
      outflows: adjOut,
      netFlow: adjNet,
      finalBalance: row.initialBalance + adjNet,
    };
  });

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Fluxo de Caixa & Projeções</h1>
          <p className="page-subtitle">
            Análise de liquidez, saldo projetado por conta e simulação de cenários de safra
          </p>
        </div>

        {/* Scenario Buttons */}
        <div className="flex-row" style={{ background: 'var(--bg-surface-2)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', padding: '0 8px', color: 'var(--text-secondary)' }}>
            Cenário:
          </span>
          <button
            type="button"
            className={`filter-pill ${scenario === 'realista' ? 'active' : ''}`}
            onClick={() => setScenario('realista')}
          >
            Realista (Base)
          </button>
          <button
            type="button"
            className={`filter-pill ${scenario === 'otimista' ? 'active' : ''}`}
            onClick={() => setScenario('otimista')}
          >
            🌱 Otimista (+15%)
          </button>
          <button
            type="button"
            className={`filter-pill ${scenario === 'pessimista' ? 'active' : ''}`}
            onClick={() => setScenario('pessimista')}
          >
            ⚠️ Pessimista (-15%)
          </button>
        </div>
      </div>

      {/* Top Bank Accounts Strip */}
      <div className="grid-3">
        {bankAccounts.map((b) => (
          <ClayCard key={b.id} size="sm">
            <div className="flex-between" style={{ marginBottom: '4px' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {b.bankName}
              </span>
              <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                {b.type}
              </span>
            </div>
            <div className="td-money" style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>
              R$ {b.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Ag: {b.agency} • CC: {b.accountNumber}
            </div>
          </ClayCard>
        ))}
      </div>

      {/* Main Chart Card */}
      <ClayCard>
        <div className="card-header flex-between flex-wrap" style={{ gap: 'var(--space-4)' }}>
          <div>
            <h2 className="card-title">Evolução do Fluxo de Caixa (Safra 2025/2026)</h2>
            <p className="card-subtitle">
              Entradas vs Saídas com projeção de saldo até o encerramento do ciclo agrícola
            </p>
          </div>

          <ClayTabs
            tabs={[
              { id: 'diaria', label: 'Diário' },
              { id: 'semanal', label: 'Semanal' },
              { id: 'mensal', label: 'Mensal' },
              { id: 'anual', label: 'Safra Anual' },
            ]}
            activeTab={periodTab}
            onChange={setPeriodTab}
            style={{ maxWidth: '340px' }}
          />
        </div>

        <CashFlowChart scenario={scenario} />
      </ClayCard>

      {/* Detailed Cash Flow Ledger Table */}
      <ClayCard>
        <div className="card-header">
          <div>
            <h2 className="card-title">Demonstrativo Detalhado de Fluxo de Caixa</h2>
            <p className="card-subtitle">Valores expressos em Reais (R$)</p>
          </div>
        </div>

        <div className="clay-table-wrapper">
          <table className="clay-table">
            <thead>
              <tr>
                <th>Período</th>
                <th style={{ textAlign: 'right' }}>Saldo Inicial</th>
                <th style={{ textAlign: 'right' }}>(+) Entradas</th>
                <th style={{ textAlign: 'right' }}>(-) Saídas</th>
                <th style={{ textAlign: 'right' }}>(=) Resultado Líquido</th>
                <th style={{ textAlign: 'right' }}>Saldo Final</th>
              </tr>
            </thead>
            <tbody>
              {adjustedRows.map((row) => (
                <tr key={row.period}>
                  <td style={{ fontWeight: '600' }}>{row.period}</td>
                  <td className="td-money" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    R$ {row.initialBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="td-money" style={{ textAlign: 'right', color: 'var(--color-primary-700)' }}>
                    + R$ {row.inflows.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="td-money" style={{ textAlign: 'right', color: 'var(--color-secondary-600)' }}>
                    - R$ {row.outflows.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="td-money"
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: row.netFlow >= 0 ? 'var(--color-primary-700)' : 'var(--color-danger)',
                    }}
                  >
                    {row.netFlow >= 0 ? '+' : ''} R${' '}
                    {row.netFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="td-money" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    R$ {row.finalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ClayCard>
    </div>
  );
}
