'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { CashFlowChart } from '../../components/charts/CashFlowChart';
import { ClayTabs } from '../../components/ui/ClayTabs';
import { getCashFlowReport, CashFlowRow } from '../../actions/finance';

export default function FluxoDeCaixaPage() {
  const { bankAccounts, activeFarmId } = useFarm();

  const [periodTab, setPeriodTab] = useState<string>('mensal');
  const [scenario, setScenario] = useState<'realista' | 'otimista' | 'pessimista'>('realista');
  const [reportRows, setReportRows] = useState<CashFlowRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCashFlow() {
      setIsLoading(true);
      try {
        const res = await getCashFlowReport(undefined, activeFarmId);
        if (res.success && res.data && res.data.length > 0) {
          setReportRows(res.data);
        }
      } catch (e) {
        console.error('Failed to load cash flow from DB:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadCashFlow();
  }, [activeFarmId]);

  // Adjust for active scenario multiplier
  const mult = scenario === 'otimista' ? 1.15 : scenario === 'pessimista' ? 0.85 : 1.0;
  const outMult = scenario === 'pessimista' ? 1.08 : 1.0;

  const adjustedRows = useMemo(() => {
    let running = reportRows.length > 0 ? reportRows[0].initialBalance : 1420000;
    return reportRows.map((row) => {
      const adjIn = row.inflows * mult;
      const adjOut = row.outflows * outMult;
      const adjNet = adjIn - adjOut;
      const finalBal = running + adjNet;
      const r = {
        ...row,
        initialBalance: running,
        inflows: adjIn,
        outflows: adjOut,
        netFlow: adjNet,
        finalBalance: finalBal,
      };
      running = finalBal;
      return r;
    });
  }, [reportRows, mult, outMult]);

  // Transform for chart
  const chartData = useMemo(() => {
    return adjustedRows.map((r) => ({
      month: r.period.split(' ')[0],
      inflow: r.inflows,
      outflow: r.outflows,
      balance: r.finalBalance,
    }));
  }, [adjustedRows]);

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Fluxo de Caixa & Projeções</h1>
          <p className="page-subtitle">
            Análise de liquidez em tempo real, saldo projetado por conta e simulação de cenários de
            safra
          </p>
        </div>

        {/* Scenario Buttons */}
        <div
          className="flex-row"
          style={{
            background: 'var(--bg-surface-2)',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'bold',
              padding: '0 8px',
              color: 'var(--text-secondary)',
            }}
          >
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
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                }}
              >
                {b.bankName}
              </span>
              <span className="badge badge--primary" style={{ fontSize: '10px' }}>
                {b.type}
              </span>
            </div>
            <div
              className="td-money"
              style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}
            >
              R$ {Number(b.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              Entradas vs Saídas com projeção de saldo apurada a partir de lançamentos e contratos
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

        <CashFlowChart data={chartData.length > 0 ? chartData : undefined} scenario={scenario} />
      </ClayCard>

      {/* Detailed Cash Flow Ledger Table */}
      <ClayCard>
        <div className="card-header">
          <div>
            <h2 className="card-title">Demonstrativo Detalhado de Fluxo de Caixa</h2>
            <p className="card-subtitle">
              Valores expressos em Reais (R$) calculados a partir das contas bancárias e baixas do
              sistema
            </p>
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
                  <td style={{ fontWeight: '600' }}>
                    {row.period}
                    {row.isProjected && (
                      <span
                        className="badge badge--neutral"
                        style={{ marginLeft: '8px', fontSize: '10px' }}
                      >
                        Projeção
                      </span>
                    )}
                  </td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--text-secondary)' }}
                  >
                    R$ {row.initialBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--color-primary-700)' }}
                  >
                    + R$ {row.inflows.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="td-money"
                    style={{ textAlign: 'right', color: 'var(--color-secondary-600)' }}
                  >
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
              {adjustedRows.length === 0 && !isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}
                  >
                    Nenhum lançamento no período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ClayCard>
    </div>
  );
}
