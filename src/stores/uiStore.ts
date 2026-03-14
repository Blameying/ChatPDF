import { create } from 'zustand';

type SidebarPanel = 'outline' | 'wordlist' | 'annotations' | null;

interface UIState {
  sidebarPanel: SidebarPanel;
  chatPanelOpen: boolean;
  zenMode: boolean;
  searchOpen: boolean;
  commandPaletteOpen: boolean;
  setSidebarPanel: (panel: SidebarPanel) => void;
  toggleChatPanel: () => void;
  setChatPanelOpen: (open: boolean) => void;
  toggleZenMode: () => void;
  setZenMode: (v: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (v: boolean) => void;
  setCommandPaletteOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarPanel: null,
  chatPanelOpen: false,
  zenMode: false,
  searchOpen: false,
  commandPaletteOpen: false,

  setSidebarPanel: (panel) => set(state => ({
    sidebarPanel: state.sidebarPanel === panel ? null : panel,
  })),
  toggleChatPanel: () => set(state => ({ chatPanelOpen: !state.chatPanelOpen })),
  setChatPanelOpen: (open) => set({ chatPanelOpen: open }),
  toggleZenMode: () => set(state => ({ zenMode: !state.zenMode })),
  setZenMode: (v) => set({ zenMode: v }),
  toggleSearch: () => set(state => ({ searchOpen: !state.searchOpen })),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
}));
