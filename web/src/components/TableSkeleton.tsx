import React from 'react';

interface TableSkeletonProps {
  rows?: number;
}

/**
 * Skeleton loading para tabelas.
 * @param {TableSkeletonProps} props - Número de linhas.
 * @returns {JSX.Element} Skeleton loader.
 */
export function TableSkeleton({ rows = 8 }: TableSkeletonProps): React.ReactElement {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 mb-3">
          <div className="h-4 bg-slate-200 rounded w-1/6" />
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-1/6" />
          <div className="h-4 bg-slate-200 rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}
