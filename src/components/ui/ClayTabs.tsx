import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface ClayTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ClayTabs: React.FC<ClayTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  style,
}) => {
  return (
    <div className={`tabs ${className}`.trim()} style={style}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              {tab.icon}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? 'var(--color-primary-100)' : 'var(--color-neutral-300)',
                    color: isActive ? 'var(--color-primary-800)' : 'var(--text-secondary)',
                    fontWeight: 'bold',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};
