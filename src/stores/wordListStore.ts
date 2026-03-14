import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface DifficultWord {
  id: number;
  word: string;
  translation: string;
  context: string | null;
  source_lang: string;
  target_lang: string;
  created_at: string;
}

interface WordListState {
  words: DifficultWord[];
  wordSet: Set<string>;
  loading: boolean;
  loadWords: () => Promise<void>;
  addWord: (word: string, translation: string, context?: string) => Promise<void>;
  removeWord: (word: string) => Promise<void>;
  isKnownWord: (word: string) => boolean;
  initListener: () => Promise<() => void>;
}

export const useWordListStore = create<WordListState>((set, get) => ({
  words: [],
  wordSet: new Set(),
  loading: false,

  loadWords: async () => {
    set({ loading: true });
    try {
      const words = await invoke<DifficultWord[]>('list_words');
      const wordSet = new Set(words.map(w => w.word.toLowerCase()));
      set({ words, wordSet, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addWord: async (word, translation, context) => {
    await invoke('add_word', { word, translation, context: context ?? null });
    await get().loadWords();
  },

  removeWord: async (word) => {
    await invoke('remove_word', { word });
    await get().loadWords();
  },

  isKnownWord: (word) => get().wordSet.has(word.toLowerCase()),

  initListener: async () => {
    const unlisten = await listen('words:changed', () => {
      get().loadWords();
    });
    return unlisten;
  },
}));
