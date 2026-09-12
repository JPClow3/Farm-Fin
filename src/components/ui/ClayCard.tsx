import React, { HTMLAttributes } from 'react';

export interface ClayCardProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'flat' | 'primary' | 'secondary' | 'accent';
  children: React.ReactNode;
}

export const ClayCard: React.FC<ClayCardProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  children,
  onClick,
  ...props
}) => {
  const sizeClass = size !== 'md' ? `clay-card--${size}` : '';
  const variantClass = variant !== 'default' ? `clay-card--${variant}` : '';
  const clickableClass = onClick ? 'clay-card--clickable' : '';

  return (
    <div
      className={`clay-card ${sizeClass} ${variantClass} ${clickableClass} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};
