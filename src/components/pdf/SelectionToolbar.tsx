import { useState, useEffect, useCallback, useRef } from 'react';
import { StickyNote, MessageSquarePlus, Copy } from 'lucide-react';
import { useAnnotations } from '../../hooks/useAnnotations';
import { useTabStore } from '../../stores/tabStore';
import { useChatStore, genMsgId } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { serializePosition } from '../../lib/positionSerializer';

interface SelectionState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
  page: number;
  rects: { x: number; y: number; width: number; height: number }[];
}

export function SelectionToolbar() {
  const [sel, setSel] = useState<SelectionState>({
    visible: false, text: '', x: 0, y: 0, page: 0, rects: [],
  });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [noteText, setNoteText] = useState('');

  const activeTab = useTabStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const { addAnnotation } = useAnnotations(activeTab?.hash ?? null);
  const addMessage = useChatStore(s => s.addMessage);
  const { setChatPanelOpen } = useUIStore();

  const noteModeRef = useRef(false);
  noteModeRef.current = noteMode;

  const checkSelection = useCallback(() => {
    // When in note mode, never re-check selection — toolbar must stay visible
    if (noteModeRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSel(s => ({ ...s, visible: false }));
      return;
    }

    const text = selection.toString().trim();
    const range = selection.getRangeAt(0);

    // Check if selection is inside a text layer
    const container = range.commonAncestorContainer;
    const el = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
    if (!el?.closest('.textLayer')) return;

    // Find the page number
    const pageContainer = el.closest('[data-page-number]');
    const page = pageContainer ? parseInt(pageContainer.getAttribute('data-page-number') ?? '0') : 0;

    // Get selection rects relative to the page container
    const clientRects = range.getClientRects();
    const pageRect = pageContainer?.getBoundingClientRect();
    const rects: { x: number; y: number; width: number; height: number }[] = [];

    if (pageRect) {
      for (let i = 0; i < clientRects.length; i++) {
        const r = clientRects[i];
        rects.push({
          x: r.left - pageRect.left,
          y: r.top - pageRect.top,
          width: r.width,
          height: r.height,
        });
      }
    }

    // Position toolbar above the selection
    const lastRect = clientRects[clientRects.length - 1];
    if (lastRect) {
      setSel({
        visible: true,
        text,
        x: lastRect.left + lastRect.width / 2,
        y: lastRect.top - 8,
        page,
        rects,
      });
    }
  }, []);

  useEffect(() => {
    const handleMouseUp = () => setTimeout(checkSelection, 10);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', checkSelection);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', checkSelection);
    };
  }, [checkSelection]);

  // Close toolbar when clicking outside (but not when clicking inside toolbar/textarea)
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setNoteMode(false);
        setNoteText('');
        setSel(s => ({ ...s, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const handleHighlight = async (color: string) => {
    if (!activeTab || sel.page === 0) return;
    const posData = serializePosition({ page: sel.page, rects: sel.rects, text: sel.text });
    await addAnnotation(sel.page, 'highlight', sel.text, posData, color);
    window.getSelection()?.removeAllRanges();
    setSel(s => ({ ...s, visible: false }));
  };

  const handleNote = async () => {
    if (noteMode) {
      // Save the note
      if (!activeTab || sel.page === 0) return;
      const posData = serializePosition({ page: sel.page, rects: sel.rects, text: sel.text });
      await addAnnotation(sel.page, 'note', noteText || sel.text, posData, 'rgba(147, 197, 253, 0.5)');
      setNoteMode(false);
      setNoteText('');
      window.getSelection()?.removeAllRanges();
      setSel(s => ({ ...s, visible: false }));
    } else {
      setNoteMode(true);
    }
  };

  const handleSendToChat = () => {
    if (!activeTab) return;
    addMessage({
      id: genMsgId(),
      role: 'user',
      content: `Regarding this text from the PDF:\n\n> ${sel.text}\n\nPlease explain this passage.`,
      quotedText: sel.text,
    });
    setChatPanelOpen(true);
    window.getSelection()?.removeAllRanges();
    setSel(s => ({ ...s, visible: false }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sel.text);
    setSel(s => ({ ...s, visible: false }));
  };

  if (!sel.visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 tooltip-enter"
      style={{
        left: sel.x,
        top: sel.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div
        className="rounded-lg shadow-lg px-1.5 py-1 flex items-center gap-0.5"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Highlight colors */}
        {['rgba(250, 204, 21, 0.6)', 'rgba(74, 222, 128, 0.6)', 'rgba(251, 146, 60, 0.6)', 'rgba(147, 197, 253, 0.6)'].map(color => (
          <button
            key={color}
            onClick={() => handleHighlight(color)}
            className="w-5 h-5 rounded-full border hover:scale-110 transition-transform"
            style={{ backgroundColor: color, borderColor: 'var(--border-color)' }}
            title="Highlight"
          />
        ))}
        <div className="w-px h-4 mx-0.5" style={{ backgroundColor: 'var(--border-color)' }} />
        <button
          onClick={handleNote}
          className="p-1 rounded hover:opacity-60"
          style={{ color: noteMode ? 'var(--color-primary)' : 'var(--text-secondary)' }}
          title="Add note"
        >
          <StickyNote size={14} />
        </button>
        <button
          onClick={handleSendToChat}
          className="p-1 rounded hover:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
          title="Send to chat"
        >
          <MessageSquarePlus size={14} />
        </button>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
          title="Copy"
        >
          <Copy size={14} />
        </button>
      </div>
      {noteMode && (
        <div className="mt-1 rounded-lg shadow-lg p-2" style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
        }}>
          <textarea
            autoFocus
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Type your note..."
            className="w-48 h-16 text-xs resize-none rounded p-1 outline-none"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          />
          <div className="flex justify-end mt-1 gap-1">
            <button
              onClick={() => { setNoteMode(false); setNoteText(''); }}
              className="text-xs px-2 py-0.5 rounded"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleNote}
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
}
