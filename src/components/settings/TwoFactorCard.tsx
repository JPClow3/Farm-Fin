'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, ShieldOff, KeyRound } from 'lucide-react';
import { ClayCard } from '../ui/ClayCard';
import { ClayButton } from '../ui/ClayButton';
import { ClayInput } from '../ui/ClayInput';
import { useToast } from '../../context/ToastContext';
import { authClient } from '../../lib/auth-client';

type Step = 'idle' | 'setup';

/**
 * Two-factor authentication (TOTP) for real Better Auth accounts.
 * Demo personas have no password, so the card only explains the feature.
 */
export function TwoFactorCard() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const { addToast } = useToast();

  const [step, setStep] = useState<Step>('idle');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [totpURI, setTotpURI] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const user = session?.user as { twoFactorEnabled?: boolean | null } | undefined;
  const enabled = Boolean(user?.twoFactorEnabled);
  const secret = totpURI ? new URL(totpURI).searchParams.get('secret') : null;

  const reset = () => {
    setStep('idle');
    setPassword('');
    setCode('');
    setTotpURI('');
    setBackupCodes([]);
    setError('');
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await authClient.twoFactor.enable({ password }).catch(() => null);
    setBusy(false);
    if (!res || res.error || !res.data) {
      setError('Senha incorreta ou serviço indisponível.');
      return;
    }
    setTotpURI(res.data.totpURI);
    setBackupCodes(res.data.backupCodes);
    setPassword('');
    setStep('setup');
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await authClient.twoFactor.verifyTotp({ code: code.trim() }).catch(() => null);
    setBusy(false);
    if (!res || res.error) {
      setError('Código incorreto. Confira o horário do celular e tente o código atual.');
      return;
    }
    addToast({
      type: 'success',
      title: 'Verificação em duas etapas ativada',
      message: 'O código do aplicativo será pedido nos próximos logins.',
    });
    reset();
    refetch();
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await authClient.twoFactor.disable({ password }).catch(() => null);
    setBusy(false);
    if (!res || res.error) {
      setError('Senha incorreta ou serviço indisponível.');
      return;
    }
    addToast({ type: 'info', title: 'Verificação em duas etapas desativada' });
    reset();
    refetch();
  };

  return (
    <ClayCard>
      <div className="card-header">
        <h2 className="card-title">Verificação em duas etapas</h2>
      </div>

      {isPending ? (
        <p className="card-subtitle">Carregando…</p>
      ) : !session ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Disponível para contas com e-mail e senha. Perfis de demonstração não usam senha, então
          não podem ativar este recurso.
        </p>
      ) : step === 'setup' ? (
        <form className="flex-col" style={{ gap: 'var(--space-4)' }} onSubmit={handleConfirm}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            1. Escaneie o QR code com um aplicativo autenticador (Google Authenticator, Microsoft
            Authenticator, Authy…).
          </p>
          <div
            style={{
              alignSelf: 'center',
              padding: 'var(--space-3)',
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <QRCodeSVG value={totpURI} size={176} aria-label="QR code para o aplicativo autenticador" />
          </div>
          {secret && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              No celular? <a href={totpURI}>Abra direto no aplicativo</a> ou digite a chave{' '}
              <code style={{ wordBreak: 'break-all' }}>{secret}</code>
            </p>
          )}
          <div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              2. Guarde estes códigos de recuperação. Cada um funciona uma vez, caso você perca o
              celular:
            </p>
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 'var(--space-2)',
                margin: 'var(--space-2) 0 0',
                padding: 'var(--space-3)',
                listStyle: 'none',
                background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 'var(--text-sm)',
              }}
            >
              {backupCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <ClayInput
            label="3. Código do aplicativo"
            id="two-factor-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            error={error || undefined}
          />
          <div className="flex-row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <ClayButton type="submit" loading={busy} disabled={code.length !== 6}>
              <ShieldCheck size={16} aria-hidden="true" />
              Confirmar e ativar
            </ClayButton>
            <ClayButton type="button" variant="ghost" onClick={reset} disabled={busy}>
              Cancelar
            </ClayButton>
          </div>
        </form>
      ) : (
        <form
          className="flex-col"
          style={{ gap: 'var(--space-4)' }}
          onSubmit={enabled ? handleDisable : handleStart}
        >
          <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
            <span className={`badge ${enabled ? 'badge--success' : 'badge--neutral'}`}>
              {enabled ? 'Ativada' : 'Desativada'}
            </span>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {enabled
              ? 'Além da senha, o login pede o código do aplicativo autenticador.'
              : 'Proteja sua conta pedindo, além da senha, um código do aplicativo autenticador no celular.'}
          </p>
          <ClayInput
            label="Confirme sua senha"
            id="two-factor-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<KeyRound size={16} />}
            error={error || undefined}
          />
          <div>
            <ClayButton
              type="submit"
              variant={enabled ? 'danger' : 'primary'}
              loading={busy}
              disabled={!password}
            >
              {enabled ? (
                <>
                  <ShieldOff size={16} aria-hidden="true" />
                  Desativar
                </>
              ) : (
                <>
                  <ShieldCheck size={16} aria-hidden="true" />
                  Ativar verificação em duas etapas
                </>
              )}
            </ClayButton>
          </div>
        </form>
      )}
    </ClayCard>
  );
}
