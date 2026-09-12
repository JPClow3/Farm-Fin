'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SEED_USERS } from '../../../db/seed';
import { UserRoleType } from '../../../lib/types';
import {
  Sprout,
  Tractor,
  FileSpreadsheet,
  CreditCard,
  UserCheck,
  LogIn,
  AlertCircle,
} from 'lucide-react';

import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('from') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // isDemoPersona: true only for the explicit "quick persona" buttons below —
  // those are known seed accounts and are allowed to fall back to a local-only
  // demo session if Neon Auth is unreachable. A real email/password submission
  // must NOT silently succeed on a network/service failure — the user needs to
  // know their login didn't actually go through.
  const handleLogin = async (
    userEmail: string,
    userRole?: UserRoleType,
    userPassword?: string,
    isDemoPersona: boolean = false
  ) => {
    setIsLoading(true);
    setErrorMessage('');

    const startDemoSession = () => {
      const token = `farmfin-token-${Date.now()}`;
      document.cookie = `farmfin_session=${token}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `better-auth.session_token=${token}; path=/; max-age=604800; SameSite=Lax`;

      const matchedUser = SEED_USERS.find(
        (u) => u.email.toLowerCase() === userEmail.toLowerCase()
      ) || {
        id: `u-${Date.now()}`,
        name: userEmail.split('@')[0],
        email: userEmail,
        role: userRole || 'Produtor',
      };
      localStorage.setItem('farmfin_active_user', JSON.stringify(matchedUser));
      document.cookie = `farmfin_demo_role=${matchedUser.role}; path=/; max-age=604800; SameSite=Lax`;

      router.push(returnTo);
      router.refresh();
    };

    try {
      // 1. Attempt official Neon Auth (Better Auth) login
      const res = await authClient.signIn.email({
        email: userEmail,
        password: userPassword || 'farmfin123',
      });

      if (res?.error) {
        // If Neon Auth returned an explicit error (e.g. invalid credentials)
        if (res.error.status === 401 || res.error.message?.includes('credentials')) {
          setErrorMessage('E-mail ou senha incorretos. Por favor, verifique seus dados.');
          setIsLoading(false);
          return;
        }
        // Any other backend error: demo personas can still fall back locally,
        // but a real login attempt must surface the failure.
        if (!isDemoPersona) {
          setErrorMessage(
            'Não foi possível autenticar no momento. Verifique sua conexão e tente novamente.'
          );
          setIsLoading(false);
          return;
        }
      }

      startDemoSession();
    } catch (err) {
      if (!isDemoPersona) {
        console.error('[handleLogin] Neon Auth request failed:', err);
        setErrorMessage(
          'Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente.'
        );
        setIsLoading(false);
        return;
      }
      console.warn('[handleLogin] Neon Auth unavailable, using local demo session:', err);
      startDemoSession();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Por favor, informe seu e-mail de acesso.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor, informe sua senha.');
      return;
    }
    handleLogin(email, 'Produtor', password, false);
  };

  return (
    <div
      style={{
        maxWidth: '460px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        padding: 'clamp(20px, 6vw, 36px)',
        color: '#1a2e22',
        boxSizing: 'border-box',
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
            marginBottom: '12px',
          }}
        >
          <Sprout size={30} color="#2A7A4C" strokeWidth={2.2} />
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
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
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            marginTop: '6px',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <LogIn size={16} />
          <span>{isLoading ? 'Autenticando no Neon Auth...' : 'Entrar no Sistema'}</span>
        </button>
      </form>

      {/* Link to Register */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <span style={{ fontSize: '13px', color: '#667085' }}>Não possui uma conta? </span>
        <Link
          href="/register"
          style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#2A7A4C',
            textDecoration: 'none',
          }}
        >
          Cadastre sua fazenda
        </Link>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        {SEED_USERS.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => handleLogin(user.email, user.role, undefined, true)}
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
              <span style={{ display: 'inline-flex', color: '#2A7A4C' }}>
                {user.role === 'Produtor' ? (
                  <UserCheck size={16} />
                ) : user.role === 'Gestor' ? (
                  <Tractor size={16} />
                ) : user.role === 'Contador' ? (
                  <FileSpreadsheet size={16} />
                ) : (
                  <CreditCard size={16} />
                )}
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
        Neon Auth (Better Auth) • Multi-tenant Ativo • RBAC Integrado
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
