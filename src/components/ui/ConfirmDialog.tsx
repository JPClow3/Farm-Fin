'use client';

import React, { useState } from 'react';
import { ClayModal } from './ClayModal';
import { ClayButton } from './ClayButton';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <ClayModal isOpen={isOpen} onClose={onClose} title={title} maxWidth="440px">
      <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
        <div className="flex-row" style={{ gap: 'var(--space-3)', alignItems: 'flex-start' }}>
          <div
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              background:
                variant === 'danger' ? 'var(--color-danger-light)' : 'var(--color-primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle
              size={18}
              color={variant === 'danger' ? 'var(--color-danger-dark)' : 'var(--color-primary-700)'}
            />
          </div>
          {description && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              {description}
            </p>
          )}
        </div>

        <div className="modal__footer">
          <ClayButton type="button" variant="ghost" onClick={onClose} disabled={isConfirming}>
            {cancelLabel}
          </ClayButton>
          <ClayButton
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={isConfirming}
          >
            {confirmLabel}
          </ClayButton>
        </div>
      </div>
    </ClayModal>
  );
};
