import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-white/12 bg-slate-950/20 text-center">
      <div className="flex flex-col items-center gap-4 py-8">
        {icon ? <div className="text-slate-500">{icon}</div> : null}
        <div>
          <h3 className="font-display text-xl text-white">{title}</h3>
          <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
        </div>
        {action}
      </div>
    </Card>
  );
}
