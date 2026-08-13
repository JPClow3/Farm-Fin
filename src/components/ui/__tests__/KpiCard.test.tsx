import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KpiCard } from '../KpiCard';

describe('KpiCard Component', () => {
  it('renders label and formatted value', () => {
    render(
      <KpiCard label="Saldo Bancário Total" value="R$ 1.453.430,00" icon="🏦" iconColor="green" />
    );

    expect(screen.getByText('Saldo Bancário Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.453.430,00')).toBeInTheDocument();
    expect(screen.getByText('🏦')).toBeInTheDocument();
  });

  it('renders trend badge and subtext when provided', () => {
    render(
      <KpiCard
        label="Contas a Pagar no Mês"
        value="R$ 570.700,00"
        trend={{ value: '12%', direction: 'down', label: 'vs. safra anterior' }}
        subtext="2 títulos a vencer esta semana"
      />
    );

    expect(screen.getByText('↓ 12%')).toBeInTheDocument();
    expect(screen.getByText('2 títulos a vencer esta semana')).toBeInTheDocument();
  });
});
