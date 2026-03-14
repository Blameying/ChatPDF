import { Trash2, Download } from 'lucide-react';
import { useAnnotations } from '../../hooks/useAnnotations';
import { useTabStore } from '../../stores/tabStore';
import { exportAnnotationsMarkdown } from '../../services/tauriCommands';
import { deserializePosition } from '../../lib/positionSerializer';

export function AnnotationList() {
  const activeTab = useTabStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const { annotations, removeAnnotation } = useAnnotations(activeTab?.hash ?? null);

  const handleExport = async () => {
    if (!activeTab) return;
    try {
      const md = await exportAnnotationsMarkdown(activeTab.hash);
      await navigator.clipboard.writeText(md);
      alert('Exported annotations to clipboard (Markdown)');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="p-2 flex flex-col h-full">
      <div className="flex items-center gap-1 mb-2">
        <h3 className="text-xs font-semibold uppercase px-1" style={{ color: 'var(--text-secondary)' }}>
          Annotations ({annotations.length})
        </h3>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          className="p-1 rounded hover:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
          title="Export Markdown"
        >
          <Download size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {annotations.map(ann => {
          const pos = deserializePosition(ann.position_data);
          return (
            <div
              key={ann.id}
              className="px-2 py-1.5 rounded mb-1 group"
              style={{ borderLeft: `3px solid ${ann.color}` }}
            >
              <div className="flex items-start gap-1">
                <div className="flex-1 min-w-0">
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Page {ann.page} - {ann.type}
                  </div>
                  {ann.content && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {ann.content}
                    </div>
                  )}
                  {pos?.text && (
                    <div className="text-xs mt-0.5 italic truncate" style={{ color: 'var(--text-secondary)' }}>
                      "{pos.text}"
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeAnnotation(ann.id)}
                  className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:text-red-500"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {annotations.length === 0 && (
          <div className="text-xs text-center py-4" style={{ color: 'var(--text-secondary)' }}>
            No annotations yet
          </div>
        )}
      </div>
    </div>
  );
}
