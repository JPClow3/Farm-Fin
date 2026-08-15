'use client';

import React, { useState, useEffect } from 'react';
import {
  DashboardWidgetConfig,
  DashboardWidgetId,
  saveDashboardWidgetConfigs,
  resetDashboardWidgetConfigs,
} from '../../lib/dashboardWidgets';
import { ClayModal } from '../ui/ClayModal';
import { ClayButton } from '../ui/ClayButton';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  LayoutGrid,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig[];
  onSave: (newWidgets: DashboardWidgetConfig[]) => void;
}

export const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onSave,
}) => {
  const [localWidgets, setLocalWidgets] = useState<DashboardWidgetConfig[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalWidgets([...widgets].sort((a, b) => a.order - b.order));
    }
  }, [isOpen, widgets]);

  if (!isOpen) return null;

  const handleToggleVisibility = (id: DashboardWidgetId) => {
    setLocalWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isVisible: !w.isVisible } : w))
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localWidgets.length) return;

    const updated = [...localWidgets];
    const item = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = item;

    // Recalculate order indices
    const reordered = updated.map((w, idx) => ({ ...w, order: idx }));
    setLocalWidgets(reordered);
  };

  const handleToggleSpan = (id: DashboardWidgetId) => {
    setLocalWidgets((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, columnSpan: w.columnSpan === 'full' ? 'half' : 'full' } : w
      )
    );
  };

  const handleReset = () => {
    const defaults = resetDashboardWidgetConfigs();
    setLocalWidgets(defaults);
  };

  const handleSave = () => {
    const reordered = localWidgets.map((w, idx) => ({ ...w, order: idx }));
    saveDashboardWidgetConfigs(reordered);
    onSave(reordered);
    onClose();
  };

  // Drag & Drop support within the modal
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const updated = [...localWidgets];
    const [movedItem] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    const reordered = updated.map((w, idx) => ({ ...w, order: idx }));
    setLocalWidgets(reordered);
  };

  return (
    <ClayModal
      isOpen={isOpen}
      onClose={onClose}
      title="Personalizar Painel Executivo"
      subtitle="Escolha os widgets visíveis, arraste para reordenar ou altere a largura dos blocos"
    >
      <div className="flex-col" style={{ gap: 'var(--space-4)' }}>
        <div
          className="flex-between"
          style={{
            padding: '8px 12px',
            background: 'var(--bg-surface-2)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
          }}
        >
          <span>
            {localWidgets.filter((w) => w.isVisible).length} de {localWidgets.length} widgets ativos
          </span>
          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: 'var(--color-primary-700)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
            }}
          >
            <RotateCcw size={13} />
            Restaurar Padrão
          </button>
        </div>

        {/* Widget List */}
        <div className="flex-col" style={{ gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
          {localWidgets.map((widget, index) => (
            <div
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: widget.isVisible ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
                opacity: widget.isVisible ? 1 : 0.6,
                transition: 'all var(--transition-fast)',
                cursor: 'grab',
              }}
            >
              {/* Left drag handle + Widget Info */}
              <div className="flex-row items-center" style={{ gap: '10px', minWidth: 0, flex: 1 }}>
                <div style={{ color: 'var(--text-tertiary)', cursor: 'grab' }}>
                  <GripVertical size={18} />
                </div>

                <div className="flex-col" style={{ gap: '2px', minWidth: 0 }}>
                  <div className="flex-row items-center" style={{ gap: '6px' }}>
                    <span
                      style={{
                        fontWeight: '600',
                        fontSize: 'var(--text-sm)',
                        color: widget.isVisible ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {widget.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background:
                          widget.columnSpan === 'full'
                            ? 'var(--color-primary-100)'
                            : 'var(--bg-surface-3)',
                        color:
                          widget.columnSpan === 'full'
                            ? 'var(--color-primary-800)'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {widget.columnSpan === 'full' ? 'Largura Total' : '1/2 Coluna'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {widget.description}
                  </span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex-row items-center" style={{ gap: '6px', flexShrink: 0 }}>
                {/* Column Span Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleSpan(widget.id)}
                  title={
                    widget.columnSpan === 'full'
                      ? 'Mudar para 1/2 Coluna'
                      : 'Mudar para Largura Total'
                  }
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-2)',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {widget.columnSpan === 'full' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                {/* Move Up Button */}
                <button
                  type="button"
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  title="Mover para Cima"
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-2)',
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    color: index === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ArrowUp size={14} />
                </button>

                {/* Move Down Button */}
                <button
                  type="button"
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === localWidgets.length - 1}
                  title="Mover para Baixo"
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-surface-2)',
                    cursor: index === localWidgets.length - 1 ? 'not-allowed' : 'pointer',
                    color:
                      index === localWidgets.length - 1
                        ? 'var(--text-tertiary)'
                        : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ArrowDown size={14} />
                </button>

                {/* Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(widget.id)}
                  title={widget.isVisible ? 'Ocultar Widget' : 'Exibir Widget'}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: widget.isVisible
                      ? 'var(--color-primary-100)'
                      : 'var(--bg-surface-2)',
                    cursor: 'pointer',
                    color: widget.isVisible ? 'var(--color-primary-800)' : 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {widget.isVisible ? (
                    <>
                      <Eye size={14} />
                      <span>Ativo</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} />
                      <span>Oculto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="modal__footer" style={{ marginTop: 'var(--space-2)' }}>
          <ClayButton type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </ClayButton>
          <ClayButton type="button" variant="primary" onClick={handleSave}>
            <Check size={16} style={{ marginRight: '6px' }} />
            Salvar Layout
          </ClayButton>
        </div>
      </div>
    </ClayModal>
  );
};
