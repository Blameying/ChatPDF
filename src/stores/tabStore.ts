import { create } from 'zustand';

export interface Tab {
  id: string;
  path: string;
  hash: string;
  name: string;
  active: boolean;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (tab: Omit<Tab, 'active'>) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (tab) => {
    const existing = get().tabs.find(t => t.hash === tab.hash);
    if (existing) {
      set(state => ({
        tabs: state.tabs.map(t => ({ ...t, active: t.id === existing.id })),
        activeTabId: existing.id,
      }));
      return;
    }
    set(state => ({
      tabs: [...state.tabs.map(t => ({ ...t, active: false })), { ...tab, active: true }],
      activeTabId: tab.id,
    }));
  },

  removeTab: (id) => {
    set(state => {
      const newTabs = state.tabs.filter(t => t.id !== id);
      let newActiveId = state.activeTabId;
      if (state.activeTabId === id) {
        const idx = state.tabs.findIndex(t => t.id === id);
        const nextTab = newTabs[Math.min(idx, newTabs.length - 1)];
        newActiveId = nextTab?.id ?? null;
      }
      return {
        tabs: newTabs.map(t => ({ ...t, active: t.id === newActiveId })),
        activeTabId: newActiveId,
      };
    });
  },

  setActiveTab: (id) => {
    set(state => ({
      tabs: state.tabs.map(t => ({ ...t, active: t.id === id })),
      activeTabId: id,
    }));
  },
}));
