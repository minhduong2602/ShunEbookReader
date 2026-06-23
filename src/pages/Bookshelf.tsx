import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, LogOut, Loader2, Folder as FolderIcon, Download, Clock, Settings, FileText, List } from 'lucide-react';
import { useStore } from '../store';
import { getFolders, DriveFile } from '../lib/drive';

export default function Bookshelf() {
  const navigate = useNavigate();
  const { token, folderId, logout, setSessionExpired, loadSyncFromDrive, readHistory, userName } = useStore();
  const [books, setBooks] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'books' | 'recent'>('recent');

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
    if (token && folderId) {
      loadBooks();
      loadSyncFromDrive().catch(console.error);
    }
  }, [token, folderId]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const folders = await getFolders(token!, folderId!);
      setBooks(folders);
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        setSessionExpired(true);
      } else {
        setError('Failed to load bookshelf. Make sure the Folder ID is correct and accessible.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-none">{userName}'s Bookshelf</h1>
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
            <button onClick={() => navigate('/settings')} className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 border-t border-gray-100 flex gap-6">
          <button 
            onClick={() => setActiveTab('recent')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'recent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Clock className="w-4 h-4" /> Recent
          </button>
          <button 
            onClick={() => setActiveTab('books')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'books' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <FolderIcon className="w-4 h-4" /> Folders
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'recent' ? (
          <div className="space-y-4">
            {readHistory.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No recently read books.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {readHistory.map(entry => (
                  <div key={entry.bookId} className="bg-white border text-left p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">{entry.bookName}</h3>
                    {entry.lastChapterName && (
                      <p className="text-sm text-gray-500 truncate mb-3 flex items-center gap-1.5 font-sans">
                        <FileText className="w-3.5 h-3.5" />
                        {entry.lastChapterName}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {entry.lastChapterId && (
                        <button 
                          onClick={() => navigate(`/read/${entry.lastChapterId}`, { state: { chapterName: entry.lastChapterName, mimeType: 'text/plain', bookId: entry.bookId, bookName: entry.bookName }})}
                          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-xl text-sm font-medium transition-colors text-center"
                        >
                          Continue Reading
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/book/${entry.bookId}`, { state: { bookName: entry.bookName }})}
                        className="px-3 bg-gray-50 text-gray-700 hover:bg-gray-100 py-2 rounded-xl text-sm font-medium transition-colors"
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
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p>Loading your books...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            {error}
            <button onClick={loadBooks} className="block mx-auto mt-2 text-sm underline">Try Again</button>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FolderIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No books (folders) found in this directory.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`, { state: { bookName: book.name } })}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left flex flex-col items-center gap-3 group active:scale-95"
              >
                <div className="w-full aspect-[3/4] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                  <Book className="w-10 h-10 text-blue-300 group-hover:text-blue-400" />
                </div>
                <h2 className="font-medium text-gray-900 line-clamp-2 text-sm text-center w-full">
                  {book.name}
                </h2>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
