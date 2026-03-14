import { FileText, Settings, Moon, Sun, Glasses } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';

interface TitleBarProps {
  onOpenFile: () => void;
  onOpenSettings: () => void;
}

export function TitleBar({ onOpenFile, onOpenSettings }: TitleBarProps) {
  const config = useSettingsStore(s => s.config);
  const theme = config?.general.theme ?? 'light';
  const updateConfig = useSettingsStore(s => s.updateConfig);
  const zenMode = useUIStore(s => s.zenMode);

  if (zenMode) return null;

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'sepia' : 'light';
    updateConfig('general', 'theme', next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'sepia' ? Glasses : Sun;

  return (
    <div
      className="flex items-center h-10 px-3 gap-2 border-b select-none shrink-0"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
      data-tauri-drag-region
    >
      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
        ChatPDF
      </span>
      <div className="flex-1" data-tauri-drag-region />
      <button
        onClick={onOpenFile}
        className="p-1.5 rounded hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}
        title="Open PDF"
      >
        <FileText size={16} />
      </button>
      <button
        onClick={cycleTheme}
        className="p-1.5 rounded hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}
        title={`Theme: ${theme}`}
      >
        <ThemeIcon size={16} />
      </button>
      <button
        onClick={onOpenSettings}
        className="p-1.5 rounded hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}
        title="Settings"
      >
        <Settings size={16} />
      </button>
    </div>
  );
}
