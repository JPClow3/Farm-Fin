'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFarm } from '../../context/FarmContext';
import { ClayButton } from '../ui/ClayButton';
import { User } from '../../lib/types';
import { SEED_USERS } from '../../db/seed';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenQuickNew: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenQuickNew }) => {
  const router = useRouter();
  const { farms, activeFarmId, setActiveFarmId, seasons, activeSeasonId, setActiveSeasonId, kpis } =
    useFarm();

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

  const handleLogout = () => {
    // Clear cookies & session
    document.cookie = 'farmfin_session=; path=/; max-age=0';
    document.cookie = 'better-auth.session_token=; path=/; max-age=0';
    try {
      localStorage.removeItem('farmfin_active_user');
    } catch {}
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="header">
      {/* Left side: Mobile Hamburger + Farm Switcher + Safra Switcher */}
      <div className="header__left">
        <ClayButton
          variant="ghost"
          size="sm"
          iconOnly
          onClick={onToggleSidebar}
          className="hide-desktop"
          aria-label="Abrir Menu"
        >
          ☰
        </ClayButton>

        {/* Farm Selector */}
        <div className="flex-row" style={{ gap: '6px' }}>
          <span style={{ fontSize: '1.1rem' }}>🏡</span>
          <select
            value={activeFarmId}
            onChange={(e) => setActiveFarmId(e.target.value)}
            className="input select"
            style={{
              padding: '6px 28px 6px 12px',
              fontSize: 'var(--text-sm)',
              fontWeight: '600',
              maxWidth: '240px',
              height: '36px',
            }}
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.totalArea} ha)
              </option>
            ))}
          </select>
        </div>

        {/* Safra Selector */}
        <div className="flex-row hide-mobile" style={{ gap: '6px' }}>
          <span style={{ fontSize: '1rem' }}>🌾</span>
          <select
            value={activeSeasonId}
            onChange={(e) => setActiveSeasonId(e.target.value)}
            className="input select"
            style={{
              padding: '6px 28px 6px 12px',
              fontSize: 'var(--text-xs)',
              maxWidth: '240px',
              height: '36px',
            }}
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right side: Quick Action Button + Notifications + User Avatar */}
      <div className="header__right">
        <ClayButton
          variant="primary"
          size="sm"
          onClick={onOpenQuickNew}
          style={{ height: '36px', fontSize: 'var(--text-sm)' }}
        >
          <span>＋</span> <span className="hide-mobile">Novo Lançamento</span>
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
            🔔
            {kpis.overduePayablesCount + kpis.lowStockCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '8px',
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
              style={{ width: '300px', right: 0, padding: 'var(--space-4)' }}
            >
              <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>Notificações</span>
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
              <div className="flex-col" style={{ gap: '8px' }}>
                {kpis.overduePayablesCount > 0 && (
                  <div
                    style={{
                      padding: '8px',
                      background: 'var(--color-danger-light)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      color: 'var(--color-danger-dark)',
                    }}
                  >
                    ⚠️ <strong>{kpis.overduePayablesCount} conta(s) a pagar vencida(s)</strong> no
                    total de R$ {kpis.totalOverduePayables.toLocaleString('pt-BR')}.
                  </div>
                )}
                {kpis.lowStockCount > 0 && (
                  <div
                    style={{
                      padding: '8px',
                      background: 'var(--color-warning-light)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      color: 'var(--color-warning-dark)',
                    }}
                  >
                    📦 <strong>{kpis.lowStockCount} insumo(s)</strong> abaixo do estoque de
                    segurança.
                  </div>
                )}
                {kpis.overduePayablesCount === 0 && kpis.lowStockCount === 0 && (
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
              {currentUser.role === 'Produtor'
                ? '👨‍🌾'
                : currentUser.role === 'Gestor'
                  ? '🚜'
                  : currentUser.role === 'Contador'
                    ? '📑'
                    : '💳'}
            </div>
            <div className="hide-mobile" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
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
                style={{ fontSize: 'var(--text-xs)' }}
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/configuracoes');
                }}
              >
                ⚙️ Configurações & RBAC
              </button>
              <button
                className="dropdown__item"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}
                onClick={handleLogout}
              >
                🚪 Sair (Encerrar Sessão)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
