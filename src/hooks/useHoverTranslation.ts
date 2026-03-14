import { useState, useEffect, useRef, useCallback } from 'react';
import { translateWord } from '../services/tauriCommands';
import { useSettingsStore } from '../stores/settingsStore';

interface HoverState {
  visible: boolean;
  word: string;
  translation: string;
  x: number;
  y: number;
}

export function useHoverTranslation() {
  const [hover, setHover] = useState<HoverState>({
    visible: false, word: '', translation: '', x: 0, y: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentWord = useRef('');
  const config = useSettingsStore(s => s.config);
  const delay = config?.general.hover_delay_ms ?? 2000;

  const handleMouseEnter = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('word-span')) return;

    const word = (target.textContent ?? '').replace(/[^\w'-]/g, '').trim();
    if (!word || word.length < 2) return;

    currentWord.current = word;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (currentWord.current !== word) return;

      try {
        const result = await translateWord(word);
        if (currentWord.current === word) {
          const rect = target.getBoundingClientRect();
          setHover({
            visible: true,
            word: result.word,
            translation: result.translation,
            x: rect.left + rect.width / 2,
            y: rect.top - 8,
          });
        }
      } catch {
        // Translation failed silently
      }
    }, delay);
  }, [delay]);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('word-span')) return;

    currentWord.current = '';
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHover(h => ({ ...h, visible: false }));
  }, []);

  const dismiss = useCallback(() => {
    setHover(h => ({ ...h, visible: false }));
    currentWord.current = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleMouseEnter, handleMouseLeave]);

  return { hover, dismiss };
}
