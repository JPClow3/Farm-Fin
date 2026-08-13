'use client';

import React from 'react';
import { ClayButton } from '../components/ui/ClayButton';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
      <div style={{ fontSize: '4rem' }}>⚠️</div>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
        Ocorreu um erro no sistema
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '480px' }}>
        {error?.message || 'Não foi possível processar a requisição atual.'}
      </p>
      <ClayButton variant="primary" onClick={() => reset()}>
        Tentar Novamente
      </ClayButton>
    </div>
  );
}
