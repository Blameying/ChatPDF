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

function getWordAtPoint(x: number, y: number): string | null {
  let range: Range | null = null;

  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  }

  if (!range) return null;

  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return null;

  const parent = node.parentElement;
  if (!parent?.closest('.textLayer')) return null;

  const text = node.textContent ?? '';
  const offset = range.startOffset;

  let start = offset;
  let end = offset;

  while (start > 0 && /[\w'-]/.test(text[start - 1])) start--;
  while (end < text.length && /[\w'-]/.test(text[end])) end++;

  const word = text.slice(start, end).trim();
  if (word.length < 2) return null;

  return word;
}

export function useHoverTranslation() {
  const [hover, setHover] = useState<HoverState>({
    visible: false, word: '', translation: '', x: 0, y: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentWord = useRef('');
  const lastPos = useRef({ x: 0, y: 0 });
  const tooltipHovered = useRef(false);
  const config = useSettingsStore(s => s.config);
  const delay = config?.general.hover_delay_ms ?? 2000;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Don't dismiss if user is hovering over the tooltip itself
    if (tooltipHovered.current) return;

    const word = getWordAtPoint(e.clientX, e.clientY);

    if (!word) {
      if (currentWord.current) {
        currentWord.current = '';
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setHover(h => ({ ...h, visible: false }));
      }
      return;
    }

    if (word === currentWord.current) return;

    currentWord.current = word;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setHover(h => ({ ...h, visible: false }));

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (currentWord.current !== word) return;

      // Show tooltip with "translating..." first
      setHover({
        visible: true,
        word,
        translation: 'translating...',
        x: lastPos.current.x,
        y: lastPos.current.y - 10,
      });

      try {
        const result = await translateWord(word);
        if (currentWord.current === word) {
          setHover({
            visible: true,
            word: result.word,
            translation: result.translation,
            x: lastPos.current.x,
            y: lastPos.current.y - 10,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Translate]', msg);
        if (currentWord.current === word) {
          setHover(h => ({ ...h, translation: `failed: ${msg.slice(0, 80)}` }));
        }
      }
    }, delay);
  }, [delay]);

  const dismiss = useCallback(() => {
    setHover(h => ({ ...h, visible: false }));
    currentWord.current = '';
    tooltipHovered.current = false;
  }, []);

  const onTooltipEnter = useCallback(() => {
    tooltipHovered.current = true;
  }, []);

  const onTooltipLeave = useCallback(() => {
    tooltipHovered.current = false;
    // Dismiss after a short delay so user can re-enter
    setTimeout(() => {
      if (!tooltipHovered.current) {
        setHover(h => ({ ...h, visible: false }));
        currentWord.current = '';
      }
    }, 300);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleMouseMove]);

  return { hover, dismiss, onTooltipEnter, onTooltipLeave };
}
