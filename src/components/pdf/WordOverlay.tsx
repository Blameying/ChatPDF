import { useEffect, useState, useRef } from 'react';
import { useWordListStore, type DifficultWord } from '../../stores/wordListStore';

interface WordOverlayProps {
  pageNumber: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
}

interface WordMatch {
  word: DifficultWord;
  rects: { x: number; y: number; width: number; height: number }[];
}

export function WordOverlay({ pageNumber, containerRef, scale }: WordOverlayProps) {
  const { words } = useWordListStore();
  const [matches, setMatches] = useState<WordMatch[]>([]);
  const scanRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || words.length === 0) {
      setMatches([]);
      return;
    }

    // Debounce to wait for text layer to render
    const scanId = ++scanRef.current;
    const timer = setTimeout(() => {
      if (scanRef.current !== scanId) return;

      const textLayer = container.querySelector('.textLayer');
      if (!textLayer) return;

      const spans = textLayer.querySelectorAll('span');
      if (spans.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const found: WordMatch[] = [];
      const seenWords = new Set<string>();

      for (const dw of words) {
        const wordLower = dw.word.toLowerCase();
        if (seenWords.has(wordLower)) continue;

        for (const span of spans) {
          const text = span.textContent ?? '';
          const textLower = text.toLowerCase();
          let searchStart = 0;

          while (true) {
            const idx = textLower.indexOf(wordLower, searchStart);
            if (idx === -1) break;
            searchStart = idx + wordLower.length;

            // Check word boundaries
            const before = idx > 0 ? textLower[idx - 1] : ' ';
            const after = idx + wordLower.length < textLower.length ? textLower[idx + wordLower.length] : ' ';
            if (/\w/.test(before) || /\w/.test(after)) continue;

            // Get the position using Range
            const textNode = span.firstChild;
            if (!textNode || textNode.nodeType !== Node.TEXT_NODE) continue;

            try {
              const range = document.createRange();
              range.setStart(textNode, idx);
              range.setEnd(textNode, idx + wordLower.length);
              const rects = range.getClientRects();

              const matchRects: { x: number; y: number; width: number; height: number }[] = [];
              for (let i = 0; i < rects.length; i++) {
                const r = rects[i];
                matchRects.push({
                  x: r.left - containerRect.left,
                  y: r.top - containerRect.top,
                  width: r.width,
                  height: r.height,
                });
              }

              if (matchRects.length > 0 && !seenWords.has(wordLower)) {
                found.push({ word: dw, rects: matchRects });
                seenWords.add(wordLower);
              }
            } catch {
              // Range creation failed
            }
          }
        }
      }

      setMatches(found);
    }, 500);

    return () => clearTimeout(timer);
  }, [words, pageNumber, scale, containerRef]);

  if (matches.length === 0) return null;

  return (
    <>
      {matches.map((m, mi) => {
        // Show underline on all rects, translation badge on the last rect
        const lastRect = m.rects[m.rects.length - 1];
        return (
          <div key={`wm-${mi}`}>
            {/* Underline */}
            {m.rects.map((rect, ri) => (
              <div
                key={`wu-${mi}-${ri}`}
                style={{
                  position: 'absolute',
                  left: rect.x,
                  top: rect.y + rect.height - 1,
                  width: rect.width,
                  height: 2,
                  backgroundColor: 'rgba(255, 152, 0, 0.6)',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              />
            ))}
            {/* Translation badge */}
            {lastRect && (
              <div
                style={{
                  position: 'absolute',
                  left: lastRect.x + lastRect.width + 3,
                  top: lastRect.y,
                  fontSize: `${Math.max(9, 10 * scale)}px`,
                  lineHeight: '1.2',
                  color: 'rgba(255, 100, 0, 0.85)',
                  fontWeight: 500,
                  pointerEvents: 'none',
                  zIndex: 3,
                  whiteSpace: 'nowrap',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {m.word.translation}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
