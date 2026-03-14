import { FileText, Settings, Moon, Sun, Glasses, X } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useTabStore } from '../../stores/tabStore';

interface TitleBarProps {
  onOpenFile: () => void;
  onOpenSettings: () => void;
}

export function TitleBar({ onOpenFile, onOpenSettings }: TitleBarProps) {
  const config = useSettingsStore(s => s.config);
  const theme = config?.general.theme ?? 'light';
  const updateConfig = useSettingsStore(s => s.updateConfig);
  const zenMode = useUIStore(s => s.zenMode);
  const { tabs, activeTabId, setActiveTab, removeTab } = useTabStore();

  if (zenMode) return null;

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'sepia' : 'light';
    updateConfig('general', 'theme', next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'sepia' ? Glasses : Sun;

  return (
    <div
      className="flex items-center h-9 shrink-0 border-b select-none"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Tabs area (scrollable) */}
      <div className="flex items-center h-full overflow-x-auto min-w-0">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className="flex items-center gap-1.5 px-3 h-full cursor-pointer text-xs shrink-0 border-r"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: tab.id === activeTabId ? 'var(--bg-primary)' : 'transparent',
              color: tab.id === activeTabId ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <FileText size={12} />
            <span className="max-w-32 truncate">{tab.name}</span>
            <button
              className="ml-1 p-0.5 rounded hover:opacity-60"
              onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Draggable spacer */}
      <div className="flex-1 h-full" data-tauri-drag-region />

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 px-2 shrink-0">
        <button
          onClick={onOpenFile}
          className="p-1.5 rounded hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          title="Open PDF"
        >
          <FileText size={15} />
        </button>
        <button
          onClick={cycleTheme}
          className="p-1.5 rounded hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          title={`Theme: ${theme}`}
        >
          <ThemeIcon size={15} />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          title="Settings"
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
}
