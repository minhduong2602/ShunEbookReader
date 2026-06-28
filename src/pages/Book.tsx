import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, FileText, Loader2, Upload } from 'lucide-react';
import { useStore } from '../store';
import { getFiles, DriveFile } from '../lib/drive';
import { formatChapterName } from '../lib/utils';
import UploadModal from '../components/UploadModal';

export default function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, setCurrentBookChapters } = useStore();
  const [chapters, setChapters] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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
      
      // Natural sort by name
      files.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
      
      setChapters(files);
      setCurrentBookChapters(files);
    } catch (err: any) {
      setError('Failed to load chapters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-2 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate flex-1">{bookName}</h1>
          </div>

          <div className="flex items-center gap-2 pr-2 shrink-0">
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Chapter</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
            <p className="font-medium">Loading chapters...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center border border-red-100 dark:border-red-950/40">
            <p>{error}</p>
            <button onClick={loadChapters} className="mt-2 text-sm font-semibold hover:underline cursor-pointer">Try Again</button>
          </div>
        ) : chapters.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20 text-blue-500" />
            <p className="font-semibold text-gray-750 dark:text-gray-200">No chapters found</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Add chapters to this book folder to start reading!</p>
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload Chapter
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => navigate(`/read/${chapter.id}`, { 
                  state: { 
                    chapterName: chapter.name, 
                    mimeType: chapter.mimeType, 
                    bookId: id, 
                    bookName: bookName 
                  } 
                })}
                className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 active:bg-gray-100 dark:active:bg-gray-800/80 transition-colors cursor-pointer"
              >
                <div className="bg-blue-50 dark:bg-blue-950/50 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-800 dark:text-gray-200 flex-1 truncate">{formatChapterName(chapter.name)}</span>
              </button>
            ))}
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
