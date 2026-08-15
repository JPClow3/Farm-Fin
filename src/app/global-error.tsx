'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// This route replaces the entire root layout on a catastrophic error, so it
// cannot rely on globals.css/design-system tokens having loaded — every
// color/shadow below is a hardcoded value mirroring the Clay palette.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          padding: '24px',
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#faf8f5',
          color: '#3d362e',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '9999px',
            background: '#fde8e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <AlertTriangle size={34} color="#a33727" strokeWidth={1.8} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px' }}>
          Algo deu errado
        </h2>
        <p style={{ color: '#786a5c', maxWidth: '420px', margin: '0 0 24px', fontSize: '14px' }}>
          {error?.message || 'Ocorreu uma falha inesperada e não foi possível carregar o Farm-Fin.'}
        </p>
        <button
          onClick={() => reset()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            background: '#5f7d52',
            color: '#ffffff',
            fontFamily: 'inherit',
            fontWeight: 700,
            fontSize: '14px',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '6px 6px 12px rgba(95, 125, 82, 0.2)',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={16} />
          Tentar Novamente
        </button>
      </body>
    </html>
  );
}
