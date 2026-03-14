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

export const useSettingsStore = create<SettingsState>((set) => ({
  config: null,
  loading: true,

  loadConfig: async () => {
    set({ loading: true });
    try {
      const json = await invoke<string>('get_config_json');
      const config = JSON.parse(json) as AppConfig;
      set({ config, loading: false });
    } catch (e) {
      console.error('Failed to load config:', e);
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
