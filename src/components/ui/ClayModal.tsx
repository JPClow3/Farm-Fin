'use client';

import React, { useEffect } from 'react';
import { ClayButton } from './ClayButton';
import { X } from 'lucide-react';

export interface ClayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const ClayModal: React.FC<ClayModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = '560px',
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
            <h3 className="modal__title">{title}</h3>
            {subtitle && (
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  marginTop: '4px',
                  lineHeight: 'var(--leading-normal)',
                  wordBreak: 'break-word',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <ClayButton
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              borderRadius: 'var(--radius-full)',
              flexShrink: 0,
              width: '38px',
              height: '38px',
            }}
          >
            <X size={18} />
          </ClayButton>
        </div>

        <div className="modal__body">{children}</div>

        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
};
