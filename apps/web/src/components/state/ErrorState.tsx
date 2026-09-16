import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/providers/I18nProvider';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t('error.request_failed');

  return (
    <Card className="border-danger/30 bg-danger/10">
      <div className="flex items-start gap-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
        <div className="flex-1">
          <h3 className="font-display text-lg text-white">{resolvedTitle}</h3>
          <p className="mt-2 text-sm text-slate-300">{message}</p>
          {onRetry ? (
            <Button className="mt-4" variant="secondary" onClick={onRetry}>
              {t('common.retry')}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
