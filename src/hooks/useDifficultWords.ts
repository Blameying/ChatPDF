import { useEffect } from 'react';
import { useWordListStore } from '../stores/wordListStore';

export function useDifficultWords() {
  const { words, wordSet, loading, loadWords, addWord, removeWord, isKnownWord, initListener } = useWordListStore();

  useEffect(() => {
    loadWords();
    let unlisten: (() => void) | undefined;
    initListener().then(u => { unlisten = u; });
    return () => { unlisten?.(); };
  }, []);

  return { words, wordSet, loading, addWord, removeWord, isKnownWord };
}
