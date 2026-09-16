import { Spinner } from '@/components/ui/spinner';
import { useI18n } from '@/providers/I18nProvider';

type RouteFallbackProps = {
  mode?: 'auth' | 'app';
};

export function RouteFallback({ mode = 'app' }: RouteFallbackProps) {
  const { t } = useI18n();

  return (
    <div className={`flex min-h-screen items-center justify-center px-6 ${mode === 'auth' ? 'bg-canvas' : 'bg-transparent'}`}>
      <div className="motion-fade-up rounded-[28px] border border-white/8 bg-panel/70 px-6 py-5 shadow-panel backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Spinner />
          <div>
            <p className="text-sm font-medium text-white">{t('route.loading_title')}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{t('route.loading_subtitle')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
