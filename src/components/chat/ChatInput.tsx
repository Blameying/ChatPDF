import { useState, useRef, useCallback } from 'react';
import { Send, Quote } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string, quotedText?: string) => void;
  disabled?: boolean;
  quotedText?: string;
  onClearQuote?: () => void;
}

export function ChatInput({ onSend, disabled, quotedText, onClearQuote }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || disabled) return;
    onSend(text, quotedText);
    setInput('');
    onClearQuote?.();
  }, [input, disabled, onSend, quotedText, onClearQuote]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-2" style={{ borderColor: 'var(--border-color)' }}>
      {quotedText && (
        <div
          className="flex items-center gap-1 text-xs px-2 py-1 mb-1 rounded"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
        >
          <Quote size={10} />
          <span className="truncate flex-1">{quotedText}</span>
          <button onClick={onClearQuote} className="text-xs hover:opacity-60">x</button>
        </div>
      )}
      <div className="flex items-end gap-1">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this document..."
          rows={1}
          className="flex-1 resize-none text-sm px-2 py-1.5 rounded outline-none"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            maxHeight: '120px',
          }}
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="p-1.5 rounded disabled:opacity-30"
          style={{ color: 'var(--color-primary, #3b82f6)' }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
