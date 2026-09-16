import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Info, TerminalSquare, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { commonTerminalCommands } from '@/lib/terminal-autocomplete';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useToast } from '@/providers/ToastProvider';
import { executeTerminalCommand } from '@/services/terminal';
import type { TerminalExecutionResult } from '@/types/api';

export function GlobalTerminalDrawer() {
  const navigate = useNavigate();
  const { terminalOpen, closeTerminal } = useWorkspace();
  const { user } = useAuth();
  const isViewer = user?.role === 'local-viewer';
  const { pushToast } = useToast();
  const [command, setCommand] = useState('');
  const [cwd, setCwd] = useState('');
  const [profile, setProfile] = useState<'read-only' | 'admin'>('read-only');
  const [result, setResult] = useState<TerminalExecutionResult | null>(null);

  const runMutation = useMutation({
    mutationFn: executeTerminalCommand,
    onSuccess: (payload) => {
      setResult(payload);
      pushToast({
        title: payload.exitCode === 0 ? 'Command completed' : 'Command finished with warnings',
        description: `${payload.durationMs} ms`,
        variant: payload.exitCode === 0 ? 'success' : 'warning',
      });
    },
    onError: (error) => {
      pushToast({
        title: 'Command failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'danger',
      });
    },
  });

  useEffect(() => {
    if (isViewer) {
      setProfile('read-only');
    }
  }, [isViewer]);

  function run() {
    if (!command.trim()) {
      return;
    }

    runMutation.mutate({ command: command.trim(), cwd: cwd.trim() || undefined, profile });
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[74] bg-slate-950/60 backdrop-blur-sm transition ${terminalOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={closeTerminal}
      />

      <aside
        className={`fixed bottom-0 right-0 z-[75] h-[84vh] w-full max-w-4xl border-l border-t border-white/10 bg-panel/95 shadow-[0_-24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition duration-300 ${terminalOpen ? 'translate-y-0' : 'translate-y-full'} rounded-t-[24px]`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-brand/20 bg-brand/10 text-brand">
                <TerminalSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Quick Terminal</p>
                <p className="text-xs text-[rgb(var(--color-text-muted))]">تشغيل فحوصات Linux/CCNA من أي صفحة</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  closeTerminal();
                  navigate('/terminal');
                }}
              >
                صفحة كاملة
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={closeTerminal}
                className="m3-pressable flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.04] text-[rgb(var(--color-text-secondary))]"
                aria-label="إغلاق التيرمنال"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 border-b border-white/10 p-4 md:grid-cols-[1.2fr,1fr,140px,auto]">
            <Input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="Get-NetIPAddress or ip -brief address"
              list="quick-terminal-command-suggestions"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  run();
                }
              }}
            />
            <datalist id="quick-terminal-command-suggestions">
              {commonTerminalCommands.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <Input
              value={cwd}
              onChange={(event) => setCwd(event.target.value)}
              placeholder="مسار العمل (اختياري)"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  run();
                }
              }}
            />
            <select
              value={profile}
              onChange={(event) => setProfile(event.target.value as 'read-only' | 'admin')}
              disabled={isViewer}
              className="h-11 rounded-[12px] border border-line/70 bg-panelAlt/55 px-3 text-xs text-[rgb(var(--color-text-primary))] outline-none"
            >
              <option value="read-only">Read-only</option>
              {!isViewer ? <option value="admin">Admin</option> : null}
            </select>
            <Button onClick={run} disabled={runMutation.isPending || !command.trim()}>
              {runMutation.isPending ? 'جار التنفيذ...' : 'تشغيل'}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-[rgb(var(--color-text-muted))]">
              <Info className="h-4 w-4" />
              استخدم صفحة التيرمنال الكاملة لحفظ الأوامر وربطها بإجراءات الموقع.
            </div>

            <div className="rounded-[16px] border border-white/10 bg-slate-950/55 p-4 font-mono text-xs text-slate-200">
              {result ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-400">
                    exit={result.exitCode ?? 'null'} time={result.durationMs}ms shell={result.shell}
                  </p>
                  {result.stdout ? <pre className="whitespace-pre-wrap break-words">{result.stdout}</pre> : null}
                  {result.stderr ? <pre className="whitespace-pre-wrap break-words text-rose-300">{result.stderr}</pre> : null}
                  {!result.stdout && !result.stderr ? <p className="text-slate-400">لا يوجد مخرجات.</p> : null}
                </div>
              ) : (
                <p className="text-slate-400">لم يتم تنفيذ أي أمر بعد.</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
