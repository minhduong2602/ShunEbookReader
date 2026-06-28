import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, LogOut, Loader2, Folder as FolderIcon, Download, Clock, Settings, FileText, List, Upload } from 'lucide-react';
import { useStore } from '../store';
import { getFolders, DriveFile } from '../lib/drive';
import UploadModal from '../components/UploadModal';

export default function Bookshelf() {
  const navigate = useNavigate();
  const { token, folderId, logout, loadSyncFromDrive, readHistory, userName } = useStore();
  const [books, setBooks] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'books' | 'recent'>('recent');
  
  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [r2Status, setR2Status] = useState<{r2: boolean, message: string} | null>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    
    // Check R2 status
    fetch('/api/status')
      .then(res => res.json())
      .then(data => setR2Status(data))
      .catch(console.error);
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
      setError('Failed to load bookshelf. Make sure the server is online or configuration is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Book className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[180px] sm:max-w-none">
              {userName}'s Bookshelf
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
            )}
            
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Novel</span>
            </button>

            <button 
              onClick={() => navigate('/settings')} 
              className="p-2 text-gray-500 hover:text-gray-950 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button 
              onClick={handleLogoutClick}
              className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Change Name"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 border-t border-gray-100 dark:border-gray-800/80 flex gap-6">
          <button 
            onClick={() => setActiveTab('recent')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'recent' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-750 dark:hover:text-gray-300'}`}
          >
            <Clock className="w-4 h-4" /> Recent
          </button>
          <button 
            onClick={() => setActiveTab('books')}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'books' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 hover:text-gray-750 dark:hover:text-gray-300'}`}
          >
            <FolderIcon className="w-4 h-4" /> Folders
          </button>
        </div>
      </header>

      {r2Status && !r2Status.r2 && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 p-4 rounded-xl text-sm flex items-start gap-3">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold mb-1">Cảnh báo đồng bộ Cloudflare R2 (Sync Warning)</p>
              <p className="opacity-90 leading-relaxed">
                {r2Status.message} Ứng dụng hiện đang hiển thị các tệp lưu trữ tạm thời trên Local Storage (bao gồm Sample Novel). Các thư mục bạn upload trực tiếp trên dashboard R2 sẽ không hiện ra cho tới khi cấu hình R2 chính xác hoặc sửa lỗi kết nối.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'recent' ? (
          <div className="space-y-4">
            {readHistory.length === 0 ? (
              <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium text-gray-600 dark:text-gray-300">No recently read books.</p>
                <p className="text-sm text-gray-400 mt-1">Switch to Folders tab to start a book or upload a novel.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {readHistory.map(entry => (
                  <div key={entry.bookId} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-left p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white truncate mb-1">{entry.bookName}</h3>
                      {entry.lastChapterName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-4 flex items-center gap-1.5 font-sans">
                          <FileText className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                          {entry.lastChapterName}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {entry.lastChapterId && (
                        <button 
                          onClick={() => navigate(`/read/${entry.lastChapterId}`, { 
                            state: { 
                              chapterName: entry.lastChapterName, 
                              mimeType: entry.lastChapterId.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain', 
                              bookId: entry.bookId, 
                              bookName: entry.bookName 
                            }
                          })}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 py-2 rounded-xl text-sm font-semibold transition-colors text-center cursor-pointer"
                        >
                          Continue Reading
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/book/${entry.bookId}`, { state: { bookName: entry.bookName }})}
                        className="px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                        title="Chapter List"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p className="font-medium">Loading your books...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center border border-red-100 dark:border-red-950/40">
            <p>{error}</p>
            <button onClick={loadBooks} className="mt-2 text-sm font-semibold hover:underline cursor-pointer">Try Again</button>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
            <FolderIcon className="w-12 h-12 mx-auto mb-4 opacity-20 text-blue-500" />
            <p className="font-semibold text-gray-700 dark:text-gray-200">Your Bookshelf is empty</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Upload your first novel to start reading!</p>
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Novel Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`, { state: { bookName: book.name } })}
                className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all text-left flex flex-col items-center gap-3 group active:scale-95 cursor-pointer"
              >
                <div className="w-full aspect-[3/4] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-850 dark:to-gray-800 rounded-xl flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-gray-800 dark:group-hover:to-gray-750 transition-colors shadow-inner">
                  <Book className="w-10 h-10 text-blue-300 dark:text-blue-500 group-hover:text-blue-400 group-hover:scale-105 transition-all" />
                </div>
                <h2 className="font-bold text-gray-800 dark:text-gray-200 line-clamp-2 text-sm text-center w-full leading-tight">
                  {book.name}
                </h2>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Reusable Upload Modal */}
      <UploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          loadBooks();
        }}
      />
    </div>
  );
}
