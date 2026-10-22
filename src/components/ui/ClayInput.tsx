import React, { InputHTMLAttributes } from 'react';

export interface ClayInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const ClayInput: React.FC<ClayInputProps> = ({
  label,
  error,
  hint,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const messageId = inputId && (error || hint) ? `${inputId}-message` : undefined;
  const describedBy = [props['aria-describedby'], messageId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          id={inputId}
          className={`input ${error ? 'input--error' : ''} ${className}`.trim()}
          style={icon ? { paddingRight: '2.5rem' } : undefined}
          {...props}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={describedBy}
        />
        {icon && (
          <div
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </div>
        )}
      </div>
      {error && (
        <span id={messageId} className="input-error-msg">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={messageId} className="input-hint">
          {hint}
        </span>
      )}
    </div>
  );
};
