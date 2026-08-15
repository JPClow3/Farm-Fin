import React from 'react';
import { Skeleton, SkeletonKpiCard } from '../ui/Skeleton';

export const AppShellSkeleton: React.FC = () => (
  <div className="flex-col" style={{ gap: 'var(--space-5)' }}>
    <div className="page-header" style={{ marginBottom: 0 }}>
      <div className="page-title-group">
        <Skeleton variant="title" width="260px" height={28} />
        <div style={{ marginTop: 8 }}>
          <Skeleton variant="text" width="340px" height={13} />
        </div>
      </div>
    </div>

    <div className="grid-4">
      <SkeletonKpiCard />
      <SkeletonKpiCard />
      <SkeletonKpiCard />
      <SkeletonKpiCard />
    </div>

    <Skeleton variant="card" height={320} />
    <Skeleton variant="card" height={220} />
  </div>
);
