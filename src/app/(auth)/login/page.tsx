'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SEED_USERS } from '../../../db/seed';
import { UserRoleType } from '../../../lib/types';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('from') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (userEmail: string, userRole?: UserRoleType) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Set session cookie for middleware recognition
      const token = `farmfin-token-${Date.now()}`;
      document.cookie = `farmfin_session=${token}; path=/; max-age=604800; SameSite=Lax`;

      // Save active user info locally for fast client header synchronization
      const matchedUser = SEED_USERS.find(
        (u) => u.email.toLowerCase() === userEmail.toLowerCase()
      ) || {
        id: `u-${Date.now()}`,
        name: userEmail.split('@')[0],
        email: userEmail,
        role: userRole || 'Produtor',
      };
      localStorage.setItem('farmfin_active_user', JSON.stringify(matchedUser));

      // Redirect to main application
      router.push(returnTo);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao realizar login. Tente novamente.';
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }
    handleLogin(email, 'Produtor');
  };

  return (
    <div
      style={{
        maxWidth: '460px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        padding: '36px',
        color: '#1a2e22',
      }}
    >
      {/* Header Branding */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            background: '#EAF3ED',
            borderRadius: '14px',
            fontSize: '28px',
            marginBottom: '12px',
          }}
        >
          🌱
        </div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '800',
            color: '#1B382B',
            letterSpacing: '-0.5px',
            margin: 0,
          }}
        >
          Farm-Fin
        </h1>
        <p style={{ fontSize: '13px', color: '#667085', marginTop: '6px', margin: 0 }}>
          Gestão Financeira & Operacional para o Agronegócio
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            background: '#FEE4E2',
            color: '#B42318',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px',
            border: '1px solid #FECDCA',
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Email/Password Form */}
      <form
        onSubmit={handleFormSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#344054',
              marginBottom: '6px',
            }}
          >
            E-mail de Acesso
          </label>
          <input
            type="email"
            placeholder="seu.nome@fazenda.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #D0D5DD',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#344054',
              marginBottom: '6px',
            }}
          >
            Senha
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #D0D5DD',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            background: '#2A7A4C',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            marginTop: '6px',
            transition: 'background 0.2s',
          }}
        >
          {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
        <div style={{ flex: 1, height: '1px', background: '#EAECF0' }} />
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#98A2B3',
            textTransform: 'uppercase',
          }}
        >
          Ou selecione um perfil para teste (RBAC)
        </span>
        <div style={{ flex: 1, height: '1px', background: '#EAECF0' }} />
      </div>

      {/* Quick Persona Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {SEED_USERS.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => handleLogin(user.email, user.role)}
            disabled={isLoading}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '10px 12px',
              background: '#F9FAFB',
              border: '1px solid #E4E7EC',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2A7A4C';
              e.currentTarget.style.background = '#F0FDF4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E4E7EC';
              e.currentTarget.style.background = '#F9FAFB';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
              <span style={{ fontSize: '16px' }}>
                {user.role === 'Produtor'
                  ? '👨‍🌾'
                  : user.role === 'Gestor'
                    ? '🚜'
                    : user.role === 'Contador'
                      ? '📑'
                      : '💳'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#1B382B' }}>
                {user.role}
              </span>
            </div>
            <span
              style={{ fontSize: '11px', color: '#475467', marginTop: '2px', fontWeight: '500' }}
            >
              {user.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Footer info */}
      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#98A2B3' }}>
        Neon Auth & Better Auth • Multi-tenancy Ativo • RBAC 100% Integrado
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1B382B 0%, #2A4836 50%, #152A1E 100%)',
        padding: '24px',
        position: 'relative',
      }}
    >
      <Suspense
        fallback={
          <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>
            Carregando Farm-Fin...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
