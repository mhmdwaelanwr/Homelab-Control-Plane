import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="premium-card flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6 sm:py-6">
      <div className="min-w-0">
        <p className="section-kicker">{eyebrow}</p>
        <h2 className="mt-4 font-display text-3xl leading-tight text-[rgb(var(--color-text-primary))] xl:text-[2.3rem]">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--color-text-secondary))]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
