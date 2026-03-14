import { useEffect, useRef } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
import { splitTextIntoWords, updateWordHighlights } from '../lib/wordSplitter';
import { useWordListStore } from '../stores/wordListStore';

export function useTextLayer(
  page: PDFPageProxy | null,
  containerRef: React.RefObject<HTMLDivElement | null>,
  scale: number,
) {
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const wordSet = useWordListStore(s => s.wordSet);

  useEffect(() => {
    if (!page || !containerRef.current) return;

    const viewport = page.getViewport({ scale });
    let textLayerDiv = textLayerRef.current;

    if (!textLayerDiv) {
      textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'pdf-text-layer';
      textLayerRef.current = textLayerDiv;
    }

    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.height = `${viewport.height}px`;
    textLayerDiv.innerHTML = '';

    if (!containerRef.current.contains(textLayerDiv)) {
      containerRef.current.appendChild(textLayerDiv);
    }

    let cancelled = false;

    page.getTextContent().then(textContent => {
      if (cancelled) return;

      const textLayer = new TextLayer({
        textContentSource: textContent,
        container: textLayerDiv!,
        viewport,
      });

      textLayer.render().then(() => {
        if (!cancelled && textLayerDiv) {
          splitTextIntoWords(textLayerDiv, wordSet);
        }
      });
    });

    return () => { cancelled = true; };
  }, [page, scale, containerRef]);

  // Update highlights when word list changes
  useEffect(() => {
    if (textLayerRef.current) {
      updateWordHighlights(textLayerRef.current, wordSet);
    }
  }, [wordSet]);

  return textLayerRef;
}
