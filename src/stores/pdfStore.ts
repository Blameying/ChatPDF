import { create } from 'zustand';

interface PdfViewState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  scrollY: number;
}

interface PdfState {
  views: Record<string, PdfViewState>;
  getView: (hash: string) => PdfViewState;
  setPage: (hash: string, page: number) => void;
  setTotalPages: (hash: string, total: number) => void;
  setZoom: (hash: string, zoom: number) => void;
  setScrollY: (hash: string, y: number) => void;
  initView: (hash: string, state?: Partial<PdfViewState>) => void;
}

const defaultView: PdfViewState = { currentPage: 1, totalPages: 0, zoom: 1.0, scrollY: 0 };

export const usePdfStore = create<PdfState>((set, get) => ({
  views: {},

  getView: (hash) => get().views[hash] ?? defaultView,

  setPage: (hash, page) => set(state => ({
    views: { ...state.views, [hash]: { ...(state.views[hash] ?? defaultView), currentPage: page } },
  })),

  setTotalPages: (hash, total) => set(state => ({
    views: { ...state.views, [hash]: { ...(state.views[hash] ?? defaultView), totalPages: total } },
  })),

  setZoom: (hash, zoom) => set(state => ({
    views: { ...state.views, [hash]: { ...(state.views[hash] ?? defaultView), zoom } },
  })),

  setScrollY: (hash, y) => set(state => ({
    views: { ...state.views, [hash]: { ...(state.views[hash] ?? defaultView), scrollY: y } },
  })),

  initView: (hash, initial) => set(state => ({
    views: { ...state.views, [hash]: { ...defaultView, ...initial } },
  })),
}));
