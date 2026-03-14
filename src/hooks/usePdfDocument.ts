import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

export function usePdfDocument(filePath: string | null) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (!filePath || filePath === prevPath.current) return;
    prevPath.current = filePath;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadDoc = async () => {
      try {
        // For Tauri, we need to read the file as binary through the asset protocol
        // or convert the path. pdfjs can load from URL or ArrayBuffer.
        // Use fetch with Tauri's asset protocol or load directly.
        const response = await fetch(`https://asset.localhost/${encodeURIComponent(filePath)}`);
        if (!response.ok) {
          // Fallback: try loading directly (works in dev with CORS disabled)
          const pdfDoc = await pdfjsLib.getDocument(filePath).promise;
          if (!cancelled) {
            setDoc(pdfDoc);
            setLoading(false);
          }
          return;
        }
        const data = await response.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        if (!cancelled) {
          setDoc(pdfDoc);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          // Try direct file path as last resort
          try {
            const pdfDoc = await pdfjsLib.getDocument(filePath).promise;
            if (!cancelled) {
              setDoc(pdfDoc);
              setLoading(false);
            }
          } catch (err2) {
            setError(String(err2));
            setLoading(false);
          }
        }
      }
    };

    loadDoc();
    return () => { cancelled = true; };
  }, [filePath]);

  return { doc, loading, error };
}
