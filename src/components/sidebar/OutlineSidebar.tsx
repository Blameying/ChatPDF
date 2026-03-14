import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { useTabStore } from '../../stores/tabStore';
import { usePdfDocument } from '../../hooks/usePdfDocument';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface OutlineItem {
  title: string;
  page: number;
  level: number;
  items?: OutlineItem[];
}

export function OutlineSidebar() {
  const activeTab = useTabStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const { doc } = usePdfDocument(activeTab?.path ?? null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doc) return;
    setLoading(true);

    // Try embedded outline first
    doc.getOutline().then(async (items) => {
      if (items && items.length > 0) {
        const parsed = await parseOutlineItems(doc, items);
        setOutline(parsed);
      } else {
        // No embedded outline — extract section headings from text
        const extracted = await extractHeadingsFromText(doc);
        setOutline(extracted);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [doc]);

  const handleClick = (item: OutlineItem) => {
    if (item.page <= 0) return;
    const container = document.querySelector('[data-page-number="' + item.page + '"]');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!activeTab) {
    return (
      <div className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
        No document open
      </div>
    );
  }

  return (
    <div className="p-2">
      <h3 className="text-xs font-semibold uppercase px-2 py-1 mb-1" style={{ color: 'var(--text-secondary)' }}>
        Outline
      </h3>
      {loading ? (
        <div className="px-2 py-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Loading...
        </div>
      ) : outline.length === 0 ? (
        <div className="px-2 py-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          No outline available
        </div>
      ) : (
        <ul className="list-none">
          {outline.map((item, i) => (
            <OutlineNode key={i} item={item} onNavigate={handleClick} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OutlineNode({ item, onNavigate }: { item: OutlineItem; onNavigate: (item: OutlineItem) => void }) {
  const [expanded, setExpanded] = useState(item.level < 2);
  const hasChildren = item.items && item.items.length > 0;

  // Visual differentiation by level
  const fontSize = item.level === 0 ? '0.8125rem' : '0.75rem';
  const fontWeight = item.level === 0 ? 600 : item.level === 1 ? 500 : 400;
  const opacity = item.level >= 3 ? 0.75 : 1;

  return (
    <li>
      <div
        className="relative flex items-center gap-1 py-1 px-1 rounded cursor-pointer transition-colors"
        style={{
          paddingLeft: `${item.level * 16 + 8}px`,
          color: 'var(--text-primary)',
          fontSize,
          fontWeight,
          opacity,
        }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onNavigate(item);
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-tertiary)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        }}
      >
        {/* Vertical indent lines for nested items */}
        {Array.from({ length: item.level }, (_, lvl) => (
          <div
            key={lvl}
            className="absolute top-0 bottom-0"
            style={{
              left: `${lvl * 16 + 12}px`,
              width: '1px',
              backgroundColor: 'var(--border-color)',
            }}
          />
        ))}
        {hasChildren ? (
          expanded ? <ChevronDown size={12} className="shrink-0" /> : <ChevronRight size={12} className="shrink-0" />
        ) : (
          <FileText size={10} className="opacity-40 shrink-0" />
        )}
        <span className="truncate flex-1">{item.title}</span>
        {item.page > 0 && (
          <span className="text-[10px] opacity-40 shrink-0">p.{item.page}</span>
        )}
      </div>
      {hasChildren && expanded && (
        <ul className="list-none">
          {item.items!.map((child, i) => (
            <OutlineNode key={i} item={child} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}

// Parse embedded PDF outline items to our format
async function parseOutlineItems(
  doc: PDFDocumentProxy,
  items: { title: string; dest: unknown; items?: unknown[] }[],
  level = 0,
): Promise<OutlineItem[]> {
  const result: OutlineItem[] = [];
  for (const item of items) {
    let page = 0;
    try {
      if (typeof item.dest === 'string') {
        const dest = await doc.getDestination(item.dest);
        if (dest) {
          const ref = dest[0];
          page = await doc.getPageIndex(ref) + 1;
        }
      } else if (Array.isArray(item.dest) && item.dest.length > 0) {
        page = await doc.getPageIndex(item.dest[0]) + 1;
      }
    } catch {
      // Can't resolve destination
    }

    const children = item.items && (item.items as []).length > 0
      ? await parseOutlineItems(doc, item.items as { title: string; dest: unknown; items?: unknown[] }[], level + 1)
      : undefined;

    result.push({ title: item.title, page, level, items: children });
  }
  return result;
}

// Read text content from a ReadableStream (avoids getTextContent's for-await which WKWebView doesn't support)
async function readTextContent(page: { streamTextContent: () => ReadableStream }): Promise<{ items: { str?: string; height?: number; transform?: number[] }[] }> {
  const stream = page.streamTextContent();
  const reader = stream.getReader();
  const items: { str?: string }[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value?.items) items.push(...value.items);
  }
  return { items };
}

// Extract section headings by analyzing text content font sizes
async function extractHeadingsFromText(doc: PDFDocumentProxy): Promise<OutlineItem[]> {
  const headings: OutlineItem[] = [];
  const totalPages = doc.numPages;

  // Common academic paper section patterns
  const sectionPatterns = [
    /^(I{1,3}V?|VI{0,3}|IX|X{0,3})\.\s+[A-Z]/,  // Roman numeral: "I. INTRODUCTION"
    /^\d+\.\s+[A-Z]/,                               // Numeric: "1. Introduction"
    /^(Abstract|Introduction|Related Work|Method|Methodology|Experiment|Results|Discussion|Conclusion|References|Acknowledgment)/i,
  ];

  for (let i = 1; i <= totalPages; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await readTextContent(page);

      for (const item of content.items) {
        if (!('str' in item) || !item.str?.trim()) continue;
        const text = item.str.trim();

        // Check if this looks like a section heading
        const isSection = sectionPatterns.some(p => p.test(text));
        if (isSection && text.length > 2 && text.length < 100) {
          // Determine level: main sections (Roman/numbered) vs subsections
          const isSubsection = /^[A-Z]\.\s/.test(text) || /^\d+\.\d+/.test(text);
          headings.push({
            title: text,
            page: i,
            level: isSubsection ? 1 : 0,
          });
        }
      }
    } catch {
      // Skip pages that fail
    }
  }

  return headings;
}
