import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';

export function useKeyboardShortcuts() {
  const { toggleZenMode, toggleSearch, setCommandPaletteOpen } = useUIStore();
  const config = useSettingsStore(s => s.config);
  const kb = config?.keyboard;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Command palette: Ctrl/Cmd + P
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Search: Ctrl/Cmd + F
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        toggleSearch();
        return;
      }

      if (isInput) return;

      // Zen mode
      if (e.key === (kb?.zen_mode ?? 'F11')) {
        e.preventDefault();
        toggleZenMode();
        return;
      }

      // Vim-style navigation
      if (e.key === (kb?.search ?? '/')) {
        e.preventDefault();
        toggleSearch();
        return;
      }

      // j/k/h/l navigation is handled by PdfViewer
      // Escape closes overlays
      if (e.key === 'Escape') {
        useUIStore.getState().setSearchOpen(false);
        useUIStore.getState().setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [kb, toggleZenMode, toggleSearch, setCommandPaletteOpen]);
}
