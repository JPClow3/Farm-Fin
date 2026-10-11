'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { registerUserAction } from '@/actions/auth';
import { UserRoleType } from '@/lib/types';
import { ClayCard } from '@/components/ui/ClayCard';
import { ClayInput } from '@/components/ui/ClayInput';
import { ClayButton } from '@/components/ui/ClayButton';
import {
  Sprout,
  Tractor,
  FileSpreadsheet,
  CreditCard,
  UserCheck,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  ArrowRight,
} from 'lucide-react';

function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [role, setRole] = useState<UserRoleType>('Produtor');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0 to 5
  };

  const passwordScore = calculatePasswordStrength(password);

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return { label: 'Fraca', color: 'var(--color-danger)' };
    if (score <= 3) return { label: 'Média', color: 'var(--color-warning)' };
    return { label: 'Forte', color: 'var(--color-success)' };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const newErrors: Record<string, string> = {};

    // Validations
    if (!name.trim()) {
      newErrors.name = 'Por favor, informe seu nome completo.';
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      newErrors.username = 'Por favor, defina um nome de usuário.';
    } else {
      const usernameRegex = /^[a-zA-Z0-9._-]+$/;
      if (
        normalizedUsername.length < 3 ||
        normalizedUsername.length > 30 ||
        !usernameRegex.test(normalizedUsername)
      ) {
        newErrors.username =
          'Nome de usuário deve ter entre 3 e 30 caracteres e conter apenas letras, números, pontos, hífens ou sublinhados.';
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      newErrors.email = 'Por favor, informe um e-mail válido.';
    }

    if (!organizationName.trim()) {
      newErrors.organizationName = 'Por favor, informe o nome da sua fazenda ou propriedade.';
    }

    if (password.length < 6) {
      newErrors.password = 'A senha deve conter no mínimo 6 caracteres.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem. Verifique a confirmação.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMessage('Verifique os campos destacados e tente novamente.');
      return;
    }

    setErrors({});
    setIsLoading(true);

    // 1. Register with Better Auth / Neon Auth API with username
    try {
      const authRes = await authClient.signUp.email({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        username: normalizedUsername,
      });

      if (authRes?.error) {
        const isUsername = authRes.error.message?.toLowerCase().includes('username');
        const isDuplicate =
          authRes.error.message?.toLowerCase().includes('already exists') ||
          authRes.error.status === 422;
        const msg = isDuplicate
          ? isUsername
            ? 'Este nome de usuário já está em uso. Escolha outro.'
            : 'Este e-mail já está cadastrado. Tente fazer login.'
          : 'Não foi possível criar sua conta agora. Tente novamente em instantes.';

        if (isDuplicate) {
          setErrors({ [isUsername ? 'username' : 'email']: msg });
        }
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }
    } catch {
      setErrorMessage(
        'Não foi possível conectar ao serviço de acesso. Tente novamente em instantes.'
      );
      setIsLoading(false);
      return;
    }

    // 2. Initialize Tenant Organization & Farm record in the database.
    try {
      const tenantRes = await registerUserAction({
        name: name.trim(),
        username: normalizedUsername,
        email: email.trim().toLowerCase(),
        password,
        organizationName: organizationName.trim(),
        role,
      });

      if (!tenantRes.success) {
        setErrorMessage(tenantRes.error || 'Erro ao realizar cadastro.');
        setIsLoading(false);
        return;
      }

      const assignedOrgId = tenantRes.organization?.id || `org-${Date.now()}`;
      const assignedUserId = tenantRes.user?.id || `u-${Date.now()}`;

      // Save active user in localStorage
      const activeUser = {
        id: assignedUserId,
        organizationId: assignedOrgId,
        name: name.trim(),
        username: normalizedUsername,
        email: email.trim().toLowerCase(),
        role,
      };
      localStorage.setItem('farmfin_active_user', JSON.stringify(activeUser));

      setSuccessMessage('Conta criada com sucesso! Inicializando ambiente...');

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 800);
    } catch (err) {
      console.error('[Register] Failed to create tenant/organization/farm record:', err);
      setErrorMessage(
        'Não foi possível concluir o cadastro no banco de dados. Verifique sua conexão e tente novamente — nenhuma conta foi criada.'
      );
      setIsLoading(false);
    }
  };

  const strength = getStrengthLabel(passwordScore);

  return (
    <ClayCard
      size="lg"
      style={{
        maxWidth: '540px',
        width: '100%',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--clay-shadow-lg)',
        padding: 'clamp(var(--space-5), 5vw, var(--space-8))',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Branding */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            background: 'var(--color-primary-100)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-3)',
            boxShadow: 'var(--clay-shadow-xs)',
          }}
        >
          <Sprout size={30} color="var(--color-primary-700)" strokeWidth={2.2} />
        </div>
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-extrabold)',
            color: 'var(--color-primary-900)',
            letterSpacing: 'var(--tracking-tight)',
            margin: 0,
          }}
        >
          Criar Conta no Farm-Fin
        </h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            marginTop: 'var(--space-2)',
            margin: 0,
          }}
        >
          Cadastre sua fazenda e inicie o controle financeiro & agronômico
        </p>
      </div>

      {/* Error / Success Feedback */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            background: 'var(--color-danger-light)',
            color: 'var(--color-danger-dark)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-4)',
            border: '1px solid var(--color-danger)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          style={{
            background: 'var(--color-success-light)',
            color: 'var(--color-success-dark)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-4)',
            border: '1px solid var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Registration Form */}
      <form
        onSubmit={handleRegister}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        noValidate
      >
        {/* Name */}
        <ClayInput
          label="Nome Completo"
          placeholder="Ex: Carlos Eduardo"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearFieldError('name');
          }}
          required
          error={errors.name}
          icon={<UserIcon size={18} />}
        />

        {/* Username */}
        <ClayInput
          label="Nome de Usuário (login)"
          placeholder="Ex: carlos.silva"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value.toLowerCase().replace(/\s/g, ''));
            clearFieldError('username');
          }}
          required
          autoCapitalize="none"
          autoComplete="username"
          spellCheck={false}
          error={errors.username}
          hint="Mínimo 3 caracteres. Letras, números, '.', '-' ou '_'."
          icon={<UserIcon size={18} />}
        />

        {/* Email */}
        <ClayInput
          label="E-mail de Acesso"
          type="email"
          placeholder="carlos@fazendasantaclara.com.br"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          required
          autoComplete="email"
          error={errors.email}
          icon={<Mail size={18} />}
        />

        {/* Farm / Organization Name */}
        <ClayInput
          label="Nome da Fazenda / Propriedade"
          placeholder="Ex: Fazenda Santa Clara"
          value={organizationName}
          onChange={(e) => {
            setOrganizationName(e.target.value);
            clearFieldError('organizationName');
          }}
          required
          error={errors.organizationName}
          icon={<Building size={18} />}
        />

        {/* Role Selector */}
        <div>
          <label
            className="input-label"
            style={{ display: 'block', marginBottom: 'var(--space-2)' }}
          >
            Perfil de Acesso Inicial (RBAC)
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 'var(--space-2)',
            }}
          >
            {[
              { id: 'Produtor', label: 'Produtor Rural', icon: UserCheck, desc: 'Acesso total' },
              { id: 'Gestor', label: 'Gestor Fazenda', icon: Tractor, desc: 'Operações e safras' },
              { id: 'Financeiro', label: 'Financeiro', icon: CreditCard, desc: 'Contas e caixa' },
              { id: 'Contador', label: 'Contador', icon: FileSpreadsheet, desc: 'Fiscal e DRE' },
            ].map((item) => {
              const IconComp = item.icon;
              const isSelected = role === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setRole(item.id as UserRoleType)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setRole(item.id as UserRoleType);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected
                      ? '2px solid var(--color-primary-500)'
                      : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--color-primary-50)' : 'var(--bg-surface-2)',
                    boxShadow: isSelected ? 'var(--clay-shadow-xs)' : 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <IconComp
                    size={16}
                    color={
                      isSelected ? 'var(--color-primary-600)' : 'var(--text-secondary)'
                    }
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-bold)',
                        color: isSelected
                          ? 'var(--color-primary-800)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {item.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Password & Confirm Password Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          <ClayInput
            label="Senha"
            type="password"
            placeholder="Mín. 6 dígitos"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError('password');
            }}
            required
            autoComplete="new-password"
            error={errors.password}
            icon={<Lock size={16} />}
          />

          <ClayInput
            label="Confirmar Senha"
            type="password"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearFieldError('confirmPassword');
            }}
            required
            autoComplete="new-password"
            error={errors.confirmPassword}
            icon={<Lock size={16} />}
          />
        </div>

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <div style={{ marginTop: 'calc(var(--space-2) * -1)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-1)',
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Força da Senha:
              </span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-bold)',
                  color: strength.color,
                }}
              >
                {strength.label}
              </span>
            </div>
            <div
              style={{
                height: '4px',
                width: '100%',
                background: 'var(--color-neutral-200)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(passwordScore / 5) * 100}%`,
                  background: strength.color,
                  transition: 'width var(--transition-base)',
                }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <ClayButton
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          style={{
            width: '100%',
            marginTop: 'var(--space-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <UserPlus size={18} />
          <span>{isLoading ? 'Registrando com Neon Auth...' : 'Criar Conta e Começar'}</span>
        </ClayButton>
      </form>

      {/* Link back to Login */}
      <div style={{ textAlign: 'center', marginTop: 'var(--space-5)' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Já possui uma conta?{' '}
        </span>
        <Link
          href="/login"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--color-primary-600)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          <span>Fazer Login</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Footer Info */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 'var(--space-5)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        Neon Auth (Better Auth) • Isolamento por Tenant • PostgreSQL Serverless
      </div>
    </ClayCard>
  );
}

export default function RegisterPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at top, var(--color-primary-800) 0%, var(--color-neutral-900) 100%)',
        padding: 'var(--space-6)',
        position: 'relative',
      }}
    >
      <Suspense
        fallback={
          <div
            style={{
              color: 'var(--text-inverse)',
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--font-semibold)',
            }}
          >
            Carregando Farm-Fin...
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
