import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/providers/I18nProvider';
import type { BreadcrumbItem } from '@/types/api';

type FileBreadcrumbsProps = {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
};

export function FileBreadcrumbs({ items, onNavigate }: FileBreadcrumbsProps) {
  const { dir } = useI18n();
  const Separator = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-[20px] border border-white/6 bg-panelAlt/45 px-2 py-2 text-sm text-slate-300">
      {items.map((item, index) => (
        <div key={item.path} className="flex items-center gap-1">
          <Button variant="ghost" className="h-auto rounded-xl px-3 py-1.5 text-sm" onClick={() => onNavigate(item.path)}>
            {item.label}
          </Button>
          {index < items.length - 1 ? <Separator className="h-4 w-4 text-slate-600" /> : null}
        </div>
      ))}
    </div>
  );
}
