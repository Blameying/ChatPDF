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

// Global frontend translation cache (survives component re-renders)
const translationCache = new Map<string, string>();

function getWordAndRect(
  clientX: number,
  clientY: number,
): { word: string; rect: DOMRect } | null {
  let range: Range | null = null;

  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(clientX, clientY);
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

  // Get the word's bounding rect for tooltip positioning
  try {
    const wordRange = document.createRange();
    wordRange.setStart(node, start);
    wordRange.setEnd(node, end);
    const rects = wordRange.getClientRects();
    if (rects.length > 0) {
      return { word, rect: rects[0] };
    }
  } catch {
    // fall through
  }

  return null;
}

export function useHoverTranslation() {
  const [hover, setHover] = useState<HoverState>({
    visible: false, word: '', translation: '', x: 0, y: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentWord = useRef('');
  const wordRectRef = useRef<DOMRect | null>(null);
  const tooltipHovered = useRef(false);
  const config = useSettingsStore(s => s.config);
  const delay = config?.general.hover_delay_ms ?? 2000;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (tooltipHovered.current) return;

    const result = getWordAndRect(e.clientX, e.clientY);

    if (!result) {
      if (currentWord.current) {
        currentWord.current = '';
        wordRectRef.current = null;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setHover(h => ({ ...h, visible: false }));
      }
      return;
    }

    if (result.word === currentWord.current) return;

    currentWord.current = result.word;
    wordRectRef.current = result.rect;
    setHover(h => ({ ...h, visible: false }));

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const word = currentWord.current;
      const rect = wordRectRef.current;
      if (!word || !rect) return;

      // Position: centered above the word
      const posX = rect.left + rect.width / 2;
      const posY = rect.top;

      // Check frontend cache first
      const cached = translationCache.get(word.toLowerCase());
      if (cached) {
        setHover({ visible: true, word, translation: cached, x: posX, y: posY });
        return;
      }

      setHover({ visible: true, word, translation: 'translating...', x: posX, y: posY });

      try {
        const res = await translateWord(word);
        // Cache the result
        translationCache.set(word.toLowerCase(), res.translation);
        if (currentWord.current === word) {
          setHover({ visible: true, word: res.word, translation: res.translation, x: posX, y: posY });
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
    wordRectRef.current = null;
    tooltipHovered.current = false;
  }, []);

  const onTooltipEnter = useCallback(() => {
    tooltipHovered.current = true;
  }, []);

  const onTooltipLeave = useCallback(() => {
    tooltipHovered.current = false;
    setTimeout(() => {
      if (!tooltipHovered.current) {
        setHover(h => ({ ...h, visible: false }));
        currentWord.current = '';
        wordRectRef.current = null;
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
