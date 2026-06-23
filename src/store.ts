import { create } from 'zustand';
import { DriveFile, getSyncState, saveSyncState } from './lib/drive';

export interface Highlight {
  id: string;
  text: string;
  note?: string;
  color: string;
  timestamp: number;
  chapterName: string;
}

interface AppState {
  token: string | null;
  folderId: string | null;
  clientId: string | null;
  fontSize: number;
  theme: 'light' | 'dark' | 'sepia';
  fontFamily: 'sans' | 'serif' | 'mono';
  currentBookChapters: DriveFile[];
  scrollPositions: Record<string, number>;
  highlights: Record<string, Highlight[]>;
  isSessionExpired: boolean;
  isSyncing: boolean;
  lastSyncedAt: number;
  setToken: (token: string | null) => void;
  setFolderId: (id: string) => void;
  setClientId: (id: string) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'sepia') => void;
  setFontFamily: (font: 'sans' | 'serif' | 'mono') => void;
  setCurrentBookChapters: (chapters: DriveFile[]) => void;
  setScrollPosition: (chapterId: string, position: number) => void;
  addHighlight: (chapterId: string, highlight: Highlight) => void;
  removeHighlight: (chapterId: string, highlightId: string) => void;
  setSessionExpired: (expired: boolean) => void;
  loadSyncFromDrive: () => Promise<void>;
  triggerSyncToDrive: () => Promise<void>;
  logout: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  token: localStorage.getItem('drive_token'),
  folderId: localStorage.getItem('drive_folder_id') || import.meta.env.VITE_DRIVE_FOLDER_ID || null,
  clientId: localStorage.getItem('drive_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  fontSize: Number(localStorage.getItem('reader_font_size')) || 18,
  theme: (localStorage.getItem('reader_theme') as any) || 'light',
  fontFamily: (localStorage.getItem('reader_font_family') as any) || 'sans',
  currentBookChapters: [],
  scrollPositions: JSON.parse(localStorage.getItem('reader_scroll_positions') || '{}'),
  highlights: JSON.parse(localStorage.getItem('reader_highlights') || '{}'),
  isSessionExpired: false,
  isSyncing: false,
  lastSyncedAt: 0,

  setToken: (token) => {
    if (token) localStorage.setItem('drive_token', token);
    else localStorage.removeItem('drive_token');
    set({ token, isSessionExpired: false });
  },
  setFolderId: (id) => {
    localStorage.setItem('drive_folder_id', id);
    set({ folderId: id });
  },
  setClientId: (id) => {
    localStorage.setItem('drive_client_id', id);
    set({ clientId: id });
  },
  setFontSize: (size) => {
    localStorage.setItem('reader_font_size', size.toString());
    set({ fontSize: size });
  },
  setTheme: (theme) => {
    localStorage.setItem('reader_theme', theme);
    set({ theme });
  },
  setFontFamily: (fontFamily) => {
    localStorage.setItem('reader_font_family', fontFamily);
    set({ fontFamily });
  },
  setCurrentBookChapters: (chapters) => {
    set({ currentBookChapters: chapters });
  },
  setScrollPosition: (chapterId, position) => {
    set((state) => {
      const newPositions = { ...state.scrollPositions, [chapterId]: position };
      localStorage.setItem('reader_scroll_positions', JSON.stringify(newPositions));
      return { scrollPositions: newPositions };
    });
  },
  addHighlight: (chapterId, highlight) => {
    set((state) => {
      const chapterHighlights = state.highlights[chapterId] || [];
      const newHighlights = { ...state.highlights, [chapterId]: [...chapterHighlights, highlight] };
      localStorage.setItem('reader_highlights', JSON.stringify(newHighlights));
      return { highlights: newHighlights };
    });
  },
  removeHighlight: (chapterId, highlightId) => {
    set((state) => {
      const chapterHighlights = state.highlights[chapterId] || [];
      const newHighlights = { ...state.highlights, [chapterId]: chapterHighlights.filter(h => h.id !== highlightId) };
      localStorage.setItem('reader_highlights', JSON.stringify(newHighlights));
      return { highlights: newHighlights };
    });
  },
  setSessionExpired: (expired) => {
    set({ isSessionExpired: expired });
  },
  loadSyncFromDrive: async () => {
    const { token } = get();
    if (!token) return;
    
    set({ isSyncing: true });
    try {
      const state = await getSyncState(token);
      if (state) {
        // Merge cloud state over local state intelligently based on lastSynced timestamp if we tracked per-item,
        // or just accept cloud as truth. For simplicity, Cloud state wins on load, but we preserve local keys that aren't in cloud.
        const mergedScrolls = { ...get().scrollPositions, ...(state.scrollPositions || {}) };
        const mergedHighlights = { ...get().highlights, ...(state.highlights || {}) };
        
        localStorage.setItem('reader_scroll_positions', JSON.stringify(mergedScrolls));
        localStorage.setItem('reader_highlights', JSON.stringify(mergedHighlights));
        
        // Settings sync
        if (state.fontSize) localStorage.setItem('reader_font_size', state.fontSize);
        if (state.theme) localStorage.setItem('reader_theme', state.theme);
        if (state.fontFamily) localStorage.setItem('reader_font_family', state.fontFamily);
        
        set({ 
          scrollPositions: mergedScrolls, 
          highlights: mergedHighlights,
          ...(state.fontSize ? { fontSize: Number(state.fontSize) } : {}),
          ...(state.theme ? { theme: state.theme } : {}),
          ...(state.fontFamily ? { fontFamily: state.fontFamily } : {}),
          lastSyncedAt: Date.now()
        });
      }
    } finally {
      set({ isSyncing: false });
    }
  },
  triggerSyncToDrive: async () => {
    const { token, scrollPositions, highlights, fontSize, theme, fontFamily } = get();
    if (!token) return;
    try {
      await saveSyncState(token, {
        scrollPositions,
        highlights,
        fontSize,
        theme,
        fontFamily,
        timestamp: Date.now()
      });
      set({ lastSyncedAt: Date.now() });
    } catch (err) {
      console.error('Auto sync failed', err);
    }
  },
  logout: () => {
    localStorage.removeItem('drive_token');
    set({ token: null, isSessionExpired: false });
  }
}));
