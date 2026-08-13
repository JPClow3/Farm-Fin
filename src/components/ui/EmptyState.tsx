import React from 'react';
import { ClayButton } from './ClayButton';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📂',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="empty-state__icon">{icon}</div>
      <h4 className="empty-state__title">{title}</h4>
      {description && <p className="empty-state__desc">{description}</p>}
      {actionLabel && onAction && (
        <ClayButton variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </ClayButton>
      )}
    </div>
  );
};
