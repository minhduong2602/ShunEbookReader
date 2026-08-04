import { useState, useEffect, MouseEvent } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, FileText, Loader2, Upload, CheckCircle2, Circle, ArrowUpDown, CheckCheck, BookCheck } from 'lucide-react';
import { useStore } from '../store';
import { getFiles, DriveFile } from '../lib/drive';
import { formatChapterName } from '../lib/utils';
import UploadModal from '../components/UploadModal';

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
    triggerSyncToDrive 
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
  
  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const bookId = id || '';
  const bookName = location.state?.bookName || decodeURIComponent(id || 'Book Chapters');

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
      setError('Failed to load chapters.');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-2 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer shrink-0">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate flex-1 flex items-center gap-2">
              <span className="truncate">{bookName}</span>
              {isBookDone && (
                <span className="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã đọc
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2 pr-2 shrink-0">
            <button
              onClick={handleToggleBook}
              title={isBookDone ? 'Bỏ đánh dấu truyện đã đọc' : 'Đánh dấu đã đọc truyện'}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer ${
                isBookDone 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200'
              }`}
            >
              <BookCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBookDone ? 'Đã xong' : 'Đánh dấu đã đọc'}</span>
            </button>

            <button 
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Thêm chương</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {!loading && !error && chapters.length > 0 && (
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                <span>Tiến độ đọc: {readCount} / {chapters.length} chương</span>
                <span>{chapters.length > 0 ? Math.round((readCount / chapters.length) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${chapters.length > 0 ? (readCount / chapters.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                    sortBy === 'newest' 
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Mới cập nhật
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                    sortBy === 'name' 
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Theo tên
                </button>
              </div>

              {readCount < chapters.length ? (
                <button
                  onClick={() => handleMarkAll(true)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-900/40 rounded-xl transition-colors flex items-center gap-1"
                  title="Đánh dấu tất cả chương là đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đọc hết
                </button>
              ) : (
                <button
                  onClick={() => handleMarkAll(false)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  title="Bỏ đánh dấu tất cả chương"
                >
                  Bỏ đánh dấu
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p className="font-medium">Đang tải danh sách chương...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center border border-red-100 dark:border-red-950/40">
            <p>{error}</p>
            <button onClick={loadChapters} className="mt-2 text-sm font-semibold hover:underline cursor-pointer">Thử lại</button>
          </div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20 text-blue-500" />
            <p className="font-semibold text-gray-750 dark:text-gray-200">Chưa có chương nào trong truyện</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Thêm tệp chương vào thư mục truyện để bắt đầu đọc!</p>
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
            >
              <Upload className="w-4 h-4" />
              Tải lên chương
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
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
                  className={`w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 active:bg-gray-100 dark:active:bg-gray-800/80 transition-colors cursor-pointer ${
                    isRead ? 'opacity-75 bg-gray-50/50 dark:bg-gray-950/30' : ''
                  }`}
                >
                  <button
                    onClick={(e) => handleToggleChapter(e, chapter.id)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer shrink-0"
                    title={isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                  >
                    {isRead ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-green-500 dark:hover:text-green-400" />
                    )}
                  </button>

                  <div className={`p-2 rounded-xl shrink-0 ${isRead ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className={`font-semibold block truncate ${isRead ? 'text-gray-500 dark:text-gray-400 line-through decoration-gray-300 dark:decoration-gray-700' : 'text-gray-800 dark:text-gray-200'}`}>
                      {formatChapterName(chapter.name)}
                    </span>
                    {chapter.updatedAt && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 block">
                        Cập nhật: {new Date(chapter.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {isRead && (
                    <span className="text-[11px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-md shrink-0">
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
