import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type DataTableProps = {
  columns: string[];
  rows: ReactNode[];
  className?: string;
};

export function DataTable({ columns, rows, className }: DataTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-white/6', className)}>
      <div className="grid auto-cols-fr grid-flow-col gap-3 border-b border-white/6 bg-slate-950/40 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>
      <div className="divide-y divide-white/6">{rows}</div>
    </div>
  );
}