import { useEffect, useRef } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';

export function useTextLayer(
  page: PDFPageProxy | null,
  containerRef: React.RefObject<HTMLDivElement | null>,
  scale: number,
) {
  const textLayerRef = useRef<TextLayer | null>(null);

  useEffect(() => {
    if (!page || !containerRef.current) return;

    const viewport = page.getViewport({ scale });

    // Remove old text layer if present
    const existing = containerRef.current.querySelector('.textLayer');
    if (existing) existing.remove();

    // Create container div — pdfjs v5 expects class "textLayer"
    const textLayerDiv = document.createElement('div');
    textLayerDiv.className = 'textLayer';

    // pdfjs v5 uses CSS variable --scale-factor for sizing
    // Set on container so --total-scale-factor can inherit it via CSS
    containerRef.current.style.setProperty('--scale-factor', String(scale));

    // Position it over the canvas — pdfjs setLayerDimensions will set width/height
    textLayerDiv.style.position = 'absolute';
    textLayerDiv.style.top = '0';
    textLayerDiv.style.left = '0';

    containerRef.current.appendChild(textLayerDiv);

    let cancelled = false;

    if (textLayerRef.current) {
      textLayerRef.current.cancel();
    }

    // Use streamTextContent() directly — avoids getTextContent()'s
    // "for await...of ReadableStream" which WKWebView doesn't support
    const stream = page.streamTextContent();

    const textLayer = new TextLayer({
      textContentSource: stream,
      container: textLayerDiv,
      viewport,
    });
    textLayerRef.current = textLayer;

    textLayer.render().then(() => {
      if (cancelled) return;
      const spans = textLayerDiv.querySelectorAll('span');
      console.log(`[TextLayer] rendered ${spans.length} spans`);
    }).catch(err => {
      console.error('[TextLayer] render error:', err);
    });

    return () => {
      cancelled = true;
      if (textLayerRef.current) {
        textLayerRef.current.cancel();
        textLayerRef.current = null;
      }
    };
  }, [page, scale, containerRef]);
}
