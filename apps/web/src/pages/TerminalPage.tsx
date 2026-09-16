import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Plus, Play, Save, TerminalSquare, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LiveTerminal } from '@/components/terminal/LiveTerminal';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { commonTerminalCommands } from '@/lib/terminal-autocomplete';
import {
  loadTerminalShortcuts,
  resolveCommandPlaceholders,
  saveTerminalShortcuts,
  type TerminalShortcut,
  type TerminalShortcutAction,
} from '@/lib/terminal-shortcuts';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveMetrics } from '@/providers/LiveMetricsProvider';
import { useToast } from '@/providers/ToastProvider';
import { executeTerminalCommand, fetchTerminalPresets } from '@/services/terminal';
import type { TerminalExecutionResult } from '@/types/api';

function createEmptyShortcut(): TerminalShortcut {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    label: 'New command',
    command: '',
    description: '',
    action: 'none',
  };
}

export function TerminalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const { user } = useAuth();
  const { data: liveMetrics } = useLiveMetrics();
  const isViewer = user?.role === 'local-viewer';

  const [command, setCommand] = useState('');
  const [cwd, setCwd] = useState('');
  const [profile, setProfile] = useState<'read-only' | 'admin'>('read-only');
  const [lastResult, setLastResult] = useState<TerminalExecutionResult | null>(null);
  const [shortcuts, setShortcuts] = useState<TerminalShortcut[]>([]);

  const presetsQuery = useQuery({ queryKey: ['terminal-presets'], queryFn: fetchTerminalPresets });

  useEffect(() => {
    setShortcuts(loadTerminalShortcuts());
  }, []);

  useEffect(() => {
    if (isViewer) {
      setProfile('read-only');
    }
  }, [isViewer]);

  const placeholders = useMemo(
    () => ({
      hostname: liveMetrics?.network.hostname ?? 'host',
      ip: liveMetrics?.network.localIp ?? '0.0.0.0',
      user: user?.username ?? 'operator',
    }),
    [liveMetrics?.network.hostname, liveMetrics?.network.localIp, user?.username],
  );

  const runMutation = useMutation({
    mutationFn: executeTerminalCommand,
    onSuccess: (payload) => {
      setLastResult(payload);
      queryClient.invalidateQueries({ queryKey: ['network-overview'] }).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: ['metrics'] }).catch(() => undefined);
      pushToast({
        title: payload.exitCode === 0 ? 'Command completed' : 'Command returned warnings',
        description: `${payload.durationMs} ms`,
        variant: payload.exitCode === 0 ? 'success' : 'warning',
      });
    },
    onError: (error) => {
      pushToast({
        title: 'Terminal command failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'danger',
      });
    },
  });

  function runNow(rawCommand: string, action: TerminalShortcutAction = 'none') {
    const resolved = resolveCommandPlaceholders(rawCommand, placeholders);
    if (!resolved.trim()) {
      return;
    }

    runMutation.mutate(
      { command: resolved, cwd: cwd.trim() || undefined, profile },
      {
        onSuccess: () => {
          if (action === 'open-network') {
            navigate('/network');
          }
          if (action === 'open-files') {
            navigate('/files');
          }
          if (action === 'refresh-metrics') {
            queryClient.invalidateQueries({ queryKey: ['system'] }).catch(() => undefined);
            queryClient.invalidateQueries({ queryKey: ['network-overview'] }).catch(() => undefined);
          }
        },
      },
    );
  }

  function addShortcut() {
    const next = [createEmptyShortcut(), ...shortcuts].slice(0, 24);
    setShortcuts(next);
    saveTerminalShortcuts(next);
  }

  function updateShortcut(id: string, patch: Partial<TerminalShortcut>) {
    const next = shortcuts.map((item) => (item.id === id ? { ...item, ...patch } : item));
    setShortcuts(next);
    saveTerminalShortcuts(next);
  }

  function removeShortcut(id: string) {
    const next = shortcuts.filter((item) => item.id !== id);
    setShortcuts(next);
    saveTerminalShortcuts(next);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="طرفية الخادم"
        title="تيرمنال NOC مدمج"
        description="نفّذ أوامر حقيقية على السيرفر، واحفظ runbooks مخصصة، واربط النتائج بإجراءات داخل الموقع."
        actions={
          <>
            <Badge variant="healthy">From any page: Ctrl `</Badge>
            <Badge variant="neutral">Placeholders: {'{{hostname}} {{ip}} {{user}}'}</Badge>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">تيرمنال تفاعلي مباشر</h3>
            <TerminalSquare className="h-4 w-4 text-brand" />
          </div>

          <LiveTerminal canConnect={user?.role === 'local-admin'} />

          <div className="my-4 h-px bg-white/10" />

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--color-text-muted))]">أمر سريع (تنفيذ واحد)</p>

          <div className="grid gap-3">
            <Input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="Example: ip -brief address"
              list="terminal-command-suggestions"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  runNow(command, 'none');
                }
              }}
            />
            <datalist id="terminal-command-suggestions">
              {commonTerminalCommands.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <Input
              value={cwd}
              onChange={(event) => setCwd(event.target.value)}
              placeholder="مسار عمل اختياري داخل المسار المسموح"
            />
            <select
              value={profile}
              onChange={(event) => setProfile(event.target.value as 'read-only' | 'admin')}
              disabled={isViewer}
              className="h-12 w-full rounded-[12px] border border-line/70 bg-panelAlt/55 px-4 text-sm text-[rgb(var(--color-text-primary))] outline-none"
            >
              <option value="read-only">الصلاحية: Read-only (تشخيص آمن)</option>
              {!isViewer ? <option value="admin">الصلاحية: Admin (تحكم كامل)</option> : null}
            </select>
            {isViewer ? (
              <p className="text-xs text-[rgb(var(--color-text-muted))]">حساب Viewer يعمل بصلاحية Read-only فقط.</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => runNow(command, 'none')} disabled={runMutation.isPending || !command.trim()}>
                {runMutation.isPending ? 'جار التنفيذ...' : 'تشغيل'}
              </Button>
              <Button variant="secondary" onClick={() => setCommand('')}>مسح</Button>
            </div>
          </div>

          <div className="mt-4 rounded-[16px] border border-white/10 bg-slate-950/55 p-4 font-mono text-xs text-slate-200">
            {lastResult ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  exit={lastResult.exitCode ?? 'null'} timedOut={String(lastResult.timedOut)} shell={lastResult.shell} duration={lastResult.durationMs}ms
                </p>
                {lastResult.stdout ? <pre className="whitespace-pre-wrap break-words">{lastResult.stdout}</pre> : null}
                {lastResult.stderr ? <pre className="whitespace-pre-wrap break-words text-rose-300">{lastResult.stderr}</pre> : null}
                {!lastResult.stdout && !lastResult.stderr ? <p className="text-slate-400">No output.</p> : null}
              </div>
            ) : (
              <p className="text-slate-400">Run a command to see output.</p>
            )}
          </div>
        </Card>

        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Quick Presets</h3>
            <Badge variant="neutral">API presets</Badge>
          </div>
          <div className="space-y-3">
            {presetsQuery.data?.presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => runNow(preset.command, 'refresh-metrics')}
                className="m3-pressable w-full rounded-[14px] border border-white/10 bg-white/[0.04] p-3 text-left"
              >
                <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">{preset.label}</p>
                <p className="mt-1 font-mono text-xs text-brand">{preset.command}</p>
                <p className="mt-2 text-xs text-[rgb(var(--color-text-secondary))]">{preset.description}</p>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Custom Commands</h3>
            <Button variant="secondary" size="sm" onClick={addShortcut}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="space-y-4">
            {shortcuts.length ? (
              shortcuts.map((shortcut) => (
                <div key={shortcut.id} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={shortcut.label} onChange={(event) => updateShortcut(shortcut.id, { label: event.target.value })} placeholder="Label" />
                    <Input value={shortcut.description} onChange={(event) => updateShortcut(shortcut.id, { description: event.target.value })} placeholder="Description" />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr,180px]">
                    <Input
                      value={shortcut.command}
                      onChange={(event) => updateShortcut(shortcut.id, { command: event.target.value })}
                      placeholder="Command, supports {{hostname}} {{ip}} {{user}}"
                    />
                    <select
                      value={shortcut.action}
                      onChange={(event) => updateShortcut(shortcut.id, { action: event.target.value as TerminalShortcutAction })}
                      className="h-12 w-full rounded-[12px] border border-line/70 bg-panelAlt/55 px-4 text-sm text-[rgb(var(--color-text-primary))] outline-none"
                    >
                      <option value="none">UI action: none</option>
                      <option value="refresh-metrics">UI action: refresh metrics</option>
                      <option value="open-network">UI action: open network page</option>
                      <option value="open-files">UI action: open files page</option>
                    </select>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => runNow(shortcut.command, shortcut.action)} disabled={runMutation.isPending || !shortcut.command.trim()}>
                      <Play className="h-4 w-4" />
                      Run
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => saveTerminalShortcuts(shortcuts)}>
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => removeShortcut(shortcut.id)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[16px] border border-dashed border-white/12 p-6 text-sm text-[rgb(var(--color-text-secondary))]">
                No custom commands yet. Add one and bind it to a UI action.
              </div>
            )}
          </div>
        </Card>

        <Card className="premium-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-brand" />
            <h3 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">How To Use + Benefits</h3>
          </div>

          <div className="space-y-3 text-sm text-[rgb(var(--color-text-secondary))]">
            <p>1) افتح Quick Terminal من أي صفحة بـ Ctrl + ` ثم اكتب الأمر وشغّله فورًا.</p>
            <p>2) في الصفحة دي احفظ أوامر متكررة كـ Custom Commands لتشغيلها بضغطة واحدة.</p>
            <p>
              3) استخدم placeholders: {'{{hostname}}'} و {'{{ip}}'} و {'{{user}}'} لتوليد أوامر ديناميكية حسب حالة الموقع.
            </p>
            <p>4) اربط الأمر بـ UI action (تحديث القياسات أو فتح صفحة الشبكة/الملفات) علشان يتفاعل مع الموقع بعد التنفيذ.</p>
            <p>5) الفايدة: سرعة في التشغيل اليومي، تقليل الأخطاء اليدوية، وتوحيد runbook للـ Linux/CCNA داخل نفس لوحة التحكم.</p>
          </div>

          {presetsQuery.data?.hints?.length ? (
            <div className="mt-4 rounded-[14px] border border-white/10 bg-white/[0.04] p-4 text-sm text-[rgb(var(--color-text-secondary))]">
              {presetsQuery.data.hints.map((hint) => (
                <p key={hint} className="mb-2 last:mb-0">- {hint}</p>
              ))}
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
