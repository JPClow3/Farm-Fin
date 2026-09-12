'use client';

import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface ClayTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function ClayTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Nenhum registro encontrado',
  className = '',
  onRowClick,
}: ClayTableProps<T>) {
  return (
    <div
      className={`clay-table-wrapper ${className}`.trim()}
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        maxWidth: '100%',
      }}
    >
      <table className="clay-table" style={{ width: '100%', minWidth: '560px' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align || 'left',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-8)',
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor(row, idx)}
                onClick={() => onRowClick?.(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      textAlign: col.align || 'left',
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render
                      ? col.render(row, idx)
                      : (row as Record<string, unknown>)[col.key] !== undefined
                        ? String((row as Record<string, unknown>)[col.key])
                        : '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
