import React from 'react';

export type StatusType =
  | 'pago'
  | 'pendente'
  | 'vencido'
  | 'parcial'
  | 'cancelado'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'accent';

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const normalizedStatus = status.toLowerCase();
  const displayLabel =
    label ||
    (normalizedStatus === 'pago'
      ? 'Pago'
      : normalizedStatus === 'pendente'
      ? 'Pendente'
      : normalizedStatus === 'vencido'
      ? 'Vencido'
      : normalizedStatus === 'parcial'
      ? 'Parcial'
      : normalizedStatus === 'cancelado'
      ? 'Cancelado'
      : status);

  return (
    <span className={`badge badge--${normalizedStatus} ${className}`.trim()}>
      {displayLabel}
    </span>
  );
};
