'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { ClayCard } from '../../components/ui/ClayCard';
import { ClayButton } from '../../components/ui/ClayButton';
import { ClayInput } from '../../components/ui/ClayInput';
import { ClaySelect } from '../../components/ui/ClaySelect';
import { Settings, Smartphone, Mail, Package, RotateCcw, ShieldCheck } from 'lucide-react';
import { useModuleGuard } from '../../lib/useModuleGuard';

export default function ConfiguracoesPage() {
  useModuleGuard('configuracoes');
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Configurações Salvas!',
      message: 'Dados cadastrais e preferências de notificação atualizados.',
    });
  };

  const handleReset = () => {
    if (
      confirm(
        'Tem certeza que deseja restaurar os dados de demonstração da safra 2025/2026? Todas as edições locais serão restauradas.'
      )
    ) {
      resetToDefaults();
      addToast({
        type: 'info',
        title: 'Dados Restaurados',
        message:
          'O ambiente foi restaurado com o cenário completo de demonstração da Fazenda Santa Fé.',
      });
    }
  };

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
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="flex-col"
              style={{ gap: 'var(--space-4)' }}
            >
              <ClayInput
                label="Nome Completo / Razão Social"
                value={producerName}
                onChange={(e) => setProducerName(e.target.value)}
                required
              />

              <div className="form-grid-2">
                <ClayInput
                  label="CPF / CNPJ"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  required
                />
                <ClayInput
                  label="Inscrição Estadual (IE Produtor)"
                  value={stateReg}
                  onChange={(e) => setStateReg(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                <ClayInput
                  label="E-mail Principal"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <ClayInput
                  label="Telefone / WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div style={{ marginTop: 'var(--space-2)' }}>
                <ClayButton type="submit" variant="primary">
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
            </div>

            <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
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
                onChange={(e) => {
                  const newRole = e.target.value;
                  setActiveRole(newRole);
                  try {
                    const saved = localStorage.getItem('farmfin_active_user');
                    const user = saved
                      ? JSON.parse(saved)
                      : { name: 'Usuário', email: 'user@agro.com' };
                    user.role = newRole;
                    localStorage.setItem('farmfin_active_user', JSON.stringify(user));
                  } catch {}
                  window.document.cookie = `farmfin_demo_role=${newRole}; path=/; max-age=604800; SameSite=Lax`;
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

              <ClayButton variant="danger" size="sm" onClick={handleReset}>
                <RotateCcw size={14} style={{ marginRight: '6px' }} />
                Restaurar Cenário Demo
              </ClayButton>
            </div>
          </ClayCard>
        </div>
      </div>
    </div>
  );
}
