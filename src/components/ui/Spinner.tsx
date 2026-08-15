import React from 'react';

export interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 16, color, className = '', style }) => {
  return (
    <span
      className={`spinner ${className}`.trim()}
      role="status"
      aria-label="Carregando"
      style={{
        width: size,
        height: size,
        color: color || 'currentColor',
        ...style,
      }}
    />
  );
};
