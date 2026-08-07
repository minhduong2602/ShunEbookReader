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
  pinned?: boolean;
  color?: string;
}

// Phase 4: Custom Theme
export interface CustomTheme {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  surface: string;
}

// Phase 2: Book metadata
export interface BookMetadata {
  rating: number;      // 0–5
  tags: string[];
  review: string;
}

export type BookShelf = 'reading' | 'completed' | 'dropped' | 'want';

export type ReaderTexture = 'none' | 'paper' | 'linen' | 'aged';
export type BookshelfLayout = 'grid' | 'list' | 'compact';

export interface ReadingStats {
  streak: number;
  lastReadDate: string; // YYYY-MM-DD
  totalMinutes: number;
  totalWordsRead: number;
}

export interface HomeSection {
  key: string;
  label: string;
  visible: boolean;
}

const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { key: 'stats', label: 'Thống kê đọc sách', visible: true },
  { key: 'promo', label: 'Banner khám phá', visible: true },
  { key: 'recent', label: 'Đọc gần đây', visible: true },
  { key: 'new', label: 'Sách mới cập nhật', visible: true },
];

interface AppState {
  token: string | null;
  folderId: string | null;
  clientId: string | null;
  fontSize: number;
  theme: string;
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

  // Phase 4: Customization
  customThemes: CustomTheme[];
  readerTexture: ReaderTexture;
  bookshelfLayout: BookshelfLayout;
  homeSections: HomeSection[];

  // Phase 2: Library
  bookCollections: Record<string, BookShelf>;
  bookMetadata: Record<string, BookMetadata>;

  // Phase 1: Reading Stats & Backup
  readingStats: ReadingStats;
  lineHeight: number;
  textIndent: boolean;

  setToken: (token: string | null) => void;
  setFolderId: (id: string) => void;
  setClientId: (id: string) => void;
  setFontSize: (size: number) => void;
  setTheme: (theme: string) => void;
  setFontFamily: (font: 'sans' | 'serif' | 'mono') => void;
  setUserName: (name: string) => void;
  updateReadHistory: (entry: Pick<ReadHistoryEntry, 'bookId' | 'bookName'> & Partial<ReadHistoryEntry>) => void;
  setCurrentBookChapters: (chapters: DriveFile[]) => void;
  setScrollPosition: (chapterId: string, position: number) => void;
  addHighlight: (chapterId: string, highlight: Highlight) => void;
  removeHighlight: (chapterId: string, highlightId: string) => void;
  addQuickNote: (note: QuickNote) => void;
  removeQuickNote: (noteId: string) => void;
  updateQuickNote: (noteId: string, updates: Partial<QuickNote>) => void;
  toggleBookCompleted: (bookId: string) => void;
  setBookCompleted: (bookId: string, completed: boolean) => void;
  toggleChapterCompleted: (chapterId: string) => void;
  setChapterCompleted: (chapterId: string, completed: boolean) => void;
  markAllChaptersCompleted: (bookId: string, chapterIds: string[], completed: boolean) => void;
  setSessionExpired: (expired: boolean) => void;
  loadSyncFromDrive: () => Promise<void>;
  triggerSyncToDrive: () => Promise<void>;
  logout: () => void;

  // Phase 4 actions
  saveCustomTheme: (theme: CustomTheme) => void;
  deleteCustomTheme: (themeId: string) => void;
  setReaderTexture: (texture: ReaderTexture) => void;
  setBookshelfLayout: (layout: BookshelfLayout) => void;
  toggleHomeSection: (key: string) => void;

  // Phase 2 actions
  setBookCollection: (bookId: string, shelf: BookShelf | null) => void;
  setBookMetadata: (bookId: string, updates: Partial<BookMetadata>) => void;

  // Phase 1 actions
  setLineHeight: (height: number) => void;
  setTextIndent: (indent: boolean) => void;
  recordReadingTime: (minutes: number) => void;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => boolean;
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

  // Phase 4 initial state
  customThemes: JSON.parse(localStorage.getItem('reader_custom_themes') || '[]'),
  readerTexture: (localStorage.getItem('reader_texture') as ReaderTexture) || 'none',
  bookshelfLayout: (localStorage.getItem('reader_bookshelf_layout') as BookshelfLayout) || 'grid',
  homeSections: JSON.parse(localStorage.getItem('reader_home_sections') || 'null') || DEFAULT_HOME_SECTIONS,

  // Phase 2 initial state
  bookCollections: JSON.parse(localStorage.getItem('reader_book_collections') || '{}'),
  bookMetadata: JSON.parse(localStorage.getItem('reader_book_metadata') || '{}'),

  // Phase 1 initial state
  readingStats: JSON.parse(localStorage.getItem('reader_reading_stats') || '{"streak":0,"lastReadDate":"","totalMinutes":0,"totalWordsRead":0}'),
  lineHeight: Number(localStorage.getItem('reader_line_height')) || 1.8,
  textIndent: localStorage.getItem('reader_text_indent') !== 'false',


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
  updateQuickNote: (noteId, updates) => {
    set((state) => {
      const newNotes = state.quickNotes.map(n => n.id === noteId ? { ...n, ...updates } : n);
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
        const mergedCollections = { ...get().bookCollections, ...(state.bookCollections || {}) };
        const mergedMetadata = { ...get().bookMetadata, ...(state.bookMetadata || {}) };
        
        localStorage.setItem('reader_scroll_positions', JSON.stringify(mergedScrolls));
        localStorage.setItem('reader_highlights', JSON.stringify(mergedHighlights));
        localStorage.setItem('reader_completed_books', JSON.stringify(mergedCompletedBooks));
        localStorage.setItem('reader_completed_chapters', JSON.stringify(mergedCompletedChapters));
        localStorage.setItem('reader_book_collections', JSON.stringify(mergedCollections));
        localStorage.setItem('reader_book_metadata', JSON.stringify(mergedMetadata));
        
        if (state.quickNotes) localStorage.setItem('reader_quick_notes', JSON.stringify(state.quickNotes));
        if (state.fontSize) localStorage.setItem('reader_font_size', state.fontSize);
        if (state.theme) localStorage.setItem('reader_theme', state.theme);
        if (state.fontFamily) localStorage.setItem('reader_font_family', state.fontFamily);
        if (state.userName) localStorage.setItem('reader_user_name', state.userName);
        if (state.readHistory) localStorage.setItem('reader_history', JSON.stringify(state.readHistory));
        if (state.customThemes) localStorage.setItem('reader_custom_themes', JSON.stringify(state.customThemes));
        if (state.readerTexture) localStorage.setItem('reader_texture', state.readerTexture);
        if (state.bookshelfLayout) localStorage.setItem('reader_bookshelf_layout', state.bookshelfLayout);
        if (state.homeSections) localStorage.setItem('reader_home_sections', JSON.stringify(state.homeSections));
        if (state.readingStats) localStorage.setItem('reader_reading_stats', JSON.stringify(state.readingStats));
        if (state.lineHeight) localStorage.setItem('reader_line_height', state.lineHeight.toString());
        if (state.textIndent !== undefined) localStorage.setItem('reader_text_indent', JSON.stringify(state.textIndent));

        set({ 
          scrollPositions: mergedScrolls, 
          highlights: mergedHighlights,
          completedBooks: mergedCompletedBooks,
          completedChapters: mergedCompletedChapters,
          bookCollections: mergedCollections,
          bookMetadata: mergedMetadata,
          ...(state.quickNotes ? { quickNotes: state.quickNotes } : {}),
          ...(state.fontSize ? { fontSize: Number(state.fontSize) } : {}),
          ...(state.theme ? { theme: state.theme } : {}),
          ...(state.fontFamily ? { fontFamily: state.fontFamily } : {}),
          ...(state.userName ? { userName: state.userName } : {}),
          ...(state.readHistory ? { readHistory: state.readHistory } : {}),
          ...(state.customThemes ? { customThemes: state.customThemes } : {}),
          ...(state.readerTexture ? { readerTexture: state.readerTexture } : {}),
          ...(state.bookshelfLayout ? { bookshelfLayout: state.bookshelfLayout } : {}),
          ...(state.homeSections ? { homeSections: state.homeSections } : {}),
          ...(state.readingStats ? { readingStats: state.readingStats } : {}),
          ...(state.lineHeight ? { lineHeight: Number(state.lineHeight) } : {}),
          ...(state.textIndent !== undefined ? { textIndent: Boolean(state.textIndent) } : {}),
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
      await saveSyncState(token, {
        scrollPositions: currentState.scrollPositions,
        highlights: currentState.highlights,
        quickNotes: currentState.quickNotes,
        completedBooks: currentState.completedBooks,
        completedChapters: currentState.completedChapters,
        fontSize: currentState.fontSize,
        theme: currentState.theme,
        fontFamily: currentState.fontFamily,
        userName: currentState.userName,
        readHistory: currentState.readHistory,
        customThemes: currentState.customThemes,
        readerTexture: currentState.readerTexture,
        bookshelfLayout: currentState.bookshelfLayout,
        homeSections: currentState.homeSections,
        bookCollections: currentState.bookCollections,
        bookMetadata: currentState.bookMetadata,
        readingStats: currentState.readingStats,
        lineHeight: currentState.lineHeight,
        textIndent: currentState.textIndent,
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
  },

  // ─── Phase 4 Actions ────────────────────────────────────────────────────
  saveCustomTheme: (theme) => {
    set((state) => {
      const existing = state.customThemes.findIndex(t => t.id === theme.id);
      const newThemes = existing >= 0
        ? state.customThemes.map(t => t.id === theme.id ? theme : t)
        : [...state.customThemes, theme];
      localStorage.setItem('reader_custom_themes', JSON.stringify(newThemes));
      return { customThemes: newThemes };
    });
  },
  deleteCustomTheme: (themeId) => {
    set((state) => {
      const newThemes = state.customThemes.filter(t => t.id !== themeId);
      localStorage.setItem('reader_custom_themes', JSON.stringify(newThemes));
      return { customThemes: newThemes };
    });
  },
  setReaderTexture: (texture) => {
    localStorage.setItem('reader_texture', texture);
    set({ readerTexture: texture });
  },
  setBookshelfLayout: (layout) => {
    localStorage.setItem('reader_bookshelf_layout', layout);
    set({ bookshelfLayout: layout });
  },
  toggleHomeSection: (key) => {
    set((state) => {
      const newSections = state.homeSections.map(s =>
        s.key === key ? { ...s, visible: !s.visible } : s
      );
      localStorage.setItem('reader_home_sections', JSON.stringify(newSections));
      return { homeSections: newSections };
    });
  },

  // ─── Phase 2 Actions ────────────────────────────────────────────────────
  setBookCollection: (bookId, shelf) => {
    set((state) => {
      const newCollections = { ...state.bookCollections };
      if (shelf === null) {
        delete newCollections[bookId];
      } else {
        newCollections[bookId] = shelf;
      }
      localStorage.setItem('reader_book_collections', JSON.stringify(newCollections));
      return { bookCollections: newCollections };
    });
  },
  setBookMetadata: (bookId, updates) => {
    set((state) => {
      const current = state.bookMetadata[bookId] || { rating: 0, tags: [], review: '' };
      const newMeta = { ...state.bookMetadata, [bookId]: { ...current, ...updates } };
      localStorage.setItem('reader_book_metadata', JSON.stringify(newMeta));
      return { bookMetadata: newMeta };
    });
  },

  // ─── Phase 1 Actions ────────────────────────────────────────────────────
  setLineHeight: (height) => {
    localStorage.setItem('reader_line_height', height.toString());
    set({ lineHeight: height });
  },
  setTextIndent: (indent) => {
    localStorage.setItem('reader_text_indent', JSON.stringify(indent));
    set({ textIndent: indent });
  },
  recordReadingTime: (minutes) => {
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const stats = { ...state.readingStats };
      
      stats.totalMinutes = (stats.totalMinutes || 0) + minutes;
      
      if (stats.lastReadDate === today) {
        // Already logged reading today
      } else {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (stats.lastReadDate === yesterday) {
          stats.streak = (stats.streak || 0) + 1;
        } else {
          stats.streak = 1;
        }
        stats.lastReadDate = today;
      }

      localStorage.setItem('reader_reading_stats', JSON.stringify(stats));
      return { readingStats: stats };
    });
  },
  exportBackupJSON: () => {
    const state = get();
    const backupData = {
      version: 1,
      timestamp: Date.now(),
      userName: state.userName,
      fontSize: state.fontSize,
      theme: state.theme,
      fontFamily: state.fontFamily,
      lineHeight: state.lineHeight,
      textIndent: state.textIndent,
      readerTexture: state.readerTexture,
      bookshelfLayout: state.bookshelfLayout,
      homeSections: state.homeSections,
      readHistory: state.readHistory,
      scrollPositions: state.scrollPositions,
      highlights: state.highlights,
      quickNotes: state.quickNotes,
      completedBooks: state.completedBooks,
      completedChapters: state.completedChapters,
      customThemes: state.customThemes,
      bookCollections: state.bookCollections,
      bookMetadata: state.bookMetadata,
      readingStats: state.readingStats,
    };
    return JSON.stringify(backupData, null, 2);
  },
  importBackupJSON: (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') return false;

      if (data.readHistory) localStorage.setItem('reader_history', JSON.stringify(data.readHistory));
      if (data.scrollPositions) localStorage.setItem('reader_scroll_positions', JSON.stringify(data.scrollPositions));
      if (data.highlights) localStorage.setItem('reader_highlights', JSON.stringify(data.highlights));
      if (data.quickNotes) localStorage.setItem('reader_quick_notes', JSON.stringify(data.quickNotes));
      if (data.completedBooks) localStorage.setItem('reader_completed_books', JSON.stringify(data.completedBooks));
      if (data.completedChapters) localStorage.setItem('reader_completed_chapters', JSON.stringify(data.completedChapters));
      if (data.customThemes) localStorage.setItem('reader_custom_themes', JSON.stringify(data.customThemes));
      if (data.readerTexture) localStorage.setItem('reader_texture', data.readerTexture);
      if (data.bookshelfLayout) localStorage.setItem('reader_bookshelf_layout', data.bookshelfLayout);
      if (data.homeSections) localStorage.setItem('reader_home_sections', JSON.stringify(data.homeSections));
      if (data.bookCollections) localStorage.setItem('reader_book_collections', JSON.stringify(data.bookCollections));
      if (data.bookMetadata) localStorage.setItem('reader_book_metadata', JSON.stringify(data.bookMetadata));
      if (data.readingStats) localStorage.setItem('reader_reading_stats', JSON.stringify(data.readingStats));
      if (data.fontSize) localStorage.setItem('reader_font_size', data.fontSize.toString());
      if (data.theme) localStorage.setItem('reader_theme', data.theme);
      if (data.fontFamily) localStorage.setItem('reader_font_family', data.fontFamily);
      if (data.lineHeight) localStorage.setItem('reader_line_height', data.lineHeight.toString());
      if (data.textIndent !== undefined) localStorage.setItem('reader_text_indent', JSON.stringify(data.textIndent));
      if (data.userName) localStorage.setItem('reader_user_name', data.userName);

      set({
        ...(data.readHistory ? { readHistory: data.readHistory } : {}),
        ...(data.scrollPositions ? { scrollPositions: data.scrollPositions } : {}),
        ...(data.highlights ? { highlights: data.highlights } : {}),
        ...(data.quickNotes ? { quickNotes: data.quickNotes } : {}),
        ...(data.completedBooks ? { completedBooks: data.completedBooks } : {}),
        ...(data.completedChapters ? { completedChapters: data.completedChapters } : {}),
        ...(data.customThemes ? { customThemes: data.customThemes } : {}),
        ...(data.readerTexture ? { readerTexture: data.readerTexture } : {}),
        ...(data.bookshelfLayout ? { bookshelfLayout: data.bookshelfLayout } : {}),
        ...(data.homeSections ? { homeSections: data.homeSections } : {}),
        ...(data.bookCollections ? { bookCollections: data.bookCollections } : {}),
        ...(data.bookMetadata ? { bookMetadata: data.bookMetadata } : {}),
        ...(data.readingStats ? { readingStats: data.readingStats } : {}),
        ...(data.fontSize ? { fontSize: Number(data.fontSize) } : {}),
        ...(data.theme ? { theme: data.theme } : {}),
        ...(data.fontFamily ? { fontFamily: data.fontFamily } : {}),
        ...(data.lineHeight ? { lineHeight: Number(data.lineHeight) } : {}),
        ...(data.textIndent !== undefined ? { textIndent: Boolean(data.textIndent) } : {}),
        ...(data.userName ? { userName: data.userName } : {}),
      });

      get().triggerSyncToDrive().catch(console.error);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },
}));
