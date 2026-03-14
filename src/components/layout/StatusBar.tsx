import { useTabStore } from '../../stores/tabStore';
import { usePdfStore } from '../../stores/pdfStore';
import { useUIStore } from '../../stores/uiStore';

export function StatusBar() {
  const zenMode = useUIStore(s => s.zenMode);
  const activeTab = useTabStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const view = usePdfStore(s => activeTab ? s.getView(activeTab.hash) : null);

  if (zenMode) return null;

  return (
    <div
      className="flex items-center h-6 px-3 text-xs shrink-0 border-t"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
      }}
    >
      {view && view.totalPages > 0 && (
        <>
          <span>Page {view.currentPage} / {view.totalPages}</span>
          <span className="mx-2">|</span>
          <span>Zoom: {Math.round(view.zoom * 100)}%</span>
        </>
      )}
      <div className="flex-1" />
      <span>ChatPDF</span>
    </div>
  );
}
