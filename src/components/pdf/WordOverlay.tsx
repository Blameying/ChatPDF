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
  lineSpacing: number; // distance from this line's top to next line's top
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

    const scanId = ++scanRef.current;
    const timer = setTimeout(() => {
      if (scanRef.current !== scanId) return;

      const textLayer = container.querySelector('.textLayer');
      if (!textLayer) return;

      const spans = textLayer.querySelectorAll('span');
      if (spans.length === 0) return;

      const containerRect = container.getBoundingClientRect();

      // Collect all distinct line top-positions (dedupe within 3px)
      const lineTopsRaw: number[] = [];
      for (const span of spans) {
        const r = span.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        lineTopsRaw.push(r.top - containerRect.top);
      }
      lineTopsRaw.sort((a, b) => a - b);

      const lineTops: number[] = [];
      for (const t of lineTopsRaw) {
        if (lineTops.length === 0 || t - lineTops[lineTops.length - 1] > 3) {
          lineTops.push(t);
        }
      }

      // Helper: find spacing from this line's top to next line's top
      const findLineSpacing = (lineTop: number): number => {
        for (const t of lineTops) {
          if (t > lineTop + 3) return t - lineTop;
        }
        return 0; // last line on page
      };

      // Scan words
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

            const before = idx > 0 ? textLower[idx - 1] : ' ';
            const after = idx + wordLower.length < textLower.length ? textLower[idx + wordLower.length] : ' ';
            if (/\w/.test(before) || /\w/.test(after)) continue;

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
                const firstRect = matchRects[0];
                const lineSpacing = findLineSpacing(firstRect.y);
                found.push({ word: dw, rects: matchRects, lineSpacing });
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
        const lastRect = m.rects[m.rects.length - 1];
        if (!lastRect) return null;

        // Font size: use the gap between lineSpacing and text height.
        // lineSpacing = distance between tops of consecutive lines
        // textHeight = the word rect's height
        // available = lineSpacing - textHeight (the actual leading)
        // If lineSpacing is 0 (last line), fall back to textHeight * 0.4
        const textHeight = lastRect.height;
        const leading = m.lineSpacing > 0 ? m.lineSpacing - textHeight : 0;
        // Use 80% of leading, but fall back to a fraction of text height if leading is tiny
        const fontSize = leading > 4 ? Math.min(leading * 0.8, textHeight * 0.55)
                                     : textHeight * 0.4;
        // Don't render if absurdly small
        if (fontSize < 3) return null;

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
                  height: 1,
                  backgroundColor: 'rgba(255, 152, 0, 0.6)',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              />
            ))}
            {/* Translation: below the underline, within the leading space */}
            <div
              style={{
                position: 'absolute',
                left: lastRect.x,
                top: lastRect.y + lastRect.height + 1,
                fontSize: `${fontSize}px`,
                lineHeight: '1',
                color: 'rgba(255, 100, 0, 0.7)',
                fontWeight: 500,
                pointerEvents: 'none',
                zIndex: 3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: Math.max(lastRect.width * 4, 100 * scale),
              }}
            >
              {m.word.translation}
            </div>
          </div>
        );
      })}
    </>
  );
}
