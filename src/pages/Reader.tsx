import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Type, Moon, Sun, Coffee, Loader2, AlertCircle, WifiOff, FileQuestion, ArrowLeft, RefreshCw, MessageSquare, Bookmark, Navigation, List } from 'lucide-react';
import Mark from 'mark.js';
import { useStore } from '../store';
import { getFileContent } from '../lib/drive';
import { detectChapters, ChapterMarker } from '../lib/chapters';
import { formatChapterName } from '../lib/utils';

const MemoizedContent = memo(({ 
  isHtmlContent, 
  content, 
  processedContent,
  contentRef
}: { 
  isHtmlContent: boolean; 
  content: string; 
  processedContent: string;
  contentRef: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <div ref={contentRef}>
      {isHtmlContent ? (
        <div dangerouslySetInnerHTML={{ __html: processedContent || content }} className="reader-html-content" />
      ) : (
        <div 
          dangerouslySetInnerHTML={{ __html: processedContent || content }} 
          className="whitespace-pre-wrap" 
        />
      )}
    </div>
  );
});

export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout, fontSize, theme, fontFamily, setFontFamily, setFontSize, setTheme, currentBookChapters, scrollPositions, setScrollPosition, addHighlight, highlights, removeHighlight, updateReadHistory } = useStore();

  const [content, setContent] = useState('');
  const [processedContent, setProcessedContent] = useState('');
  const [detectedChapters, setDetectedChapters] = useState<ChapterMarker[]>([]);
  const [isHtmlContent, setIsHtmlContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showControls, setShowControls] = useState(false);
  const [showTocDrawer, setShowTocDrawer] = useState(false);
  
  // Highlights state
  const [selectionPopup, setSelectionPopup] = useState<{ text: string; rect: DOMRect; } | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFD54F');
  const [showHighlightsDrawer, setShowHighlightsDrawer] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const chapterName = formatChapterName(location.state?.chapterName || 'Reading');
  const mimeType = location.state?.mimeType || 'text/plain';
  const bookId = location.state?.bookId;
  const bookName = location.state?.bookName;

  // Find current chapter index for Prev/Next
  const currentIndex = currentBookChapters.findIndex(c => c.id === id);
  const prevChapter = currentIndex > 0 ? currentBookChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex !== -1 && currentIndex < currentBookChapters.length - 1 ? currentBookChapters[currentIndex + 1] : null;

  useEffect(() => {
    if (token && id) {
      loadContent();
      if (bookId && bookName) {
        updateReadHistory({
          bookId,
          bookName,
          lastChapterId: id,
          lastChapterName: location.state?.chapterName,
        });
      }
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

  // Handle text selection for highlights
  useEffect(() => {
    const handleSelection = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0 && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionPopup({
            text: selection.toString().trim(),
            rect,
          });
        } else {
          if (!showNoteInput) {
            setSelectionPopup(null);
          }
        }
      }, 10);
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [showNoteInput]);

  // Apply highlights using mark.js
  useEffect(() => {
    if (loading || error || !id || !contentRef.current) return;

    const markInstance = new Mark(contentRef.current);
    
    // Clear existing marks first
    markInstance.unmark({
      done: () => {
        const chapterHighlights = highlights[id] || [];
        chapterHighlights.forEach(h => {
          markInstance.mark(h.text, {
            className: `highlight-mark highlight-${h.id}`,
            acrossElements: true,
            separateWordSearch: false,
            each: (element) => {
              (element as HTMLElement).style.backgroundColor = h.color;
              (element as HTMLElement).style.color = '#000'; // Ensure text is readable
            }
          });
        });
      }
    });

    return () => {
      markInstance.unmark();
    };
  }, [loading, error, id, highlights, content]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const result = await getFileContent(token!, id!, mimeType, chapterName);
      setContent(result.content);
      setIsHtmlContent(result.isHtml);
      
      // Detect chapters and process content
      const { processedContent: newContent, chapters } = detectChapters(result.content, result.isHtml);
      setProcessedContent(newContent);
      setDetectedChapters(chapters);
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        useStore.getState().setSessionExpired(true);
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
          {detectedChapters.length > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTocDrawer(true); }} 
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              title="Table of Contents"
            >
              <List className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowHighlightsDrawer(true); }} 
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            title="Highlights & Notes"
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="max-w-3xl mx-auto px-6 py-16 min-h-screen cursor-pointer"
        onClick={() => {
          if (window.getSelection()?.toString().trim()) return;
          setShowControls(!showControls);
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading content...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
              {error.includes('Failed to fetch') || error.includes('Network') || !navigator.onLine ? (
                <WifiOff className="w-10 h-10 text-red-500 dark:text-red-400" />
              ) : error.includes('không được hỗ trợ') || error.includes('not supported') || error.includes('not found') ? (
                <FileQuestion className="w-10 h-10 text-red-500 dark:text-red-400" />
              ) : (
                <AlertCircle className="w-10 h-10 text-red-500 dark:text-red-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Failed to load chapter</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
              {error.includes('Failed to fetch') || error.includes('Network') || !navigator.onLine
                ? "Network error. Please check your internet connection and try again."
                : error.includes('not found')
                ? "This chapter could not be found. It may have been deleted or moved."
                : error}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto">
              {!(error.includes('không được hỗ trợ') || error.includes('not supported') || error.includes('not found')) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); loadContent(); }} 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(-1); }} 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl transition-colors font-medium shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`prose prose-lg max-w-none dark:prose-invert ${fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            <MemoizedContent
              isHtmlContent={isHtmlContent}
              content={content}
              processedContent={processedContent}
              contentRef={contentRef}
            />
            
            {/* Prev/Next Navigation */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between">
              {prevChapter ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/read/${prevChapter.id}`, { state: { chapterName: prevChapter.name, mimeType: prevChapter.mimeType, bookId, bookName } });
                  }}
                  className="flex items-center gap-2 px-6 py-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-1 text-left"
                >
                  <ChevronLeft className="w-5 h-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs opacity-60 uppercase tracking-wider font-sans">Previous</div>
                    <div className="font-medium truncate text-sm mt-1">{formatChapterName(prevChapter.name)}</div>
                  </div>
                </button>
              ) : <div className="flex-1" />}
              
              {nextChapter ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/read/${nextChapter.id}`, { state: { chapterName: nextChapter.name, mimeType: nextChapter.mimeType, bookId, bookName } });
                  }}
                  className="flex items-center gap-2 px-6 py-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-1 text-right justify-end"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs opacity-60 uppercase tracking-wider font-sans">Next</div>
                    <div className="font-medium truncate text-sm mt-1">{formatChapterName(nextChapter.name)}</div>
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
          
          {/* Font Controls */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
              {[
                { id: 'sans', label: 'Sans', fontClass: 'font-sans' },
                { id: 'serif', label: 'Serif', fontClass: 'font-serif' },
                { id: 'mono', label: 'Mono', fontClass: 'font-mono' }
              ].map(font => (
                <button
                  key={font.id}
                  onClick={() => setFontFamily(font.id as any)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${fontFamily === font.id ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                >
                  <span className={font.fontClass}>{font.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 px-2">
              <span className="text-sm font-medium opacity-50">A</span>
              <input
                type="range"
                min="12"
                max="32"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xl font-medium opacity-80">A</span>
            </div>
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
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border text-[#a6c6ff] ${theme === 'sepia' ? 'border-[#8B6B4A] bg-[#F4ECD8]' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <Coffee className="w-5 h-5" /> Sepia
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border text-[#a6c6ff] ${theme === 'dark' ? 'border-blue-500 bg-gray-800' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <Moon className="w-5 h-5" /> Dark
            </button>
          </div>
        </div>
      </div>

      {/* Selection Popup */}
      {selectionPopup && (
        <div 
          className="fixed z-[100] flex flex-col gap-2 p-2 bg-gray-900 text-white rounded-xl shadow-xl animate-in fade-in zoom-in duration-200"
          style={{
            top: Math.max(10, selectionPopup.rect.top - (showNoteInput ? 120 : 60)),
            left: Math.max(10, Math.min(window.innerWidth - (showNoteInput ? 220 : 180), selectionPopup.rect.left + selectionPopup.rect.width / 2 - 90)),
          }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
        >
          {showNoteInput ? (
            <div className="flex flex-col gap-2 w-48">
              <textarea
                autoFocus
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-2 resize-none outline-none border border-gray-700 focus:border-blue-500 transition-colors"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setShowNoteInput(false);
                    setNoteText('');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    addHighlight(id!, {
                      id: Date.now().toString(),
                      text: selectionPopup.text,
                      note: noteText,
                      color: selectedColor,
                      timestamp: Date.now(),
                      chapterName
                    });
                    setSelectionPopup(null);
                    setShowNoteInput(false);
                    setNoteText('');
                    window.getSelection()?.removeAllRanges();
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {['#FFD54F', '#81C784', '#64B5F6', '#E57373'].map(color => (
                <button
                  key={color}
                  onClick={() => {
                    addHighlight(id!, {
                      id: Date.now().toString(),
                      text: selectionPopup.text,
                      color: color,
                      timestamp: Date.now(),
                      chapterName
                    });
                    setSelectionPopup(null);
                    window.getSelection()?.removeAllRanges();
                  }}
                  className="w-8 h-8 rounded-full border-2 border-transparent hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="w-px h-6 bg-gray-700 mx-1" />
              <button 
                onClick={() => setShowNoteInput(true)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
                title="Add Note"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Highlights Drawer */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-[110] transform transition-transform duration-300 flex flex-col ${showHighlightsDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
          <h2 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-blue-500" />
            Notes & Highlights
          </h2>
          <button onClick={() => setShowHighlightsDrawer(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.entries(highlights).filter(([_, list]) => list.length > 0).map(([chapterId, list]) => (
            <div key={chapterId} className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-gray-400" />
                {list[0].chapterName}
              </h3>
              {list.map(h => (
                <div key={h.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-sm group relative">
                  <div className="flex gap-3 items-start mb-2">
                    <div className="w-1 h-full min-h-[1.5rem] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: h.color }} />
                    <p className="text-gray-700 dark:text-gray-300 italic line-clamp-4 leading-relaxed">"{h.text}"</p>
                  </div>
                  {h.note && (
                    <div className="mt-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      {h.note}
                    </div>
                  )}
                  <div className="mt-3 text-[10px] text-gray-400 flex justify-between items-center">
                    <span>{new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {chapterId === id && (
                        <button 
                          onClick={() => {
                            const el = document.querySelector(`.highlight-${h.id}`);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              setShowHighlightsDrawer(false);
                            }
                          }}
                          className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3" /> Jump
                        </button>
                      )}
                      <button 
                        onClick={() => removeHighlight(chapterId, h.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {Object.values(highlights).flat().length === 0 && (
            <div className="text-center text-gray-500 mt-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Type className="w-5 h-5 opacity-50" />
              </div>
              <p>No highlights yet.</p>
              <p className="text-xs opacity-70">Select text while reading to add notes.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* TOC Drawer */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-[110] transform transition-transform duration-300 flex flex-col ${showTocDrawer ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
          <h2 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <List className="w-4 h-4 text-blue-500" />
            Table of Contents
          </h2>
          <button onClick={() => setShowTocDrawer(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {detectedChapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => {
                const el = document.getElementById(chapter.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setShowTocDrawer(false);
                }
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-sm text-gray-700 dark:text-gray-300 truncate"
            >
              {chapter.title}
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop for drawers */}
      {(showHighlightsDrawer || showTocDrawer) && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[105] backdrop-blur-sm transition-opacity"
          onClick={() => {
            setShowHighlightsDrawer(false);
            setShowTocDrawer(false);
          }}
        />
      )}
    </div>
  );
}
