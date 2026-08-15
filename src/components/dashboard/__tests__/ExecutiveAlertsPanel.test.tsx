import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExecutiveAlertsPanel } from '../ExecutiveAlertsPanel';
import * as FarmContextModule from '../../../context/FarmContext';

// Mock Next.js useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('ExecutiveAlertsPanel Component', () => {
  it('renders empty state when there are no alerts', () => {
    vi.spyOn(FarmContextModule, 'useFarm').mockReturnValue({
      activePayables: [],
      activeReceivables: [],
      activeStockItems: [],
      bankStatements: [],
      approvePayable: vi.fn(),
    } as any);

    render(<ExecutiveAlertsPanel />);

    expect(screen.getByText('Painel de Alertas Prioritários')).toBeInTheDocument();
    expect(screen.getByText('Nenhum alerta crítico ativo no momento!')).toBeInTheDocument();
  });

  it('aggregates and displays top critical alerts when payables are overdue and stock is low', () => {
    vi.spyOn(FarmContextModule, 'useFarm').mockReturnValue({
      activePayables: [
        {
          id: 'pay-1',
          farmId: 'farm-1',
          supplierName: 'AgroQuímica MT',
          description: 'Defensivos Glifosato',
          amount: 45000,
          dueDate: '2020-01-01',
          status: 'vencido',
        },
      ],
      activeReceivables: [],
      activeStockItems: [
        {
          id: 'stock-1',
          farmId: 'farm-1',
          name: 'Óleo Diesel S10',
          quantity: 200,
          minQuantity: 1000,
          unit: 'L',
          category: 'Combustíveis',
          averageCost: 6.2,
        },
      ],
      bankStatements: [],
      approvePayable: vi.fn(),
    } as any);

    render(<ExecutiveAlertsPanel />);

    expect(screen.getByText('Painel de Alertas Prioritários')).toBeInTheDocument();
    expect(screen.getByText('Top 2')).toBeInTheDocument();
    expect(screen.getByText('Conta Vencida: Defensivos Glifosato')).toBeInTheDocument();
    expect(screen.getByText('Estoque Crítico: Óleo Diesel S10')).toBeInTheDocument();
    expect(screen.getByText('Pagar Agora')).toBeInTheDocument();
    expect(screen.getByText('Repor Insumo')).toBeInTheDocument();
  });
});
