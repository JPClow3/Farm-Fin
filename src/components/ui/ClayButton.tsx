import React, { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

export interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export const ClayButton: React.FC<ClayButtonProps> = ({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const variantClass = `btn--${variant}`;
  const sizeClass = size !== 'md' ? `btn--${size}` : '';
  const iconClass = iconOnly ? 'btn--icon' : '';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${iconClass} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <Spinner size={size === 'sm' ? 12 : 14} style={{ marginRight: iconOnly ? 0 : '6px' }} />
      )}
      {!(loading && iconOnly) && children}
    </button>
  );
};
