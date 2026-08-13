'use client';

import React from 'react';
import Link from 'next/link';
import { ClayButton } from '../components/ui/ClayButton';
import { Sprout, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px',
        gap: '16px',
      }}
    >
      <Sprout size={56} color="var(--color-primary-600)" strokeWidth={1.8} />
      <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
        404 — Página Não Encontrada
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '480px' }}>
        A página solicitada não foi localizada ou foi movida.
      </p>
      <Link href="/">
        <ClayButton variant="primary">
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Voltar para o Painel
        </ClayButton>
      </Link>
    </div>
  );
}
