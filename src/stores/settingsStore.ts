import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface AppConfig {
  general: {
    theme: 'light' | 'dark' | 'sepia';
    language: string;
    hover_delay_ms: number;
    zen_mode: boolean;
  };
  translation: {
    provider: 'llm' | 'deepl' | 'google';
    target_lang: string;
    source_lang: string;
    deepl: {
      api_key: string;
      api_url: string;
    };
  };
  llm: {
    base_url: string;
    api_key: string;
    model: string;
    max_context_tokens: number;
    system_prompt: string;
  };
  keyboard: {
    scroll_down: string;
    scroll_up: string;
    next_page: string;
    prev_page: string;
    search: string;
    zen_mode: string;
  };
  export: {
    markdown_include_page_numbers: boolean;
    anki_field_separator: string;
  };
}

interface SettingsState {
  config: AppConfig | null;
  loading: boolean;
  loadConfig: () => Promise<void>;
  updateConfig: (section: string, key: string, value: string) => Promise<void>;
  initListener: () => Promise<() => void>;
}

const defaultConfig: AppConfig = {
  general: { theme: 'light', language: 'zh', hover_delay_ms: 2000, zen_mode: false },
  translation: {
    provider: 'llm', target_lang: 'zh', source_lang: 'en',
    deepl: { api_key: '', api_url: 'https://api-free.deepl.com/v2' },
  },
  llm: { base_url: 'https://api.openai.com/v1', api_key: '', model: 'gpt-4o', max_context_tokens: 8000, system_prompt: '' },
  keyboard: { scroll_down: 'j', scroll_up: 'k', next_page: 'l', prev_page: 'h', search: '/', zen_mode: 'F11' },
  export: { markdown_include_page_numbers: true, anki_field_separator: '\t' },
};

export const useSettingsStore = create<SettingsState>((set) => ({
  config: defaultConfig,
  loading: false,

  loadConfig: async () => {
    set({ loading: true });
    try {
      await invoke<string>('get_config');
      set({ loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateConfig: async (section, key, value) => {
    await invoke('update_config', { section, key, value });
  },

  initListener: async () => {
    const unlisten = await listen<string>('config:changed', (event) => {
      try {
        const config = JSON.parse(event.payload) as AppConfig;
        set({ config });
      } catch {
        // ignore parse errors
      }
    });
    return unlisten;
  },
}));
