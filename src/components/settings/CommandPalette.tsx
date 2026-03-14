import { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText, Moon, Sun, Glasses, BookOpen, MessageSquare,
  List, Bookmark, Maximize2, Search, Download,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setSidebarPanel, toggleChatPanel, toggleZenMode, toggleSearch } = useUIStore();
  const updateConfig = useSettingsStore(s => s.updateConfig);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = useMemo(() => [
    { id: 'open', label: 'Open PDF', icon: <FileText size={14} />, action: () => {}, keywords: 'file open' },
    { id: 'theme-light', label: 'Theme: Light', icon: <Sun size={14} />, action: () => updateConfig('general', 'theme', 'light'), keywords: 'theme light' },
    { id: 'theme-dark', label: 'Theme: Dark', icon: <Moon size={14} />, action: () => updateConfig('general', 'theme', 'dark'), keywords: 'theme dark' },
    { id: 'theme-sepia', label: 'Theme: Sepia', icon: <Glasses size={14} />, action: () => updateConfig('general', 'theme', 'sepia'), keywords: 'theme sepia warm' },
    { id: 'outline', label: 'Toggle Outline', icon: <List size={14} />, action: () => setSidebarPanel('outline'), keywords: 'outline toc contents' },
    { id: 'wordlist', label: 'Toggle Word List', icon: <BookOpen size={14} />, action: () => setSidebarPanel('wordlist'), keywords: 'words vocabulary' },
    { id: 'annotations', label: 'Toggle Annotations', icon: <Bookmark size={14} />, action: () => setSidebarPanel('annotations'), keywords: 'annotations highlights notes' },
    { id: 'chat', label: 'Toggle Chat Panel', icon: <MessageSquare size={14} />, action: () => toggleChatPanel(), keywords: 'chat ai llm' },
    { id: 'zen', label: 'Toggle Zen Mode', icon: <Maximize2 size={14} />, action: () => toggleZenMode(), keywords: 'zen focus fullscreen' },
    { id: 'search', label: 'Search in Document', icon: <Search size={14} />, action: () => toggleSearch(), keywords: 'find search ctrl f' },
    { id: 'export-words', label: 'Export Words (Anki)', icon: <Download size={14} />, action: () => {}, keywords: 'export anki vocabulary' },
  ], [updateConfig, setSidebarPanel, toggleChatPanel, toggleZenMode, toggleSearch]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      (c.keywords ?? '').toLowerCase().includes(q)
    );
  }, [query, commands]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const execute = (cmd: Command) => {
    setCommandPaletteOpen(false);
    cmd.action();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      execute(filtered[selected]);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center pt-[15vh] bg-black/30" onClick={() => setCommandPaletteOpen(false)}>
      <div
        className="w-[480px] rounded-lg shadow-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', maxHeight: '400px' }}
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          className="w-full px-4 py-3 text-sm outline-none border-b"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)',
          }}
        />
        <div className="overflow-y-auto max-h-[300px]">
          {filtered.map((cmd, i) => (
            <div
              key={cmd.id}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer text-sm"
              style={{
                backgroundColor: i === selected ? 'var(--bg-tertiary)' : 'transparent',
                color: 'var(--text-primary)',
              }}
              onClick={() => execute(cmd)}
              onMouseEnter={() => setSelected(i)}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{cmd.icon}</span>
              {cmd.label}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No matching commands
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
