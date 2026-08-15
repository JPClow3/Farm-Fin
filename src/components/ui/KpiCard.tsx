import React from 'react';
import { Skeleton } from './Skeleton';

export interface KpiCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  iconColor?: 'green' | 'amber' | 'red' | 'blue' | 'terra';
  trend?: {
    value: string;
    direction: 'up' | 'down';
    label?: string;
  };
  subtext?: string;
  className?: string;
  onClick?: () => void;
  loading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  icon,
  iconColor = 'green',
  trend,
  subtext,
  className = '',
  onClick,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className={`kpi-card ${className}`.trim()}>
        <div className="kpi-card__header">
          <Skeleton variant="text" width="60%" height={12} />
          <Skeleton variant="circle" width={32} height={32} />
        </div>
        <div style={{ margin: '10px 0' }}>
          <Skeleton variant="title" width="70%" height={26} />
        </div>
        <Skeleton variant="text" width="45%" height={11} />
      </div>
    );
  }

  return (
    <div
      className={`kpi-card ${onClick ? 'cursor-pointer' : ''} ${className}`.trim()}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="kpi-card__header">
        <span className="kpi-card__label">{label}</span>
        <div className={`kpi-card__icon kpi-card__icon--${iconColor}`}>{icon}</div>
      </div>
      <div className="kpi-card__value">{value}</div>
      {(trend || subtext) && (
        <div className="kpi-card__footer">
          {trend && (
            <span className={`kpi-card__trend kpi-card__trend--${trend.direction}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtext && <span className="kpi-card__subtext">{subtext}</span>}
          {trend?.label && !subtext && <span className="kpi-card__subtext">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
