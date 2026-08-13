import React, { SelectHTMLAttributes } from 'react';

export interface ClaySelectOption {
  value: string | number;
  label: string;
}

export interface ClaySelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: ClaySelectOption[];
  error?: string;
  hint?: string;
}

export const ClaySelect: React.FC<ClaySelectProps> = ({
  label,
  options,
  error,
  hint,
  className = '',
  id,
  children,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input select ${error ? 'input--error' : ''} ${className}`.trim()}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      {error && <span className="input-error-msg">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
};
