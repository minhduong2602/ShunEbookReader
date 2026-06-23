import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, FileText, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { getFiles, DriveFile } from '../lib/drive';

export default function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout, setCurrentBookChapters, setSessionExpired } = useStore();
  const [chapters, setChapters] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bookName = location.state?.bookName || 'Book Chapters';

  useEffect(() => {
    if (token && id) {
      loadChapters();
    }
  }, [token, id]);

  const loadChapters = async () => {
    try {
      setLoading(true);
      let files = await getFiles(token!, id!);
      
      // Natural sort by name
      files.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
      
      setChapters(files);
      setCurrentBookChapters(files);
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        setSessionExpired(true);
      } else {
        setError('Failed to load chapters.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-2 h-16 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate flex-1">{bookName}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p>Loading chapters...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            {error}
            <button onClick={loadChapters} className="block mx-auto mt-2 text-sm underline">Try Again</button>
          </div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No readable files found in this book.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => navigate(`/read/${chapter.id}`, { state: { chapterName: chapter.name, mimeType: chapter.mimeType } })}
                className={`w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                  index !== chapters.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-800 flex-1 truncate">{chapter.name}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
