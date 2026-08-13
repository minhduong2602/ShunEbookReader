import { useState, useEffect, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Book, LogOut, Loader2, Folder as FolderIcon, Download, Clock, Settings, 
  FileText, List, Upload, MessageSquare, CheckCircle2, Circle, ArrowUpDown, 
  LayoutGrid, Search, Home, ArrowUpRight, Menu, X as XIcon, ChevronRight, 
  ChevronLeft, Sparkles, Heart, Library, Bookmark, ShoppingBag, StickyNote,
  AlignJustify, SlidersHorizontal
} from 'lucide-react';
import { useStore } from '../store';
import { getFolders, DriveFile } from '../lib/drive';
import UploadModal from '../components/UploadModal';
import NotesTab from '../components/NotesTab';
import BookCoverCard from '../components/BookCoverCard';
import DesktopChatPanel from '../components/DesktopChatPanel';
import HomeSectionManager from '../components/HomeSectionManager';
import FilterBar, { SortOption, ShelfFilter } from '../components/FilterBar';
import ReadingStatsWidget from '../components/ReadingStatsWidget';

export default function Bookshelf() {
  const navigate = useNavigate();
  const { 
    token, folderId, logout, loadSyncFromDrive, readHistory, userName, 
    completedBooks, toggleBookCompleted, triggerSyncToDrive, quickNotes,
    bookshelfLayout, setBookshelfLayout, homeSections,
    bookCollections, setBookCollection, bookMetadata,
  } = useStore();

  const [books, setBooks] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'home' | 'library' | 'notes'>(
    (localStorage.getItem('reader_active_tab') as any) || 'home'
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (localStorage.getItem('reader_sort_by') as any) || 'newest'
  );
  const [shelfFilter, setShelfFilter] = useState<ShelfFilter>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showHomeSectionManager, setShowHomeSectionManager] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpenMobile, setIsChatOpenMobile] = useState(false);
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  useEffect(() => {
    loadBooks();
    loadSyncFromDrive().catch(console.error);
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError('');
      const folders = await getFolders(token, folderId);
      setBooks(folders);
    } catch (err: any) {
      setError('Không thể tải tủ sách. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/', { replace: true });
  };

  const getBookMeta = (bookId: string, bookName?: string) => {
    if (!bookMetadata) return undefined;
    return bookMetadata[bookId] 
      || (bookName ? bookMetadata[bookName] : undefined)
      || bookMetadata[encodeURIComponent(bookId)]
      || bookMetadata[decodeURIComponent(bookId)]
      || (bookName ? bookMetadata[encodeURIComponent(bookName)] : undefined)
      || (bookName ? bookMetadata[decodeURIComponent(bookName)] : undefined);
  };

  const getBookShelf = (bookId: string, bookName?: string) => {
    if (!bookCollections) return null;
    return bookCollections[bookId] 
      || (bookName ? bookCollections[bookName] : null)
      || bookCollections[encodeURIComponent(bookId)]
      || bookCollections[decodeURIComponent(bookId)]
      || (bookName ? bookCollections[encodeURIComponent(bookName)] : null)
      || (bookName ? bookCollections[decodeURIComponent(bookName)] : null)
      || null;
  };

  // Collect all tags across all books
  const allTags = Array.from(new Set(
    Object.values(bookMetadata).flatMap(m => m.tags)
  )).sort();

  const sortedBooks = [...books]
    .filter(b => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const meta = getBookMeta(b.id, b.name);
      const titleMatch = b.name.toLowerCase().includes(q) || (meta?.customName && meta.customName.toLowerCase().includes(q));
      const authorMatch = meta?.author && meta.author.toLowerCase().includes(q);
      const descMatch = meta?.description && meta.description.toLowerCase().includes(q);
      const reviewMatch = meta?.review && meta.review.toLowerCase().includes(q);
      const tagMatch = meta?.tags && meta.tags.some(t => t.toLowerCase().includes(q));

      return Boolean(titleMatch || authorMatch || descMatch || reviewMatch || tagMatch);
    })
    .filter(b => {
      if (shelfFilter === 'all') return true;
      return getBookShelf(b.id, b.name) === shelfFilter;
    })
    .filter(b => {
      if (activeTags.length === 0) return true;
      const meta = getBookMeta(b.id, b.name);
      const tags = meta?.tags || [];
      return activeTags.every(t => tags.includes(t));
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        const rA = getBookMeta(a.id, a.name)?.rating || 0;
        const rB = getBookMeta(b.id, b.name)?.rating || 0;
        if (rA !== rB) return rB - rA;
      }
      if (sortBy === 'newest') {
        const timeA = a.updatedAt || 0;
        const timeB = b.updatedAt || 0;
        if (timeA !== timeB) return timeB - timeA;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

  const handleToggleBookRead = (e: MouseEvent, bookId: string) => {
    e.stopPropagation();
    toggleBookCompleted(bookId);
    // AutoSync will handle this
  };

  const handleTagToggle = (tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleClearFilters = () => {
    setShelfFilter('all');
    setActiveTags([]);
  };


  return (
    <div className="h-screen w-full bg-[#E7DDCE] text-[#3D2B1F] flex flex-col lg:flex-row overflow-hidden font-sans">
      
      {/* 1. DESKTOP SIDEBAR RAIL (72px) & MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Rail */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-20 lg:w-[72px] bg-white border-r border-[#EFE6D8] flex flex-col justify-between items-center py-6 px-2 h-screen shrink-0 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-chip`}>
        {/* Top: Avatar & App Logo */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-11 h-11 rounded-full bg-[#E8604F] text-white flex items-center justify-center font-display font-bold text-lg shadow-chip cursor-pointer" title={userName || 'User'}>
            {userName ? userName.charAt(0).toUpperCase() : 'C'}
          </div>

          <div className="w-8 h-0.5 bg-[#EFE6D8] rounded-full" />

          {/* Navigation Icon Buttons */}
          <nav className="flex flex-col items-center gap-4">
            <button
              onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }}
              title="Trang chủ"
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'home' 
                  ? 'bg-[#E8604F]/10 text-[#E8604F] shadow-chip' 
                  : 'text-[#6B5645] hover:bg-[#FBF6EC] hover:text-[#3D2B1F]'
              }`}
            >
              <Home className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setActiveTab('library'); setIsSidebarOpen(false); }}
              title="Thư viện"
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'library' 
                  ? 'bg-[#E8604F]/10 text-[#E8604F] shadow-chip' 
                  : 'text-[#6B5645] hover:bg-[#FBF6EC] hover:text-[#3D2B1F]'
              }`}
            >
              <Library className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setActiveTab('notes'); setIsSidebarOpen(false); }}
              title="Ghi chú"
              className={`p-3 rounded-2xl transition-all cursor-pointer ${
                activeTab === 'notes' 
                  ? 'bg-[#E8604F]/10 text-[#E8604F] shadow-chip' 
                  : 'text-[#6B5645] hover:bg-[#FBF6EC] hover:text-[#3D2B1F]'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigate('/settings')}
              title="Cài đặt"
              className="p-3 rounded-2xl text-[#6B5645] hover:bg-[#FBF6EC] hover:text-[#3D2B1F] transition-all cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
          </nav>
        </div>

        {/* Bottom Actions & Subscribe Ribbon */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setIsUploadOpen(true)}
            title="Tải lên sách mới"
            className="w-11 h-11 rounded-full bg-[#E8604F] hover:bg-[#D6503F] text-white flex items-center justify-center transition-transform active:scale-95 shadow-chip cursor-pointer"
          >
            <Upload className="w-5 h-5" />
          </button>

          <button
            onClick={handleLogoutClick}
            title="Đăng xuất"
            className="p-2.5 text-[#6B5645] hover:text-[#B54B3C] rounded-2xl hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Vertical Subscribe Ribbon CTA */}
          <div className="w-8 h-20 bg-[#4A7FC1] rounded-t-xl text-white font-sans text-[10px] font-bold tracking-wider flex items-center justify-center shadow-xs cursor-pointer hover:bg-[#3B6FA1] transition-colors" style={{ writingMode: 'vertical-rl' }}>
            COZY VIP
          </div>
        </div>
      </aside>


      {/* 2. MAIN CATALOG APP CANVAS (#FBF6EC) */}
      <main className="flex-1 bg-[#FBF6EC] h-screen overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Header & Greeting Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2.5 bg-white/95 backdrop-blur-md border border-[#EFE6D8] rounded-2xl text-[#3D2B1F] shadow-chip cursor-pointer shrink-0 active:scale-95 transition-transform"
                title="Mở Menu"
              >
                <Menu className="w-5 h-5 text-[#3D2B1F]" />
              </button>

              <div>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#3D2B1F] leading-tight">
                  Chào {userName || 'bạn'}! 👋
                </h1>
                <p className="text-xs sm:text-sm text-[#6B5645] font-medium">
                  Hôm nay bạn muốn đắm chìm vào câu chuyện nào?
                </p>
              </div>
            </div>

            {/* Header Right Actions: Pill Search Bar & Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72 lg:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5645]" />
                <input
                  type="text"
                  placeholder="Tìm tên sách, tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F0E7D8] pl-11 pr-4 py-2.5 rounded-full text-sm text-[#3D2B1F] placeholder-[#6B5645] outline-none focus:ring-2 focus:ring-[#E8604F]/30 transition-shadow font-medium"
                />
              </div>

              {/* Desktop Multi-color Gradient Search Button */}
              <button 
                onClick={() => {}} 
                className="hidden sm:flex items-center justify-center px-6 py-2.5 rounded-full text-white font-bold text-xs shadow-chip transition-all hover:opacity-95 active:scale-95 cursor-pointer"
                style={{ background: 'linear-gradient(90deg, #6BB3D9, #8D7FC4, #E8604F, #EDB65B)' }}
              >
                Search
              </button>

              {/* Circular Cart / Upload Action Icon Button */}
              <button
                onClick={() => setIsUploadOpen(true)}
                className="w-11 h-11 rounded-full bg-[#E8604F] hover:bg-[#D6503F] text-white flex items-center justify-center shadow-chip shrink-0 cursor-pointer transition-transform active:scale-95"
                title="Tải lên sách mới"
              >
                <ShoppingBag className="w-5 h-5" />
              </button>

              {/* Mobile Notes Drawer Toggle */}
              <button
                onClick={() => setIsChatOpenMobile(true)}
                className="lg:hidden w-11 h-11 rounded-full bg-[#8D7FC4] text-white flex items-center justify-center shadow-chip shrink-0 cursor-pointer"
                title="Mở Ghi chú"
              >
                <StickyNote className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="space-y-8 animate-fade-in">
              {/* Customize home button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowHomeSectionManager(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#6B5645] border border-[#EFE6D8] rounded-full text-[11px] font-bold shadow-chip hover:border-[#E8604F]/30 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" /> Tuỳ chỉnh trang chủ
                </button>
              </div>

              {/* Reading Stats Widget */}
              {homeSections.find(s => s.key === 'stats')?.visible && (
                <ReadingStatsWidget />
              )}

              {/* Promo Banner Card */}
              {homeSections.find(s => s.key === 'promo')?.visible && (
              <div className="bg-[#F1E9DA] rounded-[20px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs border border-[#EFE6D8]">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#E8604F] bg-white/80 px-3 py-1 rounded-full shadow-xs">
                    Khám phá hôm nay
                  </span>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#3D2B1F] leading-tight">
                    Tủ sách câu chuyện đa sắc màu
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5C4A3B] max-w-md leading-relaxed">
                    Hơn hàng trăm chương truyện độc đáo đang chờ bạn thưởng thức với giao diện đọc đầm ấm, mượt mà.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (readHistory.length > 0) {
                        const lastRead = readHistory[0];
                        navigate(`/book/${lastRead.bookId}`, { state: { bookName: lastRead.bookName } });
                      } else {
                        setActiveTab('library');
                      }
                    }}
                    className="px-6 py-3 bg-[#E8604F] hover:bg-[#D6503F] text-white font-bold text-xs sm:text-sm rounded-full shadow-chip transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    {readHistory.length > 0 ? 'Đọc tiếp gần đây' : 'Khám phá thư viện'}
                  </button>
                </div>
              </div>
              )}

              {/* Section 1: Read History Carousel */}
              {homeSections.find(s => s.key === 'recent')?.visible && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-[#3D2B1F]">
                    Đọc gần đây
                  </h2>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveTab('library')}
                      className="px-4 py-2 bg-white text-[#3D2B1F] text-xs font-bold rounded-full shadow-chip hover:bg-[#F0E7D8] transition-colors"
                    >
                      Xem tất cả
                    </button>
                  </div>
                </div>

                {readHistory.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center border border-[#EFE6D8] text-[#6B5645] space-y-2 shadow-chip">
                    <Clock className="w-10 h-10 mx-auto opacity-30 text-[#E8604F]" />
                    <p className="font-semibold text-sm">Chưa có lịch sử đọc</p>
                    <p className="text-xs opacity-75">Hãy chọn một cuốn sách từ thư viện để bắt đầu hành trình!</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-4 overflow-x-auto no-scrollbar py-2 px-1">
                    {readHistory.map((history) => {
                      const meta = getBookMeta(history.bookId, history.bookName);
                      const shelf = getBookShelf(history.bookId, history.bookName);
                      return (
                        <BookCoverCard
                          key={history.bookId}
                          id={history.bookId}
                          title={meta?.customName || history.bookName}
                          author={meta?.author || history.lastChapterName || 'Đang đọc'}
                          coverImage={meta?.coverImage}
                          isCompleted={completedBooks[history.bookId] || completedBooks[history.bookName]}
                          shelf={shelf}
                          rating={meta?.rating || 0}
                          onClick={() => navigate(`/book/${history.bookId}`, { state: { bookName: history.bookName } })}
                          onToggleCompleted={(e) => handleToggleBookRead(e, history.bookId)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              )}

              {/* Section 2: Personal Library Grid */}
              {homeSections.find(s => s.key === 'new')?.visible && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-[#3D2B1F]">
                    Sách mới cập nhật
                  </h2>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSortBy(sortBy === 'newest' ? 'name' : 'newest')}
                      className="px-4 py-2 bg-white text-[#3D2B1F] text-xs font-bold rounded-full shadow-chip flex items-center gap-1.5 hover:bg-[#F0E7D8]"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      {sortBy === 'newest' ? 'Mới nhất' : 'Tên A-Z'}
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[#6B5645]">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#E8604F]" />
                    <p className="font-medium text-sm">Đang tải tủ sách...</p>
                  </div>
                ) : sortedBooks.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl text-center border border-[#EFE6D8] text-[#6B5645] space-y-3 shadow-chip">
                    <FolderIcon className="w-12 h-12 mx-auto opacity-30 text-[#E8604F]" />
                    <p className="font-bold text-base text-[#3D2B1F]">Tủ sách đang trống</p>
                    <p className="text-xs max-w-xs mx-auto">Tải lên bộ truyện đầu tiên của bạn để tạo nên tủ sách ấm áp cá nhân!</p>
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="px-5 py-2.5 bg-[#E8604F] text-white font-bold text-xs rounded-full shadow-chip inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Tải lên ngay
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                    {sortedBooks.map((book) => {
                      const meta = getBookMeta(book.id, book.name);
                      const shelf = getBookShelf(book.id, book.name);
                      return (
                        <BookCoverCard
                          key={book.id}
                          id={book.id}
                          title={meta?.customName || book.name}
                          author={meta?.author || (book.updatedAt ? new Date(book.updatedAt).toLocaleDateString('vi-VN') : 'Sách sưu tầm')}
                          coverImage={meta?.coverImage}
                          isCompleted={completedBooks[book.id] || completedBooks[book.name]}
                          shelf={shelf}
                          rating={meta?.rating || 0}
                          onClick={() => navigate(`/book/${book.id}`, { state: { bookName: book.name } })}
                          onToggleCompleted={(e) => handleToggleBookRead(e, book.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* TAB 2: LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-5 animate-fade-in">
              {/* Header row */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-display font-bold text-2xl text-[#3D2B1F]">Thư viện ({sortedBooks.length})</h2>

                {/* Layout toggle */}
                <div className="flex items-center gap-2">
                  {([
                    { v: 'grid', icon: LayoutGrid },
                    { v: 'list', icon: List },
                    { v: 'compact', icon: AlignJustify },
                  ] as const).map(({ v, icon: Icon }) => (
                    <button
                      key={v}
                      onClick={() => setBookshelfLayout(v)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${bookshelfLayout === v ? 'bg-[#E8604F]/10 text-[#E8604F]' : 'text-[#6B5645] hover:bg-[#F0E7D8]'}`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* FilterBar */}
              <FilterBar
                sort={sortBy}
                onSortChange={setSortBy}
                shelfFilter={shelfFilter}
                onShelfChange={setShelfFilter}
                activeTags={activeTags}
                allTags={allTags}
                onTagToggle={handleTagToggle}
                onClearFilters={handleClearFilters}
              />

              {sortedBooks.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl text-center border border-[#EFE6D8] space-y-3 shadow-chip">
                  <FolderIcon className="w-12 h-12 mx-auto text-[#E8604F] opacity-40" />
                  <p className="font-bold text-lg text-[#3D2B1F]">
                    {shelfFilter !== 'all' || activeTags.length > 0 ? 'Không có sách phù hợp bộ lọc' : 'Chưa có truyện nào trong thư viện'}
                  </p>
                  {shelfFilter !== 'all' || activeTags.length > 0 ? (
                    <button onClick={handleClearFilters} className="text-xs font-bold text-[#E8604F] underline cursor-pointer">Xóa bộ lọc</button>
                  ) : (
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="px-6 py-3 bg-[#E8604F] text-white font-bold text-xs rounded-full shadow-chip cursor-pointer"
                    >
                      Tải lên truyện đầu tiên
                    </button>
                  )}
                </div>
              ) : bookshelfLayout === 'list' ? (
                <div className="space-y-2">
                  {sortedBooks.map((book) => {
                    const meta = getBookMeta(book.id, book.name);
                    const shelf = getBookShelf(book.id, book.name);
                    return (
                      <div
                        key={book.id}
                        onClick={() => navigate(`/book/${book.id}`, { state: { bookName: book.name } })}
                        className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-[#EFE6D8] shadow-chip hover:shadow-md hover:border-[#E8604F]/20 transition-all cursor-pointer group"
                      >
                        {meta?.coverImage ? (
                          <img src={meta.coverImage} alt={book.name} className="w-10 h-14 rounded-xl object-cover shrink-0 shadow-xs" />
                        ) : (
                          <div className="w-10 h-14 rounded-xl bg-gradient-to-br from-[#E8604F] to-[#EDB65B] shrink-0 flex items-center justify-center text-white text-xs font-bold">
                            {book.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#3D2B1F] group-hover:text-[#E8604F] transition-colors truncate">{meta?.customName || book.name}</p>
                          <p className="text-xs text-[#6B5645]">{meta?.author || (book.updatedAt ? new Date(book.updatedAt).toLocaleDateString('vi-VN') : 'Sách sưu tầm')}</p>
                          {shelf && <span className="text-[10px] font-bold text-[#8D7FC4]">{shelf}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {meta?.rating && meta.rating > 0 ? (
                            <span className="text-[10px] font-bold text-[#EDB65B]">{'★'.repeat(meta.rating)}</span>
                          ) : null}
                          <button onClick={(e) => handleToggleBookRead(e, book.id)} className="p-1">
                            {(completedBooks[book.id] || completedBooks[book.name])
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <Circle className="w-4 h-4 text-[#ADADAD]" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`grid gap-4 sm:gap-6 ${bookshelfLayout === 'compact'
                  ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}`}>
                  {sortedBooks.map((book) => {
                    const meta = getBookMeta(book.id, book.name);
                    const shelf = getBookShelf(book.id, book.name);
                    return (
                      <BookCoverCard
                        key={book.id}
                        id={book.id}
                        title={meta?.customName || book.name}
                        author={meta?.author || (book.updatedAt ? new Date(book.updatedAt).toLocaleDateString('vi-VN') : 'Sách sưu tầm')}
                        coverImage={meta?.coverImage}
                        isCompleted={completedBooks[book.id] || completedBooks[book.name]}
                        shelf={shelf}
                        rating={meta?.rating || 0}
                        size={bookshelfLayout === 'compact' ? 'sm' : 'md'}
                        onClick={() => navigate(`/book/${book.id}`, { state: { bookName: book.name } })}
                        onToggleCompleted={(e) => handleToggleBookRead(e, book.id)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}


          {/* TAB 3: NOTES */}
          {activeTab === 'notes' && (
            <div className="animate-fade-in bg-white rounded-[24px] p-4 border border-[#EFE6D8] shadow-chip">
              <NotesTab />
            </div>
          )}

        </div>
      </main>


      {/* 3. DESKTOP PERSISTENT CHAT & NOTES PANEL (360px) */}
      <div className="hidden lg:block h-screen sticky top-0">
        <DesktopChatPanel />
      </div>

      {/* Mobile Drawer Overlay for Chat */}
      {isChatOpenMobile && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs lg:hidden">
          <div className="w-full max-w-sm h-full bg-white animate-slide-left">
            <DesktopChatPanel 
              isCollapsible 
              onClose={() => setIsChatOpenMobile(false)} 
            />
          </div>
        </div>
      )}


      {/* 4. MOBILE FLOATING BOTTOM NAV BAR */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md rounded-full shadow-chip border border-[#EFE6D8] px-4 py-2 flex items-center justify-around h-16">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-[#E8604F] font-bold' : 'text-[#6B5645]'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Trang chủ</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'library' ? 'text-[#E8604F] font-bold' : 'text-[#6B5645]'}`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px]">Thư viện</span>
        </button>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="w-10 h-10 rounded-full bg-[#E8604F] text-white flex items-center justify-center shadow-chip -mt-4 cursor-pointer active:scale-95"
        >
          <Upload className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'notes' ? 'text-[#E8604F] font-bold' : 'text-[#6B5645]'}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Ghi chú</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="flex flex-col items-center gap-1 text-[#6B5645]"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Cài đặt</span>
        </button>
      </nav>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          loadBooks();
        }}
      />

      {/* Home Section Manager Modal */}
      {showHomeSectionManager && (
        <HomeSectionManager onClose={() => setShowHomeSectionManager(false)} />
      )}
    </div>

  );
}
