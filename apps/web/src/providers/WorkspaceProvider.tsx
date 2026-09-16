import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

type WorkspaceContextValue = {
  commandPaletteOpen: boolean;
  shortcutsOpen: boolean;
  terminalOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  openTerminal: () => void;
  closeTerminal: () => void;
  toggleTerminal: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShortcutsOpen(false);
        setTerminalOpen(false);
        setCommandPaletteOpen(true);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        setCommandPaletteOpen(false);
        setShortcutsOpen(false);
        setTerminalOpen((current) => !current);
        return;
      }

      if (
        event.key === '?' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        setCommandPaletteOpen(false);
        setShortcutsOpen(true);
        return;
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
        setShortcutsOpen(false);
        setTerminalOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      commandPaletteOpen,
      shortcutsOpen,
      terminalOpen,
      openCommandPalette: () => {
        setShortcutsOpen(false);
        setTerminalOpen(false);
        setCommandPaletteOpen(true);
      },
      closeCommandPalette: () => setCommandPaletteOpen(false),
      toggleCommandPalette: () => {
        setShortcutsOpen(false);
        setTerminalOpen(false);
        setCommandPaletteOpen((current) => !current);
      },
      openShortcuts: () => {
        setCommandPaletteOpen(false);
        setTerminalOpen(false);
        setShortcutsOpen(true);
      },
      closeShortcuts: () => setShortcutsOpen(false),
      openTerminal: () => {
        setCommandPaletteOpen(false);
        setShortcutsOpen(false);
        setTerminalOpen(true);
      },
      closeTerminal: () => setTerminalOpen(false),
      toggleTerminal: () => {
        setCommandPaletteOpen(false);
        setShortcutsOpen(false);
        setTerminalOpen((current) => !current);
      },
    }),
    [commandPaletteOpen, shortcutsOpen, terminalOpen],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }

  return context;
}
