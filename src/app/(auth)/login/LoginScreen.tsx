'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sprout,
  LogIn,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Smartphone,
  BarChart3,
} from 'lucide-react';
import { ClayButton } from '@/components/ui/ClayButton';
import { authClient } from '@/lib/auth-client';
import { normalizeLoginIdentifier } from '@/lib/loginIdentifier';
import type { EnabledAuthMethods } from '@/lib/authMethods';
import styles from './login.module.css';

type Mode = 'password' | 'magicLink' | 'magicLinkSent' | 'twoFactor';

// Mensagens para ?error= devolvido pelo Better Auth (Magic Link / OAuth)
const CALLBACK_ERRORS: Record<string, string> = {
  INVALID_TOKEN: 'Este link de acesso é inválido ou já foi usado. Peça um novo.',
  EXPIRED_TOKEN: 'Este link de acesso expirou. Peça um novo.',
  access_denied: 'O acesso foi cancelado no provedor de login.',
};

/** Aceita apenas caminhos internos, evitando redirecionamento para outros sites */
function safeReturnTo(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function saveActiveUser(user: {
  id?: string;
  name?: string;
  email?: string;
  username?: string | null;
  role?: string;
}) {
  try {
    localStorage.setItem('farmfin_active_user', JSON.stringify(user));
  } catch {}
}

export function LoginScreen({ methods }: { methods: EnabledAuthMethods }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('from'));
  const callbackError = searchParams.get('error');

  const [mode, setMode] = useState<Mode>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState(
    callbackError
      ? CALLBACK_ERRORS[callbackError] || 'Não foi possível concluir o login. Tente novamente.'
      : ''
  );

  const isBusy = pending !== null;
  const hasSocial = methods.google || methods.microsoft;

  const finishLogin = () => {
    router.push(returnTo);
    router.refresh();
  };

  const switchMode = (next: Mode) => {
    setErrorMessage('');
    setCode('');
    setMode(next);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Informe sua senha.');
      return;
    }
    const normalizedIdentifier = normalizeLoginIdentifier(identifier);
    if (normalizedIdentifier.type === 'invalid') {
      setErrorMessage(normalizedIdentifier.message);
      return;
    }

    setPending('password');
    try {
      // O mesmo campo aceita e-mail ou nome de usuário normalizado
      const res =
        normalizedIdentifier.type === 'email'
          ? await authClient.signIn.email({ email: normalizedIdentifier.value, password })
          : await authClient.signIn.username({ username: normalizedIdentifier.value, password });
      if (res.error) {
        setErrorMessage(
          res.error.status === 401 || res.error.status === 400
            ? 'Usuário ou senha incorretos. Confira e tente de novo.'
            : 'Não foi possível entrar agora. Tente novamente em instantes.'
        );
        return;
      }
      if (res.data && 'twoFactorRedirect' in res.data && res.data.twoFactorRedirect) {
        switchMode('twoFactor');
        return;
      }
      if (res.data && 'user' in res.data) saveActiveUser(res.data.user);
      finishLogin();
    } catch {
      setErrorMessage('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
    } finally {
      setPending(null);
    }
  };

  const handleTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setPending('twoFactor');
    try {
      const res = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({ code: code.trim(), trustDevice })
        : await authClient.twoFactor.verifyTotp({ code: code.trim(), trustDevice });
      if (res.error) {
        setErrorMessage(
          useBackupCode
            ? 'Código de recuperação inválido.'
            : 'Código incorreto ou expirado. Use o código atual do aplicativo autenticador.'
        );
        return;
      }
      if (res.data && 'user' in res.data) saveActiveUser(res.data.user);
      finishLogin();
    } catch {
      setErrorMessage('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
    } finally {
      setPending(null);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const rawEmail = identifier.trim().toLowerCase();
    if (!rawEmail || !rawEmail.includes('@')) {
      setErrorMessage('Informe um e-mail válido para receber o link de acesso.');
      return;
    }
    setPending('magicLink');
    try {
      const res = await authClient.signIn.magicLink({
        email: rawEmail,
        callbackURL: returnTo,
        errorCallbackURL: '/login',
      });
      if (res.error) {
        setErrorMessage('Não foi possível enviar o link agora. Tente novamente em instantes.');
        return;
      }
      switchMode('magicLinkSent');
    } catch {
      setErrorMessage('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
    } finally {
      setPending(null);
    }
  };

  const handleSocial = async (provider: 'google' | 'microsoft') => {
    setErrorMessage('');
    setPending(provider);
    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: returnTo,
        errorCallbackURL: '/login',
      });
      if (res?.error) {
        setErrorMessage('Não foi possível iniciar o login com o provedor. Tente novamente.');
        setPending(null);
      }
      // Em caso de sucesso o navegador é redirecionado ao provedor
    } catch {
      setErrorMessage('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
      setPending(null);
    }
  };

  const alert = errorMessage && (
    <div className={styles.alert} role="alert" aria-live="polite">
      <AlertCircle size={16} aria-hidden="true" />
      <span>{errorMessage}</span>
    </div>
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.brand} aria-label="Farm-Fin">
          <div className={styles.logo}>
            <Sprout size={30} strokeWidth={2.2} aria-hidden="true" />
          </div>
          <span className={styles.brandName}>Farm-Fin</span>
          <p className={styles.tagline}>
            Gestão financeira do produtor rural, com a linguagem do campo.
          </p>
          <ul className={styles.brandHighlights}>
            <li>
              <BarChart3 size={18} aria-hidden="true" />
              Contas, fluxo de caixa e custo por talhão em um só lugar
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden="true" />
              Permissões pensadas para cada integrante da fazenda
            </li>
            <li>
              <Smartphone size={18} aria-hidden="true" />
              Feito para usar no escritório e no campo, pelo celular
            </li>
          </ul>
        </section>

        <div className={styles.card}>
          {mode === 'twoFactor' ? (
            <>
              <div>
                <h1 className={styles.cardTitle}>Verificação em duas etapas</h1>
                <p className={styles.cardSubtitle}>
                  {useBackupCode
                    ? 'Digite um dos seus códigos de recuperação.'
                    : 'Digite o código de 6 dígitos do seu aplicativo autenticador.'}
                </p>
              </div>
              {alert}
              <form className={styles.form} onSubmit={handleTwoFactor}>
                <div className={styles.field}>
                  <label htmlFor="login-code" className="input-label">
                    {useBackupCode ? 'Código de recuperação' : 'Código'}
                  </label>
                  <input
                    id="login-code"
                    className={`input ${useBackupCode ? '' : styles.codeInput}`}
                    value={code}
                    onChange={(e) =>
                      setCode(
                        useBackupCode
                          ? e.target.value
                          : e.target.value.replace(/\D/g, '').slice(0, 6)
                      )
                    }
                    inputMode={useBackupCode ? 'text' : 'numeric'}
                    autoComplete="one-time-code"
                    placeholder={useBackupCode ? 'xxxxx-xxxxx' : '000000'}
                    required
                    autoFocus
                  />
                </div>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                  />
                  Confiar neste aparelho por 30 dias
                </label>
                <ClayButton
                  type="submit"
                  size="lg"
                  className={styles.fullWidth}
                  loading={pending === 'twoFactor'}
                  disabled={useBackupCode ? !code.trim() : code.length !== 6}
                >
                  <ShieldCheck size={18} aria-hidden="true" />
                  Verificar e entrar
                </ClayButton>
              </form>
              <div className={styles.centerText}>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setCode('');
                    setErrorMessage('');
                  }}
                >
                  {useBackupCode
                    ? 'Usar o aplicativo autenticador'
                    : 'Usar um código de recuperação'}
                </button>
              </div>
              <div className={styles.centerText}>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => switchMode('password')}
                >
                  <ArrowLeft size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} />{' '}
                  Voltar
                </button>
              </div>
            </>
          ) : mode === 'magicLinkSent' ? (
            <>
              <div className={styles.notice} role="status">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>
                  Enviamos um link de acesso para <strong>{identifier}</strong>. Abra o e-mail neste
                  aparelho e toque no link. Ele vale por 5 minutos.
                </span>
              </div>
              <div className={styles.centerText}>
                Não chegou? Veja a caixa de spam ou{' '}
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => switchMode('magicLink')}
                >
                  envie de novo
                </button>
                .
              </div>
              <div className={styles.centerText}>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => switchMode('password')}
                >
                  Entrar com senha
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h1 className={styles.cardTitle}>Entrar</h1>
                <p className={styles.cardSubtitle}>
                  {mode === 'magicLink'
                    ? 'Receba um link de acesso por e-mail, sem precisar de senha.'
                    : 'Use seu e-mail ou usuário e a senha da sua conta.'}
                </p>
              </div>

              {alert}

              <form
                className={styles.form}
                onSubmit={mode === 'magicLink' ? handleMagicLink : handlePasswordLogin}
              >
                <div className={styles.field}>
                  <label htmlFor="login-identifier" className="input-label">
                    {mode === 'magicLink' ? 'E-mail' : 'E-mail ou usuário'}
                  </label>
                  <input
                    id="login-identifier"
                    type={mode === 'magicLink' ? 'email' : 'text'}
                    className="input"
                    placeholder={
                      mode === 'magicLink'
                        ? 'seu.nome@fazenda.com.br'
                        : 'seu.nome@fazenda.com.br ou usuário'
                    }
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-describedby="login-identifier-hint"
                    aria-invalid={Boolean(errorMessage)}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                  <span id="login-identifier-hint" className={styles.fieldHint}>
                    {mode === 'magicLink'
                      ? 'Usaremos este endereço apenas para enviar seu link de acesso.'
                      : 'Você pode entrar com o e-mail cadastrado ou seu nome de usuário.'}
                  </span>
                </div>

                {mode === 'password' && (
                  <div className={styles.field}>
                    <div className={styles.labelRow}>
                      <label htmlFor="login-password" className="input-label">
                        Senha
                      </label>
                    </div>
                    <div className={styles.passwordWrap}>
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        className="input"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className={styles.revealButton}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                <ClayButton
                  type="submit"
                  size="lg"
                  className={styles.fullWidth}
                  loading={pending === 'password' || pending === 'magicLink'}
                  disabled={isBusy}
                >
                  {mode === 'magicLink' ? (
                    <>
                      <Mail size={18} aria-hidden="true" />
                      Enviar link de acesso
                    </>
                  ) : (
                    <>
                      <LogIn size={18} aria-hidden="true" />
                      Entrar
                    </>
                  )}
                </ClayButton>
              </form>

              {methods.magicLink && (
                <div className={styles.centerText}>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => switchMode(mode === 'magicLink' ? 'password' : 'magicLink')}
                  >
                    {mode === 'magicLink'
                      ? 'Entrar com senha'
                      : 'Entrar sem senha, com link por e-mail'}
                  </button>
                </div>
              )}

              {hasSocial && (
                <>
                  <div className={styles.divider}>ou continue com</div>
                  <div className={styles.socialRow}>
                    {methods.google && (
                      <ClayButton
                        variant="outline"
                        className={styles.fullWidth}
                        loading={pending === 'google'}
                        disabled={isBusy}
                        onClick={() => handleSocial('google')}
                      >
                        Google
                      </ClayButton>
                    )}
                    {methods.microsoft && (
                      <ClayButton
                        variant="outline"
                        className={styles.fullWidth}
                        loading={pending === 'microsoft'}
                        disabled={isBusy}
                        onClick={() => handleSocial('microsoft')}
                      >
                        Microsoft
                      </ClayButton>
                    )}
                  </div>
                </>
              )}

              <div className={styles.centerText}>
                Ainda não tem conta? <Link href="/register">Cadastre sua fazenda</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
