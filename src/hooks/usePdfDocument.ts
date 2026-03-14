import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { invoke } from '@tauri-apps/api/core';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

const docCache = new Map<string, PDFDocumentProxy>();

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function usePdfDocument(filePath: string | null) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (!filePath) return;

    const cached = docCache.get(filePath);
    if (cached) {
      setDoc(cached);
      setLoading(false);
      prevPath.current = filePath;
      return;
    }

    if (filePath === prevPath.current) return;
    prevPath.current = filePath;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadDoc = async () => {
      try {
        const b64 = await invoke<string>('read_file_base64', { path: filePath });
        const data = base64ToUint8Array(b64);
        const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        if (!cancelled) {
          docCache.set(filePath, pdfDoc);
          setDoc(pdfDoc);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      }
    };

    loadDoc();
    return () => { cancelled = true; };
  }, [filePath]);

  return { doc, loading, error };
}
