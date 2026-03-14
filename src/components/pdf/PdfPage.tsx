import { useEffect, useRef } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { useTextLayer } from '../../hooks/useTextLayer';
import { AnnotationOverlay } from './AnnotationOverlay';
import { WordOverlay } from './WordOverlay';
import { useAnnotations } from '../../hooks/useAnnotations';
import { useTabStore } from '../../stores/tabStore';

interface PdfPageProps {
  page: PDFPageProxy;
  scale: number;
  pageNumber: number;
}

export function PdfPage({ page, scale, pageNumber }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<ReturnType<PDFPageProxy['render']> | null>(null);

  const activeTab = useTabStore(s => s.tabs.find(t => t.id === s.activeTabId));
  const { annotations } = useAnnotations(activeTab?.hash ?? null);

  useTextLayer(page, containerRef, scale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !page) return;

    const viewport = page.getViewport({ scale });
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Cancel previous render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    });
    renderTaskRef.current = renderTask;

    renderTask.promise.then(() => {
      // rendered
    }).catch(() => {
      // Render cancelled or failed
    });

    return () => {
      renderTask.cancel();
    };
  }, [page, scale]);

  const viewport = page.getViewport({ scale });

  return (
    <div
      ref={containerRef}
      className="pdf-page-container mx-auto mb-2 shadow-md"
      style={{
        width: viewport.width,
        height: viewport.height,
        backgroundColor: 'white',
      }}
      data-page-number={pageNumber}
    >
      <canvas ref={canvasRef} />
      <AnnotationOverlay annotations={annotations} pageNumber={pageNumber} />
      <WordOverlay pageNumber={pageNumber} containerRef={containerRef} scale={scale} />
    </div>
  );
}
