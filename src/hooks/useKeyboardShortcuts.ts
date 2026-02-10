import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      shortcuts.forEach(shortcut => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = (shortcut.ctrlKey ?? false) === event.ctrlKey;
        const shiftMatches = (shortcut.shiftKey ?? false) === event.shiftKey;
        const altMatches = (shortcut.altKey ?? false) === event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.callback();
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

// Common keyboard shortcuts for the application
export const createAppShortcuts = (callbacks: {
  onHelp?: () => void;
  onExport?: () => void;
  onReset?: () => void;
  onBack?: () => void;
  onNext?: () => void;
}): KeyboardShortcut[] => [
  {
    key: '?',
    callback: callbacks.onHelp || (() => {}),
    description: 'Show help'
  },
  {
    key: 'e',
    ctrlKey: true,
    callback: callbacks.onExport || (() => {}),
    description: 'Export data (Ctrl + E)'
  },
  {
    key: 'r',
    ctrlKey: true,
    shiftKey: true,
    callback: callbacks.onReset || (() => {}),
    description: 'Reset application (Ctrl + Shift + R)'
  },
  {
    key: 'ArrowLeft',
    altKey: true,
    callback: callbacks.onBack || (() => {}),
    description: 'Go back (Alt + ←)'
  },
  {
    key: 'ArrowRight',
    altKey: true,
    callback: callbacks.onNext || (() => {}),
    description: 'Go forward (Alt + →)'
  }
];

// Help modal content
export const SHORTCUT_HELP = [
  { key: '?', description: 'Show this help dialog' },
  { key: 'Ctrl + E', description: 'Export current data or report' },
  { key: 'Ctrl + Shift + R', description: 'Reset application to start' },
  { key: 'Alt + ←', description: 'Go to previous step' },
  { key: 'Alt + →', description: 'Go to next step' },
  { key: 'Esc', description: 'Close modals and dialogs' }
] as const;
