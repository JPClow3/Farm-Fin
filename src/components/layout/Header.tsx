'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';
import { ClayButton } from '../ui/ClayButton';
import { ClayModal } from '../ui/ClayModal';
import { ClayInput } from '../ui/ClayInput';
import { User } from '../../lib/types';
import { SEED_USERS } from '../../db/seed';
import {
  Menu,
  Home,
  Wheat,
  Plus,
  Bell,
  Settings,
  LogOut,
  User as UserIcon,
  AlertCircle,
  Package,
  ShieldAlert,
  Clock,
  Calendar,
} from 'lucide-react';

import { authClient } from '../../lib/auth-client';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenQuickNew: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenQuickNew }) => {
  const router = useRouter();
  const {
    farms,
    activeFarmId,
    setActiveFarmId,
    seasons,
    activeSeasonId,
    setActiveSeasonId,
    periodFilter,
    setPeriodFilter,
    customDateRange,
    setCustomDateRange,
    currentPeriodInfo,
    kpis,
    isLoading,
  } = useFarm();

  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [tempStart, setTempStart] = useState(customDateRange.startDate);
  const [tempEnd, setTempEnd] = useState(customDateRange.endDate);

  const totalAlertCount =
    (kpis.pendingApprovalPayablesCount || 0) +
    (kpis.overduePayablesCount || 0) +
    (kpis.lowStockCount || 0) +
    (kpis.dueTodayPayablesCount || 0) +
    (kpis.dueIn3DaysPayablesCount || 0) +
    (kpis.dueIn7DaysPayablesCount || 0);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('farmfin_active_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch {}
  }, []);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      console.warn('Neon Auth signOut error:', e);
    }
    // Clear cookies & session
    document.cookie = 'farmfin_session=; path=/; max-age=0';
    document.cookie = 'better-auth.session_token=; path=/; max-age=0';
    document.cookie = 'farmfin_demo_role=; path=/; max-age=0';
    try {
      localStorage.removeItem('farmfin_active_user');
    } catch {}
    router.push('/login');
    router.refresh();
  };

  const handlePeriodChange = (val: string) => {
    if (val === 'personalizado') {
      setTempStart(customDateRange.startDate);
      setTempEnd(customDateRange.endDate);
      setShowCustomDateModal(true);
    } else {
      setPeriodFilter(val as any);
    }
  };

  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomDateRange({ startDate: tempStart, endDate: tempEnd });
    setPeriodFilter('personalizado');
    setShowCustomDateModal(false);
  };

  return (
    <>
      <header className="header">
        {/* Left side: Mobile Hamburger + Farm Switcher + Safra Switcher + Period Filter */}
        <div className="header__left" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <ClayButton
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onToggleSidebar}
            className="hide-desktop"
            aria-label="Abrir Menu"
          >
            <Menu size={18} />
          </ClayButton>

          {/* Farm Selector */}
          <div className="flex-row" style={{ gap: '6px', alignItems: 'center' }}>
            <Home size={16} color="var(--color-primary-600)" />
            <select
              value={activeFarmId}
              onChange={(e) => setActiveFarmId(e.target.value)}
              disabled={isLoading}
              className="input select"
              style={{
                padding: '6px 28px 6px 12px',
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                maxWidth: '200px',
                height: '36px',
              }}
              title="Selecionar Fazenda Ativa"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.totalArea} ha)
                </option>
              ))}
            </select>
          </div>

          {/* Safra Selector */}
          <div className="flex-row hide-mobile" style={{ gap: '6px', alignItems: 'center' }}>
            <Wheat size={16} color="var(--color-secondary-600)" />
            <select
              value={activeSeasonId}
              onChange={(e) => setActiveSeasonId(e.target.value)}
              disabled={isLoading}
              className="input select"
              style={{
                padding: '6px 28px 6px 12px',
                fontSize: 'var(--text-xs)',
                maxWidth: '180px',
                height: '36px',
              }}
              title="Selecionar Safra Agrícola"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Global Period Filter Selector */}
          <div className="flex-row hide-mobile" style={{ gap: '6px', alignItems: 'center' }}>
            <Calendar size={15} color="var(--color-primary-600)" />
            <select
              value={periodFilter}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="input select"
              style={{
                padding: '6px 28px 6px 10px',
                fontSize: 'var(--text-xs)',
                maxWidth: '170px',
                height: '36px',
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border-subtle)',
              }}
              title="Filtro Global de Período Financeiro"
            >
              <option value="safra">Safra Completa</option>
              <option value="mes_atual">Mês Atual</option>
              <option value="proximos_30_dias">Próximos 30 Dias</option>
              <option value="trimestre">Trimestre Atual</option>
              <option value="ano_atual">Ano Calendário</option>
              <option value="personalizado">Personalizado...</option>
            </select>

            {periodFilter === 'personalizado' && (
              <button
                type="button"
                onClick={() => setShowCustomDateModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: 'var(--color-primary-600)',
                  textDecoration: 'underline',
                  padding: '0 4px',
                }}
              >
                Editar período
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Action, Alerts & User Profile */}
        <div className="flex-row items-center" style={{ gap: 'var(--space-3)' }}>
          {/* Quick Add Button */}
          <ClayButton
            variant="primary"
            size="sm"
            onClick={onOpenQuickNew}
            style={{ height: '36px', fontSize: 'var(--text-sm)' }}
          >
            <Plus size={16} style={{ marginRight: '4px' }} />
            <span className="hide-mobile">Novo Lançamento</span>
          </ClayButton>

          {/* Notifications Button */}
          <div style={{ position: 'relative' }}>
            <ClayButton
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notificações"
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {totalAlertCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    minWidth: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--color-danger)',
                  }}
                />
              )}
            </ClayButton>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className="dropdown__menu"
                style={{ width: 'min(340px, 92vw)', right: 0, padding: 'var(--space-4)' }}
              >
                <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                    Notificações & Alertas ({totalAlertCount})
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-primary-600)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowNotifications(false)}
                  >
                    Fechar
                  </span>
                </div>
                <div
                  className="flex-col"
                  style={{ gap: '8px', maxHeight: '360px', overflowY: 'auto' }}
                >
                  {/* Approval Alerts */}
                  {(kpis.pendingApprovalPayablesCount || 0) > 0 && (
                    <div
                      onClick={() => {
                        router.push('/contas-a-pagar');
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        background: '#fef3c7',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        cursor: 'pointer',
                        border: '1px solid #fde68a',
                      }}
                    >
                      <ShieldAlert
                        size={16}
                        style={{ flexShrink: 0, marginTop: '2px', color: '#b45309' }}
                      />
                      <div>
                        <strong>
                          {kpis.pendingApprovalPayablesCount} despesa(s) aguardando aprovação
                        </strong>{' '}
                        da diretoria antes do pagamento.
                      </div>
                    </div>
                  )}

                  {/* Overdue Alerts */}
                  {kpis.overduePayablesCount > 0 && (
                    <div
                      onClick={() => {
                        router.push('/contas-a-pagar');
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--color-danger-light)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        color: 'var(--color-danger-dark)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>{kpis.overduePayablesCount} conta(s) vencida(s)</strong> no total de
                        R${' '}
                        {kpis.totalOverduePayables.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                        .
                      </div>
                    </div>
                  )}

                  {/* Due Today Alerts */}
                  {(kpis.dueTodayPayablesCount || 0) > 0 && (
                    <div
                      onClick={() => {
                        router.push('/contas-a-pagar');
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        background: '#fff7ed',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        color: '#9a3412',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        cursor: 'pointer',
                        border: '1px solid #fed7aa',
                      }}
                    >
                      <Clock
                        size={16}
                        style={{ flexShrink: 0, marginTop: '2px', color: '#ea580c' }}
                      />
                      <div>
                        <strong>{kpis.dueTodayPayablesCount} conta(s) vencem hoje</strong> (R${' '}
                        {kpis.totalDueTodayPayables.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                        ).
                      </div>
                    </div>
                  )}

                  {/* Due in 3 days */}
                  {(kpis.dueIn3DaysPayablesCount || 0) > 0 && (
                    <div
                      onClick={() => {
                        router.push('/contas-a-pagar');
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        background: '#fefce8',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        color: '#854d0e',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        cursor: 'pointer',
                        border: '1px solid #fef08a',
                      }}
                    >
                      <Calendar
                        size={16}
                        style={{ flexShrink: 0, marginTop: '2px', color: '#ca8a04' }}
                      />
                      <div>
                        <strong>{kpis.dueIn3DaysPayablesCount} conta(s)</strong> vencem nos próximos
                        3 dias.
                      </div>
                    </div>
                  )}

                  {/* Low Stock Alerts */}
                  {kpis.lowStockCount > 0 && (
                    <div
                      onClick={() => {
                        router.push('/estoque');
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--color-warning-light)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        color: 'var(--color-warning-dark)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <Package size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>{kpis.lowStockCount} insumo(s)</strong> abaixo do estoque de
                        segurança.
                      </div>
                    </div>
                  )}

                  {totalAlertCount === 0 && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-tertiary)',
                        padding: '12px 0',
                        textAlign: 'center',
                      }}
                    >
                      Nenhum alerta pendente no momento.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar Menu */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                userSelect: 'none',
                padding: '4px 8px',
                borderRadius: '8px',
                background: showUserMenu ? 'var(--bg-surface-2)' : 'transparent',
              }}
            >
              <div className="avatar-initials avatar--sm">
                <UserIcon size={16} />
              </div>
              <div className="hide-mobile" style={{ textAlign: 'left', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px',
                  }}
                >
                  {currentUser.name}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-tertiary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '120px',
                  }}
                >
                  {currentUser.role} • Grupo Santa Fé
                </div>
              </div>
            </div>

            {showUserMenu && (
              <div className="dropdown__menu" style={{ width: '220px', right: 0 }}>
                <div
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {currentUser.email}
                  </div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      padding: '2px 8px',
                      background: 'var(--color-primary-100)',
                      color: 'var(--color-primary-800)',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '700',
                    }}
                  >
                    Perfil: {currentUser.role}
                  </div>
                </div>
                <div className="dropdown__divider" />
                <button
                  className="dropdown__item"
                  style={{
                    fontSize: 'var(--text-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/configuracoes');
                  }}
                >
                  <Settings size={14} />
                  <span>Configurações & RBAC</span>
                </button>
                <button
                  className="dropdown__item"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  <span>Sair (Encerrar Sessão)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showCustomDateModal && (
        <ClayModal
          isOpen={true}
          onClose={() => setShowCustomDateModal(false)}
          title="Definir Período Personalizado"
          subtitle="Selecione as datas inicial e final para filtrar os dados financeiros"
        >
          <form
            onSubmit={handleApplyCustomDate}
            className="flex-col"
            style={{ gap: 'var(--space-4)' }}
          >
            <div className="grid-2" style={{ gap: 'var(--space-3)' }}>
              <ClayInput
                label="Data Inicial"
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                required
              />
              <ClayInput
                label="Data Final"
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                required
              />
            </div>

            <div className="modal__footer" style={{ marginTop: 'var(--space-4)' }}>
              <ClayButton
                type="button"
                variant="ghost"
                onClick={() => setShowCustomDateModal(false)}
              >
                Cancelar
              </ClayButton>
              <ClayButton type="submit" variant="primary">
                Aplicar Filtro
              </ClayButton>
            </div>
          </form>
        </ClayModal>
      )}
    </>
  );
};
