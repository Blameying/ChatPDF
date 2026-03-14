import { useState, useCallback, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export function SearchBar() {
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) {
      clearHighlights();
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }

    clearHighlights();

    const textSpans = document.querySelectorAll('.textLayer span');
    let count = 0;
    const matches: Element[] = [];

    textSpans.forEach(span => {
      const text = span.textContent?.toLowerCase() ?? '';
      if (text.includes(query.toLowerCase())) {
        span.classList.add('search-highlight');
        matches.push(span);
        count++;
      }
    });

    setMatchCount(count);
    if (count > 0) {
      setCurrentMatch(1);
      matches[0]?.classList.add('search-highlight-active');
      matches[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [query]);

  const navigateMatch = useCallback((direction: 'next' | 'prev') => {
    const matches = document.querySelectorAll('.search-highlight');
    if (matches.length === 0) return;

    matches.forEach(m => m.classList.remove('search-highlight-active'));

    let next = direction === 'next' ? currentMatch : currentMatch - 2;
    if (next >= matches.length) next = 0;
    if (next < 0) next = matches.length - 1;

    matches[next]?.classList.add('search-highlight-active');
    matches[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setCurrentMatch(next + 1);
  }, [currentMatch]);

  const clearHighlights = () => {
    document.querySelectorAll('.search-highlight').forEach(el => {
      el.classList.remove('search-highlight', 'search-highlight-active');
    });
  };

  const handleClose = () => {
    clearHighlights();
    setSearchOpen(false);
    setQuery('');
    setMatchCount(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) navigateMatch('prev');
      else if (matchCount > 0) navigateMatch('next');
      else handleSearch();
    }
    if (e.key === 'Escape') handleClose();
  };

  if (!searchOpen) return null;

  return (
    <div
      className="absolute top-0 right-0 z-40 flex items-center gap-1 px-3 py-1.5 rounded-bl-lg shadow-lg"
      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
    >
      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        className="text-sm px-2 py-1 rounded outline-none w-48"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
      />
      <button onClick={handleSearch} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-secondary)' }}>
        Find
      </button>
      {matchCount > 0 && (
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {currentMatch}/{matchCount}
        </span>
      )}
      <button onClick={() => navigateMatch('prev')} className="p-0.5" style={{ color: 'var(--text-secondary)' }}>
        <ChevronUp size={14} />
      </button>
      <button onClick={() => navigateMatch('next')} className="p-0.5" style={{ color: 'var(--text-secondary)' }}>
        <ChevronDown size={14} />
      </button>
      <button onClick={handleClose} className="p-0.5" style={{ color: 'var(--text-secondary)' }}>
        <X size={14} />
      </button>
    </div>
  );
}
