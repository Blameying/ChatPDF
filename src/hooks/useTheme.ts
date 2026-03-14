import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export function useTheme() {
  const config = useSettingsStore(s => s.config);
  const theme = config?.general.theme ?? 'light';

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    root.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return theme;
}
