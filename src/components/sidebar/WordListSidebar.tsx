import { useState } from 'react';
import { Trash2, Download, Search } from 'lucide-react';
import { useDifficultWords } from '../../hooks/useDifficultWords';
import { exportWordsAnki } from '../../services/tauriCommands';

export function WordListSidebar() {
  const { words, removeWord } = useDifficultWords();
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? words.filter(w =>
        w.word.toLowerCase().includes(filter.toLowerCase()) ||
        w.translation.toLowerCase().includes(filter.toLowerCase())
      )
    : words;

  const handleExport = async () => {
    try {
      const tsv = await exportWordsAnki();
      // Copy to clipboard
      await navigator.clipboard.writeText(tsv);
      alert('Exported to clipboard (Anki TSV format)');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="p-2 flex flex-col h-full">
      <div className="flex items-center gap-1 mb-2">
        <h3 className="text-xs font-semibold uppercase px-1" style={{ color: 'var(--text-secondary)' }}>
          Words ({words.length})
        </h3>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          className="p-1 rounded hover:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
          title="Export Anki"
        >
          <Download size={12} />
        </button>
      </div>

      <div className="relative mb-2">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter words..."
          className="w-full text-xs pl-6 pr-2 py-1 rounded outline-none"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map(word => (
          <div
            key={word.id}
            className="flex items-start gap-2 px-2 py-1.5 rounded mb-0.5 group"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium">{word.word}</div>
              <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {word.translation}
              </div>
            </div>
            <button
              onClick={() => removeWord(word.word)}
              className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:text-red-500"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-xs text-center py-4" style={{ color: 'var(--text-secondary)' }}>
            {words.length === 0 ? 'No words yet. Hover over words to translate and add them.' : 'No matches'}
          </div>
        )}
      </div>
    </div>
  );
}
