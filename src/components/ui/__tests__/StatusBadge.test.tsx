import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge Component', () => {
  it('renders "Pago" status with correct badge class', () => {
    render(<StatusBadge status="pago" />);
    const badge = screen.getByText('Pago');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge--pago');
  });

  it('renders "Pendente" status correctly', () => {
    render(<StatusBadge status="pendente" />);
    const badge = screen.getByText('Pendente');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge--pendente');
  });

  it('renders "Vencido" status correctly', () => {
    render(<StatusBadge status="vencido" />);
    const badge = screen.getByText('Vencido');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge--vencido');
  });

  it('allows custom label override', () => {
    render(<StatusBadge status="pago" label="Liquidado" />);
    expect(screen.getByText('Liquidado')).toBeInTheDocument();
  });
});
