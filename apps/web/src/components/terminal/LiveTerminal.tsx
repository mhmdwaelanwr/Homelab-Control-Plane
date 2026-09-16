import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { terminalWsUrl } from '@/lib/env';
import { readToken } from '@/lib/auth';
import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

type TerminalSocketEvent =
  | { type: 'terminal.ready'; shell?: string; cwd?: string }
  | { type: 'terminal.data'; stream: 'stdout' | 'stderr'; data: string }
  | { type: 'terminal.exit'; code: number | null }
  | { type: 'terminal.error'; message?: string }
  | { type: 'terminal.pong'; ts?: number };

type LiveTerminalProps = {
  canConnect?: boolean;
};

export function LiveTerminal({ canConnect = true }: LiveTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [connected, setConnected] = useState(false);
  const [shell, setShell] = useState<string>('shell');
  const [cwd, setCwd] = useState<string>('');

  useEffect(() => {
    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, Menlo, monospace',
      fontSize: 13,
      lineHeight: 1.3,
      convertEol: true,
      theme: {
        background: '#030712',
        foreground: '#e2e8f0',
        cursor: '#60a5fa',
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminalRef.current = terminal;
    fitRef.current = fitAddon;

    if (containerRef.current) {
      terminal.open(containerRef.current);
      fitAddon.fit();
      terminal.writeln('HELM Live Terminal');
      terminal.writeln('--------------------------------');
      terminal.writeln('اضغط Connect لفتح shell تفاعلي حقيقي.');
      terminal.writeln('');
    }

    const disposeInput = terminal.onData((data) => {
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const resizeHandler = () => {
      fitAddon.fit();
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }));
      }
    };

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      disposeInput.dispose();
      socketRef.current?.close();
      terminal.dispose();
    };
  }, []);

  function connect() {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }

    if (!canConnect) {
      terminal.writeln('\r\n[access denied] Viewer role cannot open interactive shell.');
      return;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = readToken();
    const url = new URL(terminalWsUrl);
    if (token) {
      url.searchParams.set('token', token);
    }

    const socket = new WebSocket(url.toString());
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      terminal.writeln('\r\n[connected] تم الاتصال');
      socket.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }));
      fitRef.current?.fit();
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as TerminalSocketEvent;

        if (message.type === 'terminal.ready') {
          setShell(message.shell ?? 'shell');
          setCwd(message.cwd ?? '');
          terminal.writeln(`[ready] ${message.shell ?? 'shell'} ${message.cwd ?? ''}`);
          return;
        }

        if (message.type === 'terminal.data') {
          terminal.write(message.data);
          return;
        }

        if (message.type === 'terminal.exit') {
          terminal.writeln(`\r\n[session closed] code=${message.code ?? 'null'}`);
          return;
        }

        if (message.type === 'terminal.error') {
          terminal.writeln(`\r\n[error] ${message.message ?? 'terminal error'}`);
        }
      } catch {
        terminal.writeln('\r\n[error] invalid terminal message');
      }
    };

    socket.onclose = () => {
      setConnected(false);
      terminal.writeln('\r\n[disconnected] تم فصل الاتصال');
    };

    socket.onerror = () => {
      terminal.writeln('\r\n[error] websocket failure');
    };
  }

  function disconnect() {
    socketRef.current?.close();
  }

  return (
    <div className="rounded-[18px] border border-white/10 bg-slate-950/70 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'healthy' : 'warning'}>{connected ? 'Shell متصل' : 'Shell غير متصل'}</Badge>
          <Badge variant="neutral">{shell}</Badge>
          {cwd ? <Badge variant="neutral">{cwd}</Badge> : null}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={connect} disabled={connected || !canConnect}>Connect</Button>
          <Button size="sm" variant="secondary" onClick={disconnect} disabled={!connected}>Disconnect</Button>
        </div>
      </div>

      <div ref={containerRef} className="h-[360px] w-full overflow-hidden rounded-[12px] border border-white/10" />
    </div>
  );
}
