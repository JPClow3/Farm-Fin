import React from 'react';
import { ClayButton } from './ClayButton';
import { AlertTriangle } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Não foi possível carregar os dados',
  description = 'Ocorreu um erro ao buscar as informações. Verifique sua conexão e tente novamente.',
  onRetry,
  retryLabel = 'Tentar Novamente',
  retrying = false,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="empty-state__icon empty-state__icon--danger">
        <AlertTriangle size={36} strokeWidth={1.8} />
      </div>
      <h4 className="empty-state__title">{title}</h4>
      <p className="empty-state__desc">{description}</p>
      {onRetry && (
        <ClayButton variant="primary" size="sm" onClick={onRetry} loading={retrying}>
          {retryLabel}
        </ClayButton>
      )}
    </div>
  );
};
