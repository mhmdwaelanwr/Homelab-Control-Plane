import { ArrowRight, Eye, EyeOff, Network, ServerCog, ShieldCheck, TerminalSquare, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/providers/I18nProvider';
import { prefetchRoute } from '@/router/prefetch';
import { warmInitialMetrics } from '@/services/system';
import { useToast } from '@/providers/ToastProvider';

export function LoginPage() {
  const { login } = useAuth();
  const { pushToast } = useToast();
  const { t, dir } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setFormError(t('login.error.required'));
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      await login(username, password);
      await Promise.allSettled([prefetchRoute('/'), warmInitialMetrics()]);
      pushToast({
        title: t('login.toast.granted_title'),
        description: t('login.toast.granted_desc'),
        variant: 'success',
      });
      const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
      navigate(nextPath, { replace: true });
    } catch (error) {
      const fallback = t('login.toast.failed_desc');
      const message = error instanceof Error ? error.message : fallback;
      setFormError(message);
      pushToast({
        title: t('login.toast.failed_title'),
        description: message,
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }

  const creds = 'Credentials are configured by the server administrator.';
  const credsToken = '__CREDS__';
  const credsTemplate = t('login.default_credentials', { creds: credsToken });
  const credsParts = credsTemplate.split(credsToken);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="motion-float absolute left-[10%] top-[12%] h-36 w-36 rounded-full bg-brand/12 blur-3xl" />
        <div className="motion-float absolute right-[8%] top-[20%] h-44 w-44 rounded-full bg-info/10 blur-3xl" />
        <div className="motion-float absolute bottom-[8%] left-[35%] h-48 w-48 rounded-full bg-success/10 blur-3xl" />
      </div>

      <div className="grid w-full max-w-[1400px] gap-8 lg:grid-cols-[1.2fr,0.8fr] items-center px-4">
        <div className="glass-chrome motion-fade-up relative overflow-hidden rounded-[32px] p-10 lg:p-14 border border-white/5 shadow-[0_0_100px_rgba(var(--color-brand),0.05)]">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />

          <div className="mb-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand/30 bg-brand/10 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-brand">Local-first homelab control</p>
            </div>
            <h1 className="mt-2 font-display text-5xl font-extrabold leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 xl:text-7xl">
              Homelab <br/>Control Plane
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[rgb(var(--color-text-secondary))] max-w-lg">
              منصة محلية لإدارة ومراقبة خادم Linux المنزلي: الحاويات، الأوامر الطرفية، الشبكة، الملفات، واستهلاك الموارد من واجهة واحدة.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 relative z-10 mt-10">
            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:bg-white/[0.04]">
              <div className="h-10 w-10 flex items-center justify-center rounded-[12px] bg-brand/10 text-brand mb-4">
                <TerminalSquare className="h-5 w-5" />
              </div>
              <p className="text-base font-bold text-white">التحكم الطرفي</p>
              <p className="mt-1.5 text-xs text-slate-400">وصول Shell من الواجهة مع ملفات صلاحيات مختلفة للأوامر</p>
            </div>

            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:bg-white/[0.04]">
              <div className="h-10 w-10 flex items-center justify-center rounded-[12px] bg-indigo-500/10 text-indigo-400 mb-4">
                <ServerCog className="h-5 w-5" />
              </div>
              <p className="text-base font-bold text-white">إدارة Docker</p>
              <p className="mt-1.5 text-xs text-slate-400">عرض الحاويات وتشغيلها وإيقافها وإعادة تشغيلها ومتابعة حالتها</p>
            </div>

            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:bg-white/[0.04]">
              <div className="h-10 w-10 flex items-center justify-center rounded-[12px] bg-emerald-500/10 text-emerald-400 mb-4">
                <Network className="h-5 w-5" />
              </div>
              <p className="text-base font-bold text-white">مراقبة الشبكة</p>
              <p className="mt-1.5 text-xs text-slate-400">عرض معلومات المضيف والواجهات والأجهزة والخدمات المرتبطة بالهوم لاب</p>
            </div>

            <div className="m3-surface [--state-layer-color:rgb(var(--color-brand))] rounded-[20px] border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:bg-white/[0.04]">
              <div className="h-10 w-10 flex items-center justify-center rounded-[12px] bg-rose-500/10 text-rose-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-base font-bold text-white">وصول محمي</p>
              <p className="mt-1.5 text-xs text-slate-400">جلسات محلية بأدوار Admin وViewer مع سجل نشاط للعمليات الحساسة</p>
            </div>
          </div>
        </div>

        <Card className="motion-fade-up p-8 lg:p-10 border border-white/10 shadow-2xl shadow-black/50 [animation-delay:90ms] bg-panel/90 backdrop-blur-2xl rounded-[32px] max-w-md mx-auto w-full">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-accentSoft text-accent shadow-lg shadow-accent/20">
                <ShieldCheck className="h-8 w-8" />
              </div>
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-2">{t('login.title')}</h2>
            <p className="text-sm text-slate-400 max-w-[260px] mx-auto">{t('login.subtitle')}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">{t('login.username')}</label>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                autoComplete="username"
                className="h-12 bg-slate-900/50 border-white/10 focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">{t('login.password')}</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyUp={(event) => setCapsLockOn(event.getModifierState('CapsLock'))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-12 h-12 bg-slate-900/50 border-white/10 focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="m3-pressable absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] text-[rgb(var(--color-text-muted))]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {capsLockOn ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-warning">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  Caps Lock is on
                </p>
              ) : null}
            </div>
            <Button className="w-full h-12 text-base font-medium shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] active:scale-95" disabled={loading} type="submit">
              {loading ? t('login.authenticating') : t('login.enter_dashboard')}
              {!loading ? <ArrowRight className={`ml-2 h-5 w-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} /> : null}
            </Button>

            {formError ? <p className="text-sm text-danger">{formError}</p> : null}
          </form>

          <div className="mt-6 rounded-2xl border border-white/6 bg-slate-950/40 p-4 text-sm text-slate-400">
            {credsParts.length === 2 ? (
              <>
                {credsParts[0]}
                <span className="text-white">{creds}</span>
                {credsParts[1]}
              </>
            ) : (
              <>
                {t('login.default_credentials', { creds: '' })} <span className="text-white">{creds}</span>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
