import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface Annotation {
  id: number;
  document_hash: string;
  page: number;
  type: 'highlight' | 'note' | 'bookmark';
  content: string | null;
  color: string;
  position_data: string;
  created_at: string;
}

export function useAnnotations(documentHash: string | null) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const load = useCallback(async () => {
    if (!documentHash) return;
    try {
      const result = await invoke<Annotation[]>('list_annotations', { documentHash });
      setAnnotations(result);
    } catch {
      // ignore
    }
  }, [documentHash]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen('annotations:changed', () => load()).then(u => { unlisten = u; });
    return () => { unlisten?.(); };
  }, [load]);

  const addAnnotation = useCallback(async (
    page: number,
    type: string,
    content: string | null,
    positionData: string,
    color?: string,
  ) => {
    if (!documentHash) return;
    await invoke('add_annotation', {
      documentHash, page, type, content, color: color ?? null, positionData,
    });
    await load();
  }, [documentHash, load]);

  const removeAnnotation = useCallback(async (id: number) => {
    await invoke('remove_annotation', { id });
    await load();
  }, [load]);

  return { annotations, addAnnotation, removeAnnotation };
}
