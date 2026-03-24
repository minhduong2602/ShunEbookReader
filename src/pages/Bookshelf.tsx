import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, LogOut, Loader2, Folder as FolderIcon } from 'lucide-react';
import { useStore } from '../store';
import { getFolders, DriveFile } from '../lib/drive';

export default function Bookshelf() {
  const navigate = useNavigate();
  const { token, folderId, logout } = useStore();
  const [books, setBooks] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && folderId) {
      loadBooks();
    }
  }, [token, folderId]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const folders = await getFolders(token!, folderId!);
      setBooks(folders);
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        logout();
        navigate('/');
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
          <div className="flex items-center gap-2">
            <Book className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">My Bookshelf</h1>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {loading ? (
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
