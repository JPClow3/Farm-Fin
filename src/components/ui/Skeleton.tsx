import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'circle';
  width?: number | string;
  height?: number | string;
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  style,
}) => {
  const items = Array.from({ length: Math.max(1, count) });

  return (
    <>
      {items.map((_, i) => (
        <span
          key={i}
          className={`skeleton skeleton--${variant} ${className}`.trim()}
          style={{
            width,
            height,
            marginBottom: count > 1 && i < items.length - 1 ? 'var(--space-2)' : undefined,
            ...style,
          }}
        />
      ))}
    </>
  );
};

export interface SkeletonKpiCardProps {
  className?: string;
}

export const SkeletonKpiCard: React.FC<SkeletonKpiCardProps> = ({ className = '' }) => (
  <div className={`kpi-card ${className}`.trim()}>
    <div className="kpi-card__header">
      <Skeleton variant="text" width="60%" height={12} />
      <Skeleton variant="circle" width={32} height={32} />
    </div>
    <div style={{ margin: '10px 0' }}>
      <Skeleton variant="title" width="70%" height={26} />
    </div>
    <Skeleton variant="text" width="45%" height={11} />
  </div>
);

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 4 }) => (
  <div className="clay-table-wrapper">
    <table className="clay-table">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <td key={c}>
                <Skeleton variant="text" width={c === 0 ? '80%' : '55%'} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonPageHeader: React.FC = () => (
  <div className="page-header" style={{ marginBottom: 0 }}>
    <div className="page-title-group">
      <Skeleton variant="title" width="280px" height={28} />
      <div style={{ marginTop: 8 }}>
        <Skeleton variant="text" width="380px" height={13} />
      </div>
    </div>
  </div>
);
