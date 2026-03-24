import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Type, Moon, Sun, Coffee, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { getFileContent } from '../lib/drive';

export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout, fontSize, theme, setFontSize, setTheme, currentBookChapters, scrollPositions, setScrollPosition } = useStore();

  const [content, setContent] = useState('');
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showControls, setShowControls] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const chapterName = location.state?.chapterName || 'Reading';
  const mimeType = location.state?.mimeType || 'text/plain';

  // Find current chapter index for Prev/Next
  const currentIndex = currentBookChapters.findIndex(c => c.id === id);
  const prevChapter = currentIndex > 0 ? currentBookChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex !== -1 && currentIndex < currentBookChapters.length - 1 ? currentBookChapters[currentIndex + 1] : null;

  useEffect(() => {
    if (token && id) {
      loadContent();
    }
    
    // Save scroll position on unmount
    return () => {
      if (id && !loading && !error) {
        setScrollPosition(id, window.scrollY);
      }
    };
  }, [token, id]);

  // Restore scroll position when content is loaded
  useEffect(() => {
    if (!loading && !error && id && scrollPositions[id]) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        window.scrollTo({ top: scrollPositions[id], behavior: 'instant' });
      }, 100);
    } else if (!loading) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [loading, error, id]);

  // Save scroll position periodically while reading
  useEffect(() => {
    if (loading || error || !id) return;
    
    const handleScroll = () => {
      setScrollPosition(id, window.scrollY);
    };
    
    // Debounce scroll event
    let timeoutId: any;
    const debouncedScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 1000);
    };

    window.addEventListener('scroll', debouncedScroll);
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      clearTimeout(timeoutId);
    };
  }, [loading, error, id, setScrollPosition]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const result = await getFileContent(token!, id!, mimeType, chapterName);
      setContent(result.content);
      setIsHtmlContent(result.isHtml);
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        logout();
        navigate('/');
      } else {
        setError(err.message || 'Failed to load content.');
      }
    } finally {
      setLoading(false);
    }
  };

  const themeClasses = {
    light: 'bg-[#F9F9FB] text-gray-900',
    dark: 'bg-[#121212] text-gray-300',
    sepia: 'bg-[#F4ECD8] text-[#5B4636]',
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses[theme]}`}>
      {/* Top Bar Overlay */}
      <div className={`fixed top-0 inset-x-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm z-50 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-3xl mx-auto px-2 h-14 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-sm font-medium truncate flex-1 opacity-80">{chapterName}</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="max-w-3xl mx-auto px-6 py-16 min-h-screen cursor-pointer"
        onClick={() => setShowControls(!showControls)}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading content...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">
            <p>{error}</p>
            <button onClick={loadContent} className="mt-4 underline">Try Again</button>
          </div>
        ) : (
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            {isHtmlContent ? (
              <div dangerouslySetInnerHTML={{ __html: content }} className="reader-html-content" />
            ) : (
              <div className="whitespace-pre-wrap font-serif">{content}</div>
            )}
            
            {/* Prev/Next Navigation */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between">
              {prevChapter ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/read/${prevChapter.id}`, { state: { chapterName: prevChapter.name, mimeType: prevChapter.mimeType } });
                  }}
                  className="flex items-center gap-2 px-6 py-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-1 text-left"
                >
                  <ChevronLeft className="w-5 h-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs opacity-60 uppercase tracking-wider font-sans">Previous</div>
                    <div className="font-medium truncate text-sm mt-1">{prevChapter.name}</div>
                  </div>
                </button>
              ) : <div className="flex-1" />}
              
              {nextChapter ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/read/${nextChapter.id}`, { state: { chapterName: nextChapter.name, mimeType: nextChapter.mimeType } });
                  }}
                  className="flex items-center gap-2 px-6 py-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-1 text-right justify-end"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs opacity-60 uppercase tracking-wider font-sans">Next</div>
                    <div className="font-medium truncate text-sm mt-1">{nextChapter.name}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0" />
                </button>
              ) : <div className="flex-1" />}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Overlay */}
      <div className={`fixed bottom-0 inset-x-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-50 transition-transform duration-300 pb-safe ${showControls ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-3xl mx-auto p-4 space-y-6">
          {/* Font Size */}
          <div className="flex items-center gap-4">
            <Type className="w-5 h-5 opacity-50" />
            <input
              type="range"
              min="12"
              max="32"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <Type className="w-7 h-7 opacity-80" />
          </div>

          {/* Theme Selection */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border ${theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <Sun className="w-5 h-5" /> Light
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border ${theme === 'sepia' ? 'border-[#8B6B4A] bg-[#F4ECD8] text-[#5B4636]' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <Coffee className="w-5 h-5" /> Sepia
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border ${theme === 'dark' ? 'border-blue-500 bg-gray-800 text-white' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <Moon className="w-5 h-5" /> Dark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
