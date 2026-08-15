import React from 'react';

export type StatusType =
  | 'pago'
  | 'pendente'
  | 'vencido'
  | 'parcial'
  | 'cancelado'
  | 'aguardando_aprovacao'
  | 'pendente_aprovacao'
  | 'aprovado'
  | 'rejeitado'
  | 'recorrente'
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

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
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
              : normalizedStatus === 'aguardando_aprovacao' ||
                  normalizedStatus === 'pendente_aprovacao'
                ? 'Aguardando Aprovação'
                : normalizedStatus === 'aprovado'
                  ? 'Aprovado'
                  : normalizedStatus === 'rejeitado'
                    ? 'Rejeitado'
                    : normalizedStatus === 'recorrente'
                      ? 'Recorrente'
                      : status);

  return (
    <span className={`badge badge--${normalizedStatus} ${className}`.trim()}>{displayLabel}</span>
  );
};
