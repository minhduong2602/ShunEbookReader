import { create } from 'zustand';
import { DriveFile } from './lib/drive';

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
  currentBookChapters: DriveFile[];
  scrollPositions: Record<string, number>;
  highlights: Record<string, Highlight[]>;
  setToken: (token: string | null) => void;
  setFolderId: (id: string) => void;
  setClientId: (id: string) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'sepia') => void;
  setCurrentBookChapters: (chapters: DriveFile[]) => void;
  setScrollPosition: (chapterId: string, position: number) => void;
  addHighlight: (chapterId: string, highlight: Highlight) => void;
  removeHighlight: (chapterId: string, highlightId: string) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  token: localStorage.getItem('drive_token'),
  folderId: localStorage.getItem('drive_folder_id'),
  clientId: localStorage.getItem('drive_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  fontSize: Number(localStorage.getItem('reader_font_size')) || 18,
  theme: (localStorage.getItem('reader_theme') as any) || 'light',
  currentBookChapters: [],
  scrollPositions: JSON.parse(localStorage.getItem('reader_scroll_positions') || '{}'),
  highlights: JSON.parse(localStorage.getItem('reader_highlights') || '{}'),

  setToken: (token) => {
    if (token) localStorage.setItem('drive_token', token);
    else localStorage.removeItem('drive_token');
    set({ token });
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
  logout: () => {
    localStorage.removeItem('drive_token');
    set({ token: null });
  }
}));
