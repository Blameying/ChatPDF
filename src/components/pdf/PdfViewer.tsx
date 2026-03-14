import { useEffect, useRef, useState, useCallback } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { usePdfDocument } from '../../hooks/usePdfDocument';
import { usePdfStore } from '../../stores/pdfStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { updateProgress, getDocument, trackDocument } from '../../services/tauriCommands';
import { PdfPage } from './PdfPage';
import {
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  BookOpen, List, MessageSquare, Bookmark, Maximize2,
} from 'lucide-react';

interface PdfViewerProps {
  filePath: string;
  hash: string;
}

export function PdfViewer({ filePath, hash }: PdfViewerProps) {
  const { doc, loading, error } = usePdfDocument(filePath);
  const { getView, setPage, setTotalPages, setZoom, setScrollY, initView } = usePdfStore();
  const view = getView(hash);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const config = useSettingsStore(s => s.config);
  const kb = config?.keyboard;
  const { setSidebarPanel, toggleChatPanel, zenMode, toggleZenMode } = useUIStore();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load document and restore progress
  useEffect(() => {
    if (!doc) return;

    const totalPages = doc.numPages;
    setTotalPages(hash, totalPages);

    // Restore saved progress
    getDocument(hash).then(saved => {
      if (saved) {
        initView(hash, {
          currentPage: saved.last_page,
          totalPages,
          zoom: saved.zoom_level,
          scrollY: saved.scroll_y,
        });
      } else {
        initView(hash, { currentPage: 1, totalPages, zoom: 1.0, scrollY: 0 });
      }
    });

    trackDocument(filePath, hash, undefined, totalPages);

    // Load all pages
    const loadPages = async () => {
      const loaded: PDFPageProxy[] = [];
      for (let i = 1; i <= totalPages; i++) {
        loaded.push(await doc.getPage(i));
      }
      setPages(loaded);
    };
    loadPages();
  }, [doc, hash, filePath]);

  // Save progress periodically
  const saveProgress = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const v = usePdfStore.getState().getView(hash);
      updateProgress(hash, v.currentPage, v.scrollY, v.zoom).catch(() => {});
    }, 1000);
  }, [hash]);

  // Scroll handler to track current page
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    setScrollY(hash, container.scrollTop);

    // Determine visible page
    const pageElements = container.querySelectorAll('[data-page-number]');
    let currentPage = 1;
    const containerTop = container.scrollTop;
    const containerMid = containerTop + container.clientHeight / 3;

    for (const el of pageElements) {
      const rect = el as HTMLElement;
      const top = rect.offsetTop;
      const bottom = top + rect.offsetHeight;
      if (top <= containerMid && bottom >= containerMid) {
        currentPage = parseInt(rect.dataset.pageNumber ?? '1');
        break;
      }
    }

    setPage(hash, currentPage);
    saveProgress();
  }, [hash, setScrollY, setPage, saveProgress]);

  // Keyboard navigation
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const scrollAmount = 60;
      if (e.key === (kb?.scroll_down ?? 'j')) {
        container.scrollBy(0, scrollAmount);
      } else if (e.key === (kb?.scroll_up ?? 'k')) {
        container.scrollBy(0, -scrollAmount);
      } else if (e.key === (kb?.next_page ?? 'l')) {
        e.preventDefault();
        goToPage(Math.min(view.currentPage + 1, view.totalPages));
      } else if (e.key === (kb?.prev_page ?? 'h')) {
        e.preventDefault();
        goToPage(Math.max(view.currentPage - 1, 1));
      } else if (e.key === 'g') {
        // Simple go-to-page: next digit keys form the page number
        // For now, just go to first page
        goToPage(1);
      } else if (e.key === 'G') {
        goToPage(view.totalPages);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [kb, view.currentPage, view.totalPages]);

  const goToPage = useCallback((page: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const pageEl = container.querySelector(`[data-page-number="${page}"]`) as HTMLElement;
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(view.zoom + 0.25, 3);
    setZoom(hash, newZoom);
    saveProgress();
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(view.zoom - 0.25, 0.5);
    setZoom(hash, newZoom);
    saveProgress();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        Loading PDF...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {!zenMode && (
        <div
          className="flex items-center h-8 px-2 gap-1 shrink-0 border-b"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <button onClick={() => goToPage(Math.max(view.currentPage - 1, 1))} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--text-secondary)' }}>
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs px-1" style={{ color: 'var(--text-secondary)' }}>
            {view.currentPage} / {view.totalPages}
          </span>
          <button onClick={() => goToPage(Math.min(view.currentPage + 1, view.totalPages))} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--text-secondary)' }}>
            <ChevronRight size={14} />
          </button>
          <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--border-color)' }} />
          <button onClick={handleZoomOut} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--text-secondary)' }}>
            <ZoomOut size={14} />
          </button>
          <span className="text-xs w-10 text-center" style={{ color: 'var(--text-secondary)' }}>
            {Math.round(view.zoom * 100)}%
          </span>
          <button onClick={handleZoomIn} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--text-secondary)' }}>
            <ZoomIn size={14} />
          </button>
          <div className="flex-1" />
          <button onClick={() => setSidebarPanel('outline')} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--text-secondary)' }} title="Outline">
            <List size={14} />
          </button>
          <button onClick={() => setSidebarPanel('wordlist')} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--text-secondary)' }} title="Word List">
            <BookOpen size={14} />
          </button>
          <button onClick={() => setSidebarPanel('annotations')} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--text-secondary)' }} title="Annotations">
            <Bookmark size={14} />
          </button>
          <button onClick={toggleChatPanel} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--text-secondary)' }} title="Chat">
            <MessageSquare size={14} />
          </button>
          <button onClick={toggleZenMode} className="p-1 rounded hover:opacity-60" style={{ color: 'var(--text-secondary)' }} title="Zen Mode">
            <Maximize2 size={14} />
          </button>
        </div>
      )}

      {/* PDF Pages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4"
        style={{ backgroundColor: 'var(--bg-tertiary, #e5e7eb)' }}
        onScroll={handleScroll}
      >
        {pages.map((page, i) => (
          <PdfPage key={i + 1} page={page} scale={view.zoom} pageNumber={i + 1} />
        ))}
      </div>
    </div>
  );
}
