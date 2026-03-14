import { X, FileText } from 'lucide-react';
import { useTabStore } from '../../stores/tabStore';
import { useUIStore } from '../../stores/uiStore';

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTabStore();
  const zenMode = useUIStore(s => s.zenMode);

  if (zenMode || tabs.length === 0) return null;

  return (
    <div
      className="flex items-center h-9 overflow-x-auto shrink-0 border-b"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
    >
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
  );
}
