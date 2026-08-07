import { useState, useEffect, MouseEvent } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, FileText, Loader2, Upload, CheckCircle2, Circle, ArrowUpDown, CheckCheck, BookCheck, Sparkles, Star, Tag, BookOpen, X, Edit3, Image, UploadCloud, RotateCcw, Save } from 'lucide-react';
import { useStore, BookShelf } from '../store';
import { getFiles, DriveFile } from '../lib/drive';
import { formatChapterName } from '../lib/utils';
import UploadModal from '../components/UploadModal';
import BookCoverCard from '../components/BookCoverCard';

export default function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    token, 
    setCurrentBookChapters, 
    completedBooks, 
    completedChapters, 
    toggleBookCompleted, 
    toggleChapterCompleted, 
    markAllChaptersCompleted,
    triggerSyncToDrive,
    bookCollections, setBookCollection,
    bookMetadata, setBookMetadata,
  } = useStore();

  const [chapters, setChapters] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'name'>(
    (localStorage.getItem('reader_book_sort_by') as any) || 'newest'
  );

  useEffect(() => {
    localStorage.setItem('reader_book_sort_by', sortBy);
  }, [sortBy]);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const bookId = id || '';
  const bookName = location.state?.bookName || decodeURIComponent(id || 'Book Chapters');

  const currentMeta = bookMetadata[bookId] 
    || bookMetadata[bookName] 
    || bookMetadata[encodeURIComponent(bookName)] 
    || bookMetadata[encodeURIComponent(bookId)]
    || bookMetadata[decodeURIComponent(bookId)]
    || { rating: 0, tags: [], review: '' };

  const currentShelf = bookCollections[bookId] 
    || bookCollections[bookName] 
    || bookCollections[encodeURIComponent(bookName)]
    || bookCollections[decodeURIComponent(bookId)]
    || null;

  useEffect(() => {
    if (id) {
      loadChapters();
    }
  }, [id]);

  const loadChapters = async () => {
    try {
      setLoading(true);
      setError('');
      let files = await getFiles(token, id!);
      setChapters(files);
      setCurrentBookChapters(files);
    } catch (err: any) {
      setError('Không thể tải danh sách chương.');
    } finally {
      setLoading(false);
    }
  };

  // Sort chapters depending on selection
  const sortedChapters = [...chapters].sort((a, b) => {
    if (sortBy === 'newest') {
      const timeA = a.updatedAt || 0;
      const timeB = b.updatedAt || 0;
      if (timeA !== timeB) return timeB - timeA;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    } else {
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    }
  });

  // Calculate completion progress
  const readCount = chapters.filter(c => completedChapters[c.id]).length;
  const isBookDone = completedBooks[bookId] || (chapters.length > 0 && readCount === chapters.length);

  const handleToggleChapter = (e: MouseEvent, chapterId: string) => {
    e.stopPropagation();
    toggleChapterCompleted(chapterId);
    triggerSyncToDrive().catch(console.error);
  };

  const handleToggleBook = () => {
    toggleBookCompleted(bookId);
    triggerSyncToDrive().catch(console.error);
  };

  const handleMarkAll = (completed: boolean) => {
    markAllChaptersCompleted(bookId, chapters.map(c => c.id), completed);
    triggerSyncToDrive().catch(console.error);
  };

  return (
    <div className="min-h-screen bg-[#FBF6EC] text-[#3D2B1F] pb-24 font-sans">
      {/* Sticky Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-chip sticky top-0 z-40 border-b border-[#EFE6D8]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button 
              onClick={() => navigate('/bookshelf')} 
              className="p-2 text-[#6B5645] hover:text-[#3D2B1F] hover:bg-[#F0E7D8] rounded-full transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="font-display text-lg font-bold text-[#3D2B1F] truncate flex items-center gap-2">
              <span className="truncate">{currentMeta.customName || bookName}</span>
              {isBookDone && (
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã xong
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleBook}
              title={isBookDone ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all shadow-chip cursor-pointer ${
                isBookDone 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-white hover:bg-[#F0E7D8] text-[#3D2B1F] border border-[#E4D9C8]'
              }`}
            >
              <BookCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBookDone ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</span>
            </button>

            <button 
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#E8604F] hover:bg-[#D6503F] active:scale-95 rounded-full transition-all shadow-chip cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Thêm chương</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Cozy Hero Section with Signature Book Cover Card */}
        <div className="bg-white rounded-[24px] p-6 border border-[#EFE6D8] shadow-chip flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <BookCoverCard 
            id={bookId}
            title={currentMeta.customName || bookName}
            author={currentMeta.author || "Sách sưu tầm"}
            coverImage={currentMeta.coverImage}
            isCompleted={isBookDone}
            size="lg"
          />

          <div className="flex-1 text-center sm:text-left space-y-3 pt-2">
            <div className="flex items-center justify-center sm:justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E8604F] bg-[#E8604F]/10 px-3 py-1 rounded-full">
                Thư mục bộ truyện
              </span>
              <button
                onClick={() => setIsEditingInfo(e => !e)}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#F0E7D8] hover:bg-[#E4D9C8] text-[#3D2B1F] rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#E8604F]" /> {isEditingInfo ? 'Đóng chỉnh sửa' : 'Sửa thông tin sách'}
              </button>
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#3D2B1F] leading-tight">
              {currentMeta.customName || bookName}
            </h1>

            <p className="text-xs sm:text-sm text-[#B54B3C] font-semibold">
              Tác giả: {currentMeta.author || "Sách sưu tầm"}
            </p>

            <p className="text-xs sm:text-sm text-[#6B5645] leading-relaxed">
              {currentMeta.description || `Tổng cộng ${chapters.length} chương truyện. Được lưu trữ đầm ấm trên hệ thống Cozy Shelf.`}
            </p>

            {/* Read Count Summary */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-[#3D2B1F]">
              <span className="bg-[#F0E7D8] px-3 py-1.5 rounded-full">
                📖 Đã đọc: {readCount} / {chapters.length}
              </span>
              <span className="bg-[#F0E7D8] px-3 py-1.5 rounded-full">
                ✨ Hoàn thành: {chapters.length > 0 ? Math.round((readCount / chapters.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Customization Form Modal / Inline Drawer */}
        {isEditingInfo && (
          <div className="bg-[#F9F5EE] rounded-[24px] p-6 border border-[#EFE6D8] shadow-chip space-y-4 animate-fade-in">
            <h2 className="font-display text-base font-bold text-[#3D2B1F] flex items-center gap-2 border-b border-[#EFE6D8] pb-2">
              <Edit3 className="w-4 h-4 text-[#E8604F]" /> Tùy chỉnh chi tiết cuốn sách
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Custom Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B5645] uppercase tracking-wider">Tên sách hiển thị</label>
                <input
                  type="text"
                  placeholder={bookName}
                  value={currentMeta.customName || ''}
                  onChange={(e) => setBookMetadata(bookId, { customName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#EFE6D8] rounded-xl text-sm font-medium text-[#3D2B1F] outline-none focus:ring-2 focus:ring-[#E8604F]/30"
                />
              </div>

              {/* Author */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6B5645] uppercase tracking-wider">Tác giả</label>
                <input
                  type="text"
                  placeholder="Nhập tên tác giả..."
                  value={currentMeta.author || ''}
                  onChange={(e) => setBookMetadata(bookId, { author: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-[#EFE6D8] rounded-xl text-sm font-medium text-[#3D2B1F] outline-none focus:ring-2 focus:ring-[#E8604F]/30"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#6B5645] uppercase tracking-wider">Giới thiệu / Mô tả bộ truyện</label>
              <textarea
                placeholder="Nhập tóm tắt, mô tả nội dung cuốn sách..."
                value={currentMeta.description || ''}
                onChange={(e) => setBookMetadata(bookId, { description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-[#EFE6D8] rounded-xl text-sm font-medium text-[#3D2B1F] outline-none focus:ring-2 focus:ring-[#E8604F]/30 resize-none"
              />
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#6B5645] uppercase tracking-wider flex items-center gap-1">
                <Image className="w-3.5 h-3.5" /> Ảnh bìa sách tùy chỉnh
              </label>

              <div className="flex items-center gap-3 flex-wrap pt-1">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-[#E8604F] hover:bg-[#D6503F] text-white text-xs font-bold rounded-xl transition-all shadow-chip cursor-pointer">
                  <UploadCloud className="w-4 h-4" /> Chọn ảnh bìa từ máy
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const base64 = evt.target?.result as string;
                        if (base64) {
                          setBookMetadata(bookId, { coverImage: base64 });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>

                {currentMeta.coverImage && (
                  <button
                    onClick={() => setBookMetadata(bookId, { coverImage: '' })}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-red-50 text-[#B54B3C] hover:bg-red-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Xóa ảnh bìa tùy chỉnh
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  triggerSyncToDrive().catch(console.error);
                  setIsEditingInfo(false);
                }}
                className="px-6 py-2.5 bg-[#E8604F] text-white text-xs font-bold rounded-full shadow-chip hover:bg-[#D6503F] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Lưu thông tin
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Book Metadata Panel */}
        <div className="bg-white rounded-[24px] p-5 border border-[#EFE6D8] shadow-chip space-y-4">
          <h2 className="font-display text-base font-bold text-[#3D2B1F]">Đánh giá & Ghi chú cá nhân</h2>

          {/* Rating */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6B5645] uppercase tracking-wider">Đánh giá</label>
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(s => (
                <button
                  key={s}
                  onClick={() => setBookMetadata(bookId, { rating: currentMeta.rating === s ? 0 : s })}
                  className="transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <Star className={`w-7 h-7 ${s <= (currentMeta.rating || 0) ? 'text-[#EDB65B] fill-[#EDB65B]' : 'text-[#E4D9C8]'}`} />
                </button>
              ))}
              {currentMeta.rating > 0 && (
                <span className="text-xs font-bold text-[#6B5645] ml-2">{currentMeta.rating}/5</span>
              )}
            </div>
          </div>

          {/* Shelf selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6B5645] uppercase tracking-wider">Kệ sách</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'reading',   label: '📖 Đang đọc' },
                { value: 'want',      label: '🔖 Muốn đọc' },
                { value: 'completed', label: '✅ Đã xong' },
                { value: 'dropped',   label: '⏸ Tạm dừng' },
              ] as { value: BookShelf; label: string }[]).map(shelf => (
                <button
                  key={shelf.value}
                  onClick={() => setBookCollection(bookId, currentShelf === shelf.value ? null : shelf.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    currentShelf === shelf.value
                      ? 'bg-[#E8604F] text-white border-[#E8604F]'
                      : 'border-[#EFE6D8] text-[#6B5645] hover:border-[#E8604F]/40'
                  }`}
                >
                  {shelf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6B5645] uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(currentMeta.tags || []).map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8D7FC4]/15 text-[#8D7FC4] text-[11px] font-bold border border-[#8D7FC4]/25">
                  #{tag}
                  <button onClick={() => setBookMetadata(bookId, { tags: (currentMeta.tags || []).filter(t => t !== tag) })} className="ml-0.5 opacity-60 hover:opacity-100">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Thêm tag (vd: fantasy, romance...)"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    const current = currentMeta.tags || [];
                    if (!current.includes(tagInput.trim())) {
                      setBookMetadata(bookId, { tags: [...current, tagInput.trim()] });
                    }
                    setTagInput('');
                  }
                }}
                className="px-3 py-1.5 bg-[#F9F5EE] border border-[#EFE6D8] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#E8604F] w-64"
              />
              <button
                onClick={() => {
                  if (tagInput.trim()) {
                    const current = currentMeta.tags || [];
                    if (!current.includes(tagInput.trim())) {
                      setBookMetadata(bookId, { tags: [...current, tagInput.trim()] });
                    }
                    setTagInput('');
                  }
                }}
                className="px-3 py-1.5 bg-[#8D7FC4] text-white text-xs font-bold rounded-xl hover:bg-[#7D6FB4] cursor-pointer"
              >
                Thêm tag
              </button>
            </div>
          </div>

          {/* Personal Review */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#6B5645] uppercase tracking-wider">Cảm nhận / Review cá nhân</label>
              {!showReview && (
                <button onClick={() => setShowReview(true)} className="text-xs font-bold text-[#E8604F] hover:underline cursor-pointer">
                  {currentMeta.review ? '✏️ Sửa review' : '✍️ Viết review'}
                </button>
              )}
            </div>

            {currentMeta.review && !showReview && (
              <p className="text-xs text-[#3D2B1F] bg-[#F9F5EE] p-3 rounded-xl border border-[#EFE6D8] italic">
                "{currentMeta.review}"
              </p>
            )}

            {showReview && (
              <div className="space-y-2">
                <textarea
                  placeholder="Nhập cảm nhận cá nhân về bộ truyện này..."
                  value={currentMeta.review || ''}
                  onChange={e => setBookMetadata(bookId, { review: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#F9F5EE] border border-[#EFE6D8] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#E8604F] resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowReview(false)} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold cursor-pointer">
                    Xong
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress & Controls Bar */}
        {!loading && !error && chapters.length > 0 && (
          <div className="bg-white p-4 rounded-[20px] shadow-chip border border-[#EFE6D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between text-xs font-bold text-[#6B5645]">
                <span>Tiến độ đọc toàn bộ</span>
                <span>{chapters.length > 0 ? Math.round((readCount / chapters.length) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-[#F0E7D8] rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-[#E8604F] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${chapters.length > 0 ? (readCount / chapters.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#EFE6D8] shrink-0">
              <div className="flex items-center gap-1 bg-[#F0E7D8] p-1 rounded-full text-xs font-semibold">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer ${
                    sortBy === 'newest' 
                      ? 'bg-white text-[#E8604F] shadow-xs' 
                      : 'text-[#6B5645] hover:text-[#3D2B1F]'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Mới cập nhật
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                    sortBy === 'name' 
                      ? 'bg-white text-[#E8604F] shadow-xs' 
                      : 'text-[#6B5645] hover:text-[#3D2B1F]'
                  }`}
                >
                  Theo tên
                </button>
              </div>

              {readCount < chapters.length ? (
                <button
                  onClick={() => handleMarkAll(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                  title="Đánh dấu tất cả chương là đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đọc hết
                </button>
              ) : (
                <button
                  onClick={() => handleMarkAll(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-[#6B5645] bg-[#F0E7D8] hover:bg-[#E4D9C8] rounded-full transition-colors cursor-pointer"
                  title="Bỏ đánh dấu tất cả chương"
                >
                  Bỏ đánh dấu
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chapter Items List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#6B5645]">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#E8604F]" />
            <p className="font-medium">Đang tải danh sách chương...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-[#B54B3C] p-4 rounded-2xl text-center border border-red-100">
            <p>{error}</p>
            <button onClick={loadChapters} className="mt-2 text-sm font-semibold hover:underline cursor-pointer">Thử lại</button>
          </div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-20 text-[#6B5645] bg-white border border-[#EFE6D8] rounded-[24px] p-8 shadow-chip space-y-3">
            <FileText className="w-12 h-12 mx-auto opacity-30 text-[#E8604F]" />
            <p className="font-display font-bold text-lg text-[#3D2B1F]">Chưa có chương nào trong bộ truyện này</p>
            <p className="text-xs opacity-75">Thêm tệp chương vào thư mục truyện để bắt đầu đọc!</p>
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E8604F] hover:bg-[#D6503F] text-white font-bold rounded-full transition-all shadow-chip active:scale-95 cursor-pointer text-xs"
            >
              <Upload className="w-4 h-4" />
              Tải lên chương đầu tiên
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] shadow-chip border border-[#EFE6D8] overflow-hidden divide-y divide-[#EFE6D8]">
            {sortedChapters.map((chapter) => {
              const isRead = completedChapters[chapter.id];
              return (
                <div
                  key={chapter.id}
                  onClick={() => navigate(`/read/${chapter.id}`, { 
                    state: { 
                      chapterName: chapter.name, 
                      mimeType: chapter.mimeType, 
                      bookId: id, 
                      bookName: bookName 
                    } 
                  })}
                  className={`w-full text-left px-5 py-4 flex items-center gap-3.5 min-h-[64px] hover:bg-[#FBF6EC] active:bg-[#F0E7D8] transition-colors cursor-pointer ${
                    isRead ? 'opacity-70 bg-[#FBF6EC]/50' : ''
                  }`}
                >
                  <button
                    onClick={(e) => handleToggleChapter(e, chapter.id)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer shrink-0"
                    title={isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                  >
                    {isRead ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#6B5645] hover:text-emerald-600" />
                    )}
                  </button>

                  <div className={`p-2.5 rounded-xl shrink-0 ${isRead ? 'bg-[#F0E7D8] text-[#6B5645]' : 'bg-[#E8604F]/10 text-[#E8604F]'}`}>
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className={`font-semibold text-sm sm:text-base block line-clamp-2 leading-snug ${isRead ? 'text-[#6B5645] line-through' : 'text-[#3D2B1F]'}`}>
                      {formatChapterName(chapter.name)}
                    </span>
                    {chapter.updatedAt && (
                      <span className="text-[11px] text-[#6B5645] block mt-0.5 font-medium">
                        Cập nhật: {new Date(chapter.updatedAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>

                  {isRead && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                      Đã đọc
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Chapter Upload Modal */}
      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        initialBookName={bookName}
        onUploadSuccess={() => {
          loadChapters();
        }}
      />
    </div>
  );
}

