import { useState } from 'react';
import { StickyNote, X } from 'lucide-react';
import type { Annotation } from '../../hooks/useAnnotations';
import { useAnnotations } from '../../hooks/useAnnotations';
import { useTabStore } from '../../stores/tabStore';
import { deserializePosition } from '../../lib/positionSerializer';

interface AnnotationOverlayProps {
  annotations: Annotation[];
  pageNumber: number;
}

export function AnnotationOverlay({ annotations, pageNumber }: AnnotationOverlayProps) {
  const pageAnnotations = annotations.filter(a => a.page === pageNumber);
  const [openNoteId, setOpenNoteId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const activeTab = useTabStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const { removeAnnotation, addAnnotation } = useAnnotations(activeTab?.hash ?? null);

  const handleOpenNote = (ann: Annotation) => {
    if (openNoteId === ann.id) {
      setOpenNoteId(null);
    } else {
      setOpenNoteId(ann.id);
      setEditText(ann.content ?? '');
    }
  };

  const handleSaveNote = async (ann: Annotation) => {
    // Remove old and re-add with updated content
    await removeAnnotation(ann.id);
    const pos = deserializePosition(ann.position_data);
    if (pos) {
      await addAnnotation(ann.page, ann.type, editText, ann.position_data, ann.color);
    }
    setOpenNoteId(null);
  };

  return (
    <>
      {pageAnnotations.map(ann => {
        const pos = deserializePosition(ann.position_data);
        if (!pos?.rects || pos.rects.length === 0) return null;

        const isNote = ann.type === 'note';
        const lastRect = pos.rects[pos.rects.length - 1];

        return (
          <div key={ann.id}>
            {/* Highlight rectangles */}
            {pos.rects.map((rect, i) => (
              <div
                key={`${ann.id}-rect-${i}`}
                className="annotation-highlight"
                style={{
                  left: rect.x,
                  top: rect.y,
                  width: rect.width,
                  height: rect.height,
                  backgroundColor: ann.color,
                  opacity: 0.55,
                  cursor: isNote ? 'default' : 'pointer',
                }}
                onClick={isNote ? undefined : () => removeAnnotation(ann.id)}
                title={isNote ? undefined : 'Click to remove highlight'}
              />
            ))}

            {/* Note badge icon */}
            {isNote && lastRect && (
              <div
                className="absolute cursor-pointer z-10 flex items-center justify-center"
                style={{
                  left: lastRect.x + lastRect.width + 2,
                  top: lastRect.y - 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(59, 130, 246, 0.85)',
                  color: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
                onClick={() => handleOpenNote(ann)}
                title={ann.content ?? 'Note'}
              >
                <StickyNote size={9} />
              </div>
            )}

            {/* Expanded note popover */}
            {isNote && openNoteId === ann.id && lastRect && (
              <div
                className="absolute z-20 rounded-lg shadow-lg p-2"
                style={{
                  left: lastRect.x + lastRect.width + 22,
                  top: lastRect.y - 4,
                  width: 220,
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                }}
                onMouseDown={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Note</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setOpenNoteId(null)}
                      className="p-0.5 rounded hover:opacity-60"
                      style={{ color: 'var(--text-secondary)' }}
                      title="Close"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
                {pos.text && (
                  <div className="text-xs mb-1 px-1 py-0.5 rounded line-clamp-2"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    {pos.text}
                  </div>
                )}
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full h-16 text-xs resize-none rounded p-1 outline-none"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                />
                <div className="flex justify-end mt-1 gap-1">
                  <button
                    onClick={() => { removeAnnotation(ann.id); setOpenNoteId(null); }}
                    className="text-xs px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.85)' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleSaveNote(ann)}
                    className="text-xs px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
