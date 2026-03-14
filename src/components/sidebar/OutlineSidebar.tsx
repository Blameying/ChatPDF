import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { useTabStore } from '../../stores/tabStore';
import { usePdfDocument } from '../../hooks/usePdfDocument';

interface OutlineItem {
  title: string;
  dest: unknown;
  items?: OutlineItem[];
}

export function OutlineSidebar() {
  const activeTab = useTabStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const { doc } = usePdfDocument(activeTab?.path ?? null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  useEffect(() => {
    if (!doc) return;
    doc.getOutline().then(items => {
      setOutline((items as OutlineItem[]) ?? []);
    });
  }, [doc]);

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
      {outline.length === 0 ? (
        <div className="px-2 py-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          No outline available
        </div>
      ) : (
        <OutlineTree items={outline} level={0} />
      )}
    </div>
  );
}

function OutlineTree({ items, level }: { items: OutlineItem[]; level: number }) {
  return (
    <ul className="list-none">
      {items.map((item, i) => (
        <OutlineNode key={i} item={item} level={level} />
      ))}
    </ul>
  );
}

function OutlineNode({ item, level }: { item: OutlineItem; level: number }) {
  const [expanded, setExpanded] = useState(level < 1);
  const hasChildren = item.items && item.items.length > 0;

  return (
    <li>
      <div
        className="flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer hover:opacity-80 text-xs"
        style={{
          paddingLeft: `${level * 12 + 4}px`,
          color: 'var(--text-primary)',
        }}
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          // TODO: navigate to destination
        }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        ) : (
          <FileText size={10} className="opacity-40" />
        )}
        <span className="truncate">{item.title}</span>
      </div>
      {hasChildren && expanded && (
        <OutlineTree items={item.items!} level={level + 1} />
      )}
    </li>
  );
}
