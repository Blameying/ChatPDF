import { Plus } from 'lucide-react';
import { useWordListStore } from '../../stores/wordListStore';

interface HoverState {
  visible: boolean;
  word: string;
  translation: string;
  x: number;
  y: number;
}

interface HoverTooltipProps {
  hover: HoverState;
  onDismiss: () => void;
}

export function HoverTooltip({ hover, onDismiss }: HoverTooltipProps) {
  const { addWord, isKnownWord } = useWordListStore();

  if (!hover.visible) return null;

  const isKnown = isKnownWord(hover.word);

  const handleAddWord = async () => {
    await addWord(hover.word, hover.translation);
    onDismiss();
  };

  return (
    <div
      className="fixed z-50 tooltip-enter"
      style={{
        left: hover.x,
        top: hover.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div
        className="rounded-lg shadow-lg px-3 py-2 text-sm max-w-xs"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-start gap-2">
          <div>
            <div className="font-medium">{hover.word}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {hover.translation}
            </div>
          </div>
          {!isKnown && (
            <button
              onClick={handleAddWord}
              className="shrink-0 p-0.5 rounded hover:opacity-60"
              style={{ color: 'var(--text-secondary)' }}
              title="Add to word list"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
