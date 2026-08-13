import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  variant?: 'primary' | 'accent' | 'danger';
  height?: string;
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'primary',
  height = '10px',
  showLabel = false,
  className = '',
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`flex-col ${className}`.trim()} style={{ gap: '4px', width: '100%' }}>
      {showLabel && (
        <div className="flex-between">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Progresso
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {clampedValue}%
          </span>
        </div>
      )}
      <div className="progress" style={{ height }}>
        <div
          className={`progress__fill progress__fill--${variant}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
