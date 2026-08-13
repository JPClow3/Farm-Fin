import React from 'react';
import { ClayButton } from './ClayButton';
import { FolderOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="empty-state__icon">
        {icon || <FolderOpen size={36} color="var(--color-primary-600)" />}
      </div>
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
