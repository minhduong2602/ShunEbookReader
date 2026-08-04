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

export interface ReadHistoryEntry {
  bookId: string;
  bookName: string;
  lastAccessed: number;
  lastChapterId?: string;
  lastChapterName?: string;
}

export interface QuickNote {
  id: string;
  text: string;
  timestamp: number;
}

interface AppState {
  token: string | null;
  folderId: string | null;
  clientId: string | null;
  fontSize: number;
  theme: 'light' | 'dark' | 'sepia';
  fontFamily: 'sans' | 'serif' | 'mono';
  userName: string;
  readHistory: ReadHistoryEntry[];
  currentBookChapters: DriveFile[];
  scrollPositions: Record<string, number>;
  highlights: Record<string, Highlight[]>;
  quickNotes: QuickNote[];
  completedBooks: Record<string, boolean>;
  completedChapters: Record<string, boolean>;
  isSessionExpired: boolean;
  isSyncing: boolean;
  lastSyncedAt: number;
  setToken: (token: string | null) => void;
  setFolderId: (id: string) => void;
  setClientId: (id: string) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'sepia') => void;
  setFontFamily: (font: 'sans' | 'serif' | 'mono') => void;
  setUserName: (name: string) => void;
  updateReadHistory: (entry: Pick<ReadHistoryEntry, 'bookId' | 'bookName'> & Partial<ReadHistoryEntry>) => void;
  setCurrentBookChapters: (chapters: DriveFile[]) => void;
  setScrollPosition: (chapterId: string, position: number) => void;
  addHighlight: (chapterId: string, highlight: Highlight) => void;
  removeHighlight: (chapterId: string, highlightId: string) => void;
  addQuickNote: (note: QuickNote) => void;
  removeQuickNote: (noteId: string) => void;
  toggleBookCompleted: (bookId: string) => void;
  setBookCompleted: (bookId: string, completed: boolean) => void;
  toggleChapterCompleted: (chapterId: string) => void;
  setChapterCompleted: (chapterId: string, completed: boolean) => void;
  markAllChaptersCompleted: (bookId: string, chapterIds: string[], completed: boolean) => void;
  setSessionExpired: (expired: boolean) => void;
  loadSyncFromDrive: () => Promise<void>;
  triggerSyncToDrive: () => Promise<void>;
  logout: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  token: localStorage.getItem('drive_token') || null,
  folderId: localStorage.getItem('drive_folder_id') || 'r2_bookshelf',
  clientId: '',
  fontSize: Number(localStorage.getItem('reader_font_size')) || 18,
  theme: (localStorage.getItem('reader_theme') as any) || 'light',
  fontFamily: (localStorage.getItem('reader_font_family') as any) || 'sans',
  userName: localStorage.getItem('reader_user_name') || 'Reader',
  readHistory: JSON.parse(localStorage.getItem('reader_history') || '[]'),
  currentBookChapters: [],
  scrollPositions: JSON.parse(localStorage.getItem('reader_scroll_positions') || '{}'),
  highlights: JSON.parse(localStorage.getItem('reader_highlights') || '{}'),
  quickNotes: JSON.parse(localStorage.getItem('reader_quick_notes') || '[]'),
  completedBooks: JSON.parse(localStorage.getItem('reader_completed_books') || '{}'),
  completedChapters: JSON.parse(localStorage.getItem('reader_completed_chapters') || '{}'),
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
  setUserName: (userName) => {
    localStorage.setItem('reader_user_name', userName);
    set({ userName });
  },
  updateReadHistory: (entry) => {
    set((state) => {
      let history = [...state.readHistory];
      const index = history.findIndex(h => h.bookId === entry.bookId);
      if (index >= 0) {
        history[index] = { ...history[index], ...entry, lastAccessed: Date.now() };
      } else {
        history.unshift({ ...entry, lastAccessed: Date.now() } as ReadHistoryEntry);
      }
      history.sort((a, b) => b.lastAccessed - a.lastAccessed);
      localStorage.setItem('reader_history', JSON.stringify(history));
      return { readHistory: history };
    });
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
  addQuickNote: (note) => {
    set((state) => {
      const newNotes = [...state.quickNotes, note];
      localStorage.setItem('reader_quick_notes', JSON.stringify(newNotes));
      return { quickNotes: newNotes };
    });
  },
  removeQuickNote: (noteId) => {
    set((state) => {
      const newNotes = state.quickNotes.filter(n => n.id !== noteId);
      localStorage.setItem('reader_quick_notes', JSON.stringify(newNotes));
      return { quickNotes: newNotes };
    });
  },
  toggleBookCompleted: (bookId) => {
    set((state) => {
      const isComp = !state.completedBooks[bookId];
      const newBooks = { ...state.completedBooks, [bookId]: isComp };
      localStorage.setItem('reader_completed_books', JSON.stringify(newBooks));
      return { completedBooks: newBooks };
    });
  },
  setBookCompleted: (bookId, completed) => {
    set((state) => {
      const newBooks = { ...state.completedBooks, [bookId]: completed };
      localStorage.setItem('reader_completed_books', JSON.stringify(newBooks));
      return { completedBooks: newBooks };
    });
  },
  toggleChapterCompleted: (chapterId) => {
    set((state) => {
      const isComp = !state.completedChapters[chapterId];
      const newChaps = { ...state.completedChapters, [chapterId]: isComp };
      localStorage.setItem('reader_completed_chapters', JSON.stringify(newChaps));
      return { completedChapters: newChaps };
    });
  },
  setChapterCompleted: (chapterId, completed) => {
    set((state) => {
      const newChaps = { ...state.completedChapters, [chapterId]: completed };
      localStorage.setItem('reader_completed_chapters', JSON.stringify(newChaps));
      return { completedChapters: newChaps };
    });
  },
  markAllChaptersCompleted: (bookId, chapterIds, completed) => {
    set((state) => {
      const newChaps = { ...state.completedChapters };
      chapterIds.forEach(id => {
        newChaps[id] = completed;
      });
      const newBooks = { ...state.completedBooks, [bookId]: completed };
      localStorage.setItem('reader_completed_chapters', JSON.stringify(newChaps));
      localStorage.setItem('reader_completed_books', JSON.stringify(newBooks));
      return { completedChapters: newChaps, completedBooks: newBooks };
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
        const mergedScrolls = { ...get().scrollPositions, ...(state.scrollPositions || {}) };
        const mergedHighlights = { ...get().highlights, ...(state.highlights || {}) };
        const mergedCompletedBooks = { ...get().completedBooks, ...(state.completedBooks || {}) };
        const mergedCompletedChapters = { ...get().completedChapters, ...(state.completedChapters || {}) };
        
        localStorage.setItem('reader_scroll_positions', JSON.stringify(mergedScrolls));
        localStorage.setItem('reader_highlights', JSON.stringify(mergedHighlights));
        localStorage.setItem('reader_completed_books', JSON.stringify(mergedCompletedBooks));
        localStorage.setItem('reader_completed_chapters', JSON.stringify(mergedCompletedChapters));
        if (state.quickNotes) {
          localStorage.setItem('reader_quick_notes', JSON.stringify(state.quickNotes));
        }
        
        // Settings sync
        if (state.fontSize) localStorage.setItem('reader_font_size', state.fontSize);
        if (state.theme) localStorage.setItem('reader_theme', state.theme);
        if (state.fontFamily) localStorage.setItem('reader_font_family', state.fontFamily);
        if (state.userName) localStorage.setItem('reader_user_name', state.userName);
        if (state.readHistory) localStorage.setItem('reader_history', JSON.stringify(state.readHistory));
        
        set({ 
          scrollPositions: mergedScrolls, 
          highlights: mergedHighlights,
          completedBooks: mergedCompletedBooks,
          completedChapters: mergedCompletedChapters,
          ...(state.quickNotes ? { quickNotes: state.quickNotes } : {}),
          ...(state.fontSize ? { fontSize: Number(state.fontSize) } : {}),
          ...(state.theme ? { theme: state.theme } : {}),
          ...(state.fontFamily ? { fontFamily: state.fontFamily } : {}),
          ...(state.userName ? { userName: state.userName } : {}),
          ...(state.readHistory ? { readHistory: state.readHistory } : {}),
          lastSyncedAt: Date.now()
        });
      }
    } finally {
      set({ isSyncing: false });
    }
  },
  triggerSyncToDrive: async () => {
    const currentState = get();
    const { token } = currentState;
    if (!token) return;
    try {
      const cloudState = await getSyncState(token);
      let mergedQuickNotes = [...currentState.quickNotes];
      let mergedHighlights = { ...currentState.highlights };
      let mergedCompletedBooks = { ...currentState.completedBooks };
      let mergedCompletedChapters = { ...currentState.completedChapters };
      let mergedScrollPositions = { ...currentState.scrollPositions };

      if (cloudState) {
        if (cloudState.quickNotes) {
          const localIds = new Set(mergedQuickNotes.map(n => n.id));
          const missingCloudNotes = cloudState.quickNotes.filter((n: any) => !localIds.has(n.id));
          if (missingCloudNotes.length > 0) {
            mergedQuickNotes = [...mergedQuickNotes, ...missingCloudNotes].sort((a, b) => a.timestamp - b.timestamp);
            localStorage.setItem('reader_quick_notes', JSON.stringify(mergedQuickNotes));
            set({ quickNotes: mergedQuickNotes });
          }
        }
        
        if (cloudState.highlights) {
          mergedHighlights = { ...cloudState.highlights, ...mergedHighlights };
        }
        if (cloudState.completedBooks) {
          mergedCompletedBooks = { ...cloudState.completedBooks, ...mergedCompletedBooks };
        }
        if (cloudState.completedChapters) {
          mergedCompletedChapters = { ...cloudState.completedChapters, ...mergedCompletedChapters };
        }
        if (cloudState.scrollPositions) {
          mergedScrollPositions = { ...cloudState.scrollPositions, ...mergedScrollPositions };
        }
      }

      await saveSyncState(token, {
        scrollPositions: mergedScrollPositions,
        highlights: mergedHighlights,
        quickNotes: mergedQuickNotes,
        completedBooks: mergedCompletedBooks,
        completedChapters: mergedCompletedChapters,
        fontSize: currentState.fontSize,
        theme: currentState.theme,
        fontFamily: currentState.fontFamily,
        userName: currentState.userName,
        readHistory: currentState.readHistory,
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
