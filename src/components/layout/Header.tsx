'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

import { authClient } from '../../lib/auth-client';
import { PeriodCashFlowSparkline } from '../finance/PeriodCashFlowSparkline';

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

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Click outside listener to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          <div className="flex-row" style={{ gap: '6px', alignItems: 'center', minWidth: 0 }}>
            <Home size={16} color="var(--color-primary-600)" style={{ flexShrink: 0 }} />
            <select
              value={activeFarmId}
              onChange={(e) => setActiveFarmId(e.target.value)}
              disabled={isLoading}
              className="input select"
              style={{
                padding: '6px 26px 6px 10px',
                fontSize: 'var(--text-xs)',
                fontWeight: '600',
                maxWidth: 'clamp(120px, 34vw, 220px)',
                height: '36px',
                textOverflow: 'ellipsis',
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
                maxWidth: '190px',
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
                maxWidth: '180px',
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
                  fontWeight: '600',
                  textDecoration: 'underline',
                  padding: '0 4px',
                }}
              >
                Editar período
              </button>
            )}

            {/* Instant Cash Flow Trend Sparkline */}
            <PeriodCashFlowSparkline />
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

          {/* Notifications Button & Dropdown */}
          <div ref={notificationsRef} style={{ position: 'relative' }}>
            <ClayButton
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (showUserMenu) setShowUserMenu(false);
              }}
              aria-label="Notificações e Alertas"
              style={{
                position: 'relative',
                background: showNotifications ? 'var(--bg-surface-2)' : undefined,
              }}
            >
              <Bell size={18} />
              {totalAlertCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    minWidth: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--color-danger)',
                    border: '2px solid var(--bg-surface-1)',
                  }}
                />
              )}
            </ClayButton>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className="dropdown__menu"
                style={{
                  width: 'min(360px, calc(100vw - 24px))',
                  maxWidth: 'calc(100vw - 24px)',
                  right: 0,
                  padding: 'var(--space-4)',
                }}
              >
                <div
                  className="flex-between"
                  style={{
                    marginBottom: 'var(--space-3)',
                    paddingBottom: 'var(--space-2)',
                    borderBottom: '1px solid rgba(212, 201, 186, 0.4)',
                  }}
                >
                  <div className="flex-row items-center" style={{ gap: '6px' }}>
                    <Bell size={16} color="var(--color-primary-700)" />
                    <span style={{ fontWeight: '700', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      Alertas & Avisos ({totalAlertCount})
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-primary-600)',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                    onClick={() => setShowNotifications(false)}
                  >
                    Fechar
                  </span>
                </div>

                <div
                  className="flex-col"
                  style={{
                    gap: '8px',
                    maxHeight: '380px',
                    overflowY: 'auto',
                    paddingRight: '2px',
                  }}
                >
                  {/* Approval Alerts */}
                  {(kpis.pendingApprovalPayablesCount || 0) > 0 && (
                    <div
                      onClick={() => {
                        router.push('/contas-a-pagar');
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '10px 12px',
                        background: '#fffbeb',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        color: '#92400e',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        cursor: 'pointer',
                        border: '1px solid #fde68a',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <ShieldAlert
                        size={17}
                        style={{ flexShrink: 0, marginTop: '2px', color: '#b45309' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: '#78350f' }}>
                          Aprovação Pendente ({kpis.pendingApprovalPayablesCount})
                        </div>
                        <div style={{ color: '#92400e', marginTop: '2px' }}>
                          Despesa(s) aguardando liberação da diretoria antes da baixa.
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: '#b45309', flexShrink: 0, marginTop: '3px' }} />
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
                        padding: '10px 12px',
                        background: 'var(--color-danger-light)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        color: 'var(--color-danger-dark)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        cursor: 'pointer',
                        border: '1px solid #fecaca',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-danger)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: '#7f1d1d' }}>
                          {kpis.overduePayablesCount} conta(s) vencida(s)
                        </div>
                        <div style={{ color: 'var(--color-danger-dark)', marginTop: '2px' }}>
                          Total em atraso: R${' '}
                          {kpis.totalOverduePayables.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '3px' }} />
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
                        padding: '10px 12px',
                        background: '#fff7ed',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        color: '#9a3412',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        cursor: 'pointer',
                        border: '1px solid #fed7aa',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <Clock
                        size={17}
                        style={{ flexShrink: 0, marginTop: '2px', color: '#ea580c' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: '#7c2d12' }}>
                          {kpis.dueTodayPayablesCount} conta(s) vencem hoje
                        </div>
                        <div style={{ color: '#9a3412', marginTop: '2px' }}>
                          R${' '}
                          {kpis.totalDueTodayPayables.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })} previstos para quitação imediata.
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: '#ea580c', flexShrink: 0, marginTop: '3px' }} />
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
                        padding: '10px 12px',
                        background: '#fefce8',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        color: '#854d0e',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        cursor: 'pointer',
                        border: '1px solid #fef08a',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <Calendar
                        size={17}
                        style={{ flexShrink: 0, marginTop: '2px', color: '#ca8a04' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: '#713f12' }}>
                          {kpis.dueIn3DaysPayablesCount} conta(s) nos próximos 3 dias
                        </div>
                        <div style={{ color: '#854d0e', marginTop: '2px' }}>
                          Planejamento de liquidez imediata.
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: '#ca8a04', flexShrink: 0, marginTop: '3px' }} />
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
                        padding: '10px 12px',
                        background: 'var(--color-warning-light)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        color: 'var(--color-warning-dark)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        cursor: 'pointer',
                        border: '1px solid #fde047',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <Package size={17} style={{ flexShrink: 0, marginTop: '2px', color: '#ca8a04' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: '#713f12' }}>
                          {kpis.lowStockCount} insumo(s) em nível crítico
                        </div>
                        <div style={{ color: 'var(--color-warning-dark)', marginTop: '2px' }}>
                          Quantidade abaixo do estoque mínimo de segurança.
                        </div>
                      </div>
                      <ArrowRight size={14} style={{ color: '#ca8a04', flexShrink: 0, marginTop: '3px' }} />
                    </div>
                  )}

                  {totalAlertCount === 0 && (
                    <div
                      style={{
                        padding: 'var(--space-6) var(--space-4)',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <CheckCircle2 size={32} color="var(--color-primary-600)" />
                      <div style={{ fontWeight: '600', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                        Nenhum alerta pendente
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        Suas contas, estoques e safras estão em dia!
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar Menu */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <div
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                if (showNotifications) setShowNotifications(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                userSelect: 'none',
                padding: '4px 10px',
                borderRadius: 'var(--radius-lg)',
                background: showUserMenu ? 'var(--bg-surface-2)' : 'transparent',
                border: showUserMenu ? '1px solid rgba(212, 201, 186, 0.6)' : '1px solid transparent',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div className="avatar-initials avatar--sm">
                <UserIcon size={16} />
              </div>
              <div className="hide-mobile" style={{ textAlign: 'left', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '140px',
                  }}
                >
                  {currentUser.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '140px',
                  }}
                >
                  {currentUser.role} • Grupo Santa Fé
                </div>
              </div>
              <ChevronDown
                size={14}
                color="var(--text-tertiary)"
                style={{
                  transform: showUserMenu ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--transition-fast)',
                }}
              />
            </div>

            {showUserMenu && (
              <div
                className="dropdown__menu"
                style={{
                  width: 'min(260px, calc(100vw - 24px))',
                  maxWidth: 'calc(100vw - 24px)',
                  right: 0,
                  padding: 'var(--space-2)',
                }}
              >
                {/* User Identity Card in Dropdown */}
                <div
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                    {currentUser.email}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: 'var(--color-primary-100)',
                        color: 'var(--color-primary-800)',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '700',
                      }}
                    >
                      Perfil: {currentUser.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="dropdown__item"
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/configuracoes');
                  }}
                >
                  <Settings size={15} color="var(--text-secondary)" />
                  <span>Configurações & RBAC</span>
                </button>

                <div className="dropdown__divider" />

                <button
                  type="button"
                  className="dropdown__item dropdown__item--danger"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
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
