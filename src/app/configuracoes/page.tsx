'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { ClayInput } from '../../components/ui/ClayInput';
import { ClaySelect } from '../../components/ui/ClaySelect';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  Settings,
  Smartphone,
  Mail,
  Package,
  RotateCcw,
  ShieldCheck,
  Construction,
} from 'lucide-react';
import { useModuleGuard } from '../../lib/useModuleGuard';
import { AppShellSkeleton } from '../../components/layout/AppShellSkeleton';
import { TwoFactorCard } from '../../components/settings/TwoFactorCard';

export default function ConfiguracoesPage() {
  const moduleAllowed = useModuleGuard('configuracoes');
  const { resetToDefaults } = useFarm();
  const { addToast } = useToast();
  const router = useRouter();

  const [producerName, setProducerName] = useState('Antônio da Silva Carvalho');
  const [document, setDocument] = useState('123.456.789-00');
  const [stateReg, setStateReg] = useState('13.554.892-0');
  const [email, setEmail] = useState('antonio.fazendasantafe@agro.com.br');
  const [phone, setPhone] = useState('(66) 99988-7766');

  // Notification toggles
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyStock, setNotifyStock] = useState(true);

  // Active Role
  const [activeRole, setActiveRole] = useState('Produtor');

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleReset = () => {
    resetToDefaults();
    addToast({
      type: 'info',
      title: 'Dados Restaurados',
      message:
        'O ambiente foi restaurado com o cenário completo de demonstração da Fazenda Santa Fé.',
    });
    setIsResetConfirmOpen(false);
  };

  if (!moduleAllowed) {
    return <AppShellSkeleton />;
  }

  return (
    <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Configurações & Preferências</h1>
          <p className="page-subtitle">
            Dados cadastrais do produtor, perfis de acesso, notificações e gerenciamento do ambiente
          </p>
        </div>
      </div>

      <div className="grid-2-1">
        {/* Left Column: Organization Data & Notifications */}
        <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
          {/* Dados do Produtor */}
          <ClayCard>
            <div className="card-header">
              <div>
                <h2 className="card-title">Dados Cadastrais do Produtor Rural</h2>
                <p className="card-subtitle">
                  Informações utilizadas para emissão de LCDPR e relatórios
                </p>
              </div>
              <span
                className="badge badge--neutral"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Construction size={12} />
                Em desenvolvimento
              </span>
            </div>

            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                marginTop: '-8px',
                marginBottom: 'var(--space-4)',
              }}
            >
              Este formulário ainda não está conectado ao backend — os campos abaixo são somente
              leitura e não podem ser salvos nesta versão.
            </p>

            <form className="flex-col" style={{ gap: 'var(--space-4)' }}>
              <ClayInput
                label="Nome Completo / Razão Social"
                value={producerName}
                onChange={(e) => setProducerName(e.target.value)}
                disabled
              />

              <div className="form-grid-2">
                <ClayInput
                  label="CPF / CNPJ"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  disabled
                />
                <ClayInput
                  label="Inscrição Estadual (IE Produtor)"
                  value={stateReg}
                  onChange={(e) => setStateReg(e.target.value)}
                  disabled
                />
              </div>

              <div className="form-grid-2">
                <ClayInput
                  label="E-mail Principal"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled
                />
                <ClayInput
                  label="Telefone / WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled
                />
              </div>

              <div style={{ marginTop: 'var(--space-2)' }}>
                <ClayButton type="button" variant="primary" disabled title="Ainda não disponível">
                  Salvar Alterações
                </ClayButton>
              </div>
            </form>
          </ClayCard>

          {/* Notificações e Alertas */}
          <ClayCard>
            <div className="card-header">
              <div>
                <h2 className="card-title">Canais de Notificação & Alertas</h2>
                <p className="card-subtitle">
                  Receba avisos automáticos de vencimento e estoque no campo
                </p>
              </div>
              <span
                className="badge badge--neutral"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Construction size={12} />
                Em desenvolvimento
              </span>
            </div>

            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                marginTop: '-8px',
                marginBottom: 'var(--space-4)',
              }}
            >
              Estas preferências ainda não são persistidas — os controles abaixo são ilustrativos.
            </p>

            <div
              className="flex-col"
              style={{ gap: 'var(--space-4)', opacity: 0.6, pointerEvents: 'none' }}
            >
              <div className="flex-between">
                <div>
                  <div
                    style={{
                      fontWeight: '600',
                      fontSize: 'var(--text-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Smartphone size={16} color="var(--color-primary-600)" />
                    Alertas de Vencimento via WhatsApp
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                      marginTop: '2px',
                    }}
                  >
                    Avisos 2 dias antes e no dia do vencimento de boletos de insumos
                  </div>
                </div>
                <div
                  className={`toggle ${notifyWhatsapp ? 'active' : ''}`}
                  onClick={() => setNotifyWhatsapp(!notifyWhatsapp)}
                />
              </div>

              <div className="flex-between">
                <div>
                  <div
                    style={{
                      fontWeight: '600',
                      fontSize: 'var(--text-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Mail size={16} color="var(--color-primary-600)" />
                    Resumo Financeiro Semanal por E-mail
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                      marginTop: '2px',
                    }}
                  >
                    Relatório consolidado de fluxo de caixa toda segunda-feira
                  </div>
                </div>
                <div
                  className={`toggle ${notifyEmail ? 'active' : ''}`}
                  onClick={() => setNotifyEmail(!notifyEmail)}
                />
              </div>

              <div className="flex-between">
                <div>
                  <div
                    style={{
                      fontWeight: '600',
                      fontSize: 'var(--text-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Package size={16} color="var(--color-primary-600)" />
                    Aviso de Estoque Mínimo no Galpão
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                      marginTop: '2px',
                    }}
                  >
                    Notificação quando diesel, sementes ou defensivos atingirem nível de alerta
                  </div>
                </div>
                <div
                  className={`toggle ${notifyStock ? 'active' : ''}`}
                  onClick={() => setNotifyStock(!notifyStock)}
                />
              </div>
            </div>
          </ClayCard>
        </div>

        {/* Right Column: Access Role & Demo Data Control */}
        <div className="flex-col" style={{ gap: 'var(--space-6)' }}>
          {/* Perfil Ativo */}
          <ClayCard>
            <div className="card-header">
              <h2 className="card-title">Perfil de Acesso (RBAC)</h2>
            </div>

            <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
              <ClaySelect
                label="Simular Papel no Sistema"
                options={[
                  { value: 'Produtor', label: 'Produtor Rural (Acesso Total)' },
                  { value: 'Gestor', label: 'Gestor de Fazenda (Operacional)' },
                  { value: 'Financeiro', label: 'Assistente Financeiro (Lançamentos)' },
                  { value: 'Contador', label: 'Contador Rural (DRE / LCDPR)' },
                  { value: 'Operador', label: 'Operador de Campo (Estoque / Maquinário)' },
                ]}
                value={activeRole}
                onChange={async (e) => {
                  const newRole = e.target.value;
                  const previousRole = activeRole;
                  setActiveRole(newRole);
                  let user: { name?: string; email?: string; role?: string } = {};
                  try {
                    const saved = localStorage.getItem('farmfin_active_user');
                    if (saved) user = JSON.parse(saved);
                  } catch {}

                  // The simulated role lives in a server-signed session cookie
                  const res = await fetch('/api/session/demo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: newRole, email: user.email, name: user.name }),
                  }).catch(() => null);
                  if (!res?.ok) {
                    setActiveRole(previousRole);
                    addToast({
                      type: 'error',
                      title: 'Não foi possível alterar o perfil',
                      message: 'Tente novamente em instantes.',
                    });
                    return;
                  }

                  try {
                    localStorage.setItem(
                      'farmfin_active_user',
                      JSON.stringify({ ...user, role: newRole })
                    );
                  } catch {}
                  addToast({
                    type: 'info',
                    title: 'Perfil RBAC Alterado',
                    message: `Permissões e visualização agora ajustadas para: ${newRole}.`,
                  });
                  router.refresh();
                }}
              />

              <div
                style={{
                  padding: 'var(--space-3)',
                  background: 'var(--bg-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ShieldCheck size={18} color="var(--color-primary-700)" style={{ flexShrink: 0 }} />
                <span>
                  Autenticado via <strong>Better Auth / Neon</strong> com controle RBAC e suporte
                  multi-tenant.
                </span>
              </div>
            </div>
          </ClayCard>

          {/* Gerenciamento de Dados Mock */}
          <TwoFactorCard />

          <ClayCard className="clay-card--secondary">
            <div className="card-header">
              <div>
                <h2 className="card-title">Dados de Demonstração</h2>
                <p className="card-subtitle">Restaurar estado inicial do agro</p>
              </div>
            </div>

            <div className="flex-col" style={{ gap: 'var(--space-3)' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Se você fez testes de lançamentos, baixas e estoque e deseja voltar ao cenário
                inicial pré-configurado de 2.400 ha, clique no botão abaixo.
              </p>

              <ClayButton variant="danger" size="sm" onClick={() => setIsResetConfirmOpen(true)}>
                <RotateCcw size={14} style={{ marginRight: '6px' }} />
                Restaurar Cenário Demo
              </ClayButton>
            </div>
          </ClayCard>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="Restaurar Cenário Demo"
        description="Tem certeza que deseja restaurar os dados de demonstração da safra 2025/2026? Todas as edições locais feitas nesta sessão serão perdidas e substituídas pelo cenário inicial da Fazenda Santa Fé."
        confirmLabel="Restaurar Dados"
        variant="danger"
      />
    </div>
  );
}
