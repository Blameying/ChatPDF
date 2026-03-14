import { useCallback } from 'react';
import { Trash2, Download, Highlighter, StickyNote } from 'lucide-react';
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

  const handleNavigate = useCallback((page: number) => {
    const container = document.querySelector(`[data-page-number="${page}"]`);
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Group annotations by page
  const sortedAnnotations = [...annotations].sort((a, b) => a.page - b.page || a.id - b.id);

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
        {sortedAnnotations.map(ann => {
          const pos = deserializePosition(ann.position_data);
          const isNote = ann.type === 'note';

          return (
            <div
              key={ann.id}
              className="px-2 py-1.5 rounded mb-1 group cursor-pointer transition-colors"
              style={{
                borderLeft: `3px solid ${ann.color}`,
                backgroundColor: isNote ? 'var(--bg-tertiary)' : undefined,
              }}
              onClick={() => handleNavigate(ann.page)}
              onMouseEnter={e => {
                if (!isNote) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={e => {
                if (!isNote) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              <div className="flex items-start gap-1">
                <div className="shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {isNote ? <StickyNote size={12} /> : <Highlighter size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium px-1 rounded" style={{
                      backgroundColor: ann.color,
                      color: 'var(--text-primary)',
                    }}>
                      p.{ann.page}
                    </span>
                    <span className="text-[10px] uppercase" style={{ color: 'var(--text-secondary)' }}>
                      {ann.type}
                    </span>
                  </div>
                  {pos?.text && (
                    <div className="text-xs mt-0.5 italic" style={{
                      color: 'var(--text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      &ldquo;{pos.text}&rdquo;
                    </div>
                  )}
                  {isNote && ann.content && (
                    <div className="text-xs mt-1 p-1 rounded" style={{
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                    }}>
                      {ann.content}
                    </div>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removeAnnotation(ann.id); }}
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
            No annotations yet. Select text in the PDF to highlight or add notes.
          </div>
        )}
      </div>
    </div>
  );
}
