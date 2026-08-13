import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Type, Moon, Sun, Coffee, Loader2, AlertCircle, WifiOff, FileQuestion, ArrowLeft, RefreshCw, MessageSquare, Bookmark, Navigation, List, Maximize2 } from 'lucide-react';
import Mark from 'mark.js';
import { useStore } from '../store';
import { getFileContent } from '../lib/drive';
import { detectChapters, ChapterMarker } from '../lib/chapters';
import { formatChapterName } from '../lib/utils';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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
  const { token, logout, fontSize, theme, fontFamily, setFontFamily, setFontSize, setTheme, currentBookChapters, scrollPositions, setScrollPosition, addHighlight, highlights, removeHighlight, updateReadHistory, setChapterCompleted, triggerSyncToDrive, readerTexture, setReaderTexture, customThemes, lineHeight, setLineHeight, recordReadingTime } = useStore();

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
  const [isFocusMode, setIsFocusMode] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const chapterName = formatChapterName(location.state?.chapterName || 'Reading');
  const mimeType = location.state?.mimeType || 'text/plain';
  const bookId = location.state?.bookId;
  const bookName = location.state?.bookName;

  // Find current chapter index for Prev/Next
  const currentIndex = currentBookChapters.findIndex(c => c.id === id);
  const prevChapter = currentIndex > 0 ? currentBookChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex !== -1 && currentIndex < currentBookChapters.length - 1 ? currentBookChapters[currentIndex + 1] : null;

  const cycleTheme = useCallback(() => {
    const allThemeIds = ['light', 'sepia', 'dark', ...customThemes.map(t => t.id)];
    const idx = allThemeIds.indexOf(theme);
    setTheme(allThemeIds[(idx + 1) % allThemeIds.length]);
  }, [theme, setTheme, customThemes]);

  const goToPrevChapter = useCallback(() => {
    if (prevChapter) navigate(`/read/${prevChapter.id}`, { state: { chapterName: prevChapter.name, mimeType: prevChapter.mimeType, bookId, bookName } });
  }, [prevChapter, navigate, bookId, bookName]);

  const goToNextChapter = useCallback(() => {
    if (nextChapter) navigate(`/read/${nextChapter.id}`, { state: { chapterName: nextChapter.name, mimeType: nextChapter.mimeType, bookId, bookName } });
  }, [nextChapter, navigate, bookId, bookName]);

  useKeyboardShortcuts([
    { key: 'F', handler: () => setIsFocusMode(f => !f) },
    { key: 'f', handler: () => setIsFocusMode(f => !f) },
    { key: 'B', handler: () => { if (id) setScrollPosition(id, window.scrollY); } },
    { key: 'b', handler: () => { if (id) setScrollPosition(id, window.scrollY); } },
    { key: 'T', handler: cycleTheme },
    { key: 't', handler: cycleTheme },
    { key: 'ArrowLeft', handler: goToPrevChapter },
    { key: 'ArrowRight', handler: goToNextChapter },
    { key: 'Escape', handler: () => {
      if (showTocDrawer) { setShowTocDrawer(false); return; }
      if (showHighlightsDrawer) { setShowHighlightsDrawer(false); return; }
      if (isFocusMode) { setIsFocusMode(false); return; }
      if (showControls) { setShowControls(false); }
    }},
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      recordReadingTime(1);
    }, 60000);
    return () => clearInterval(timer);
  }, [recordReadingTime]);

  useEffect(() => {
    if (token && id) {
      loadContent();
      setChapterCompleted(id, true);
      // AutoSync will handle this
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
        const latestState = useStore.getState();
        latestState.patchSyncToDrive({
          scrollPositions: latestState.scrollPositions,
          readHistory: latestState.readHistory,
          readingStats: latestState.readingStats,
          completedChapters: latestState.completedChapters
        }).catch(console.error);
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

  const [currentActiveChapter, setCurrentActiveChapter] = useState<string>('');

  // Save scroll position periodically while reading and determine active chapter
  useEffect(() => {
    if (loading || error || !id) return;
    
    const handleScroll = () => {
      setScrollPosition(id, window.scrollY);
    };

    const handleActiveChapter = () => {
      if (detectedChapters.length === 0) return;
      
      // Find the chapter that is currently at the top of the viewport
      let activeId = detectedChapters[0].id;
      for (const chapter of detectedChapters) {
        const el = document.getElementById(chapter.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the element is above or close to the top of the viewport
          if (rect.top <= 100) {
            activeId = chapter.id;
          } else {
            // Once we find a chapter below the top, the previous one is the active one
            break;
          }
        }
      }
      
      const activeChapter = detectedChapters.find(c => c.id === activeId);
      if (activeChapter && activeChapter.title !== currentActiveChapter) {
        setCurrentActiveChapter(activeChapter.title);
      }
    };
    
    // Debounce scroll event for saving position, but run active chapter detection more frequently
    let timeoutId: any;
    const debouncedScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 1000);
      handleActiveChapter();
    };

    window.addEventListener('scroll', debouncedScroll);
    // Initial check
    setTimeout(handleActiveChapter, 500);
    
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      clearTimeout(timeoutId);
    };
  }, [loading, error, id, setScrollPosition, detectedChapters, currentActiveChapter]);

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

  const themeClasses: Record<string, string> = {
    light: 'bg-[#FBF6EC] text-[#3D2B1F]',
    dark: 'bg-[#0F0F0F] text-[#ADADAD]',
    sepia: 'bg-[#F4ECD8] text-[#5B4636]',
  };

  const activeCustomTheme = customThemes.find(t => t.id === theme);
  const currentStyle = activeCustomTheme
    ? { backgroundColor: activeCustomTheme.bg, color: activeCustomTheme.text }
    : undefined;

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${activeCustomTheme ? '' : (themeClasses[theme] || themeClasses.light)} font-sans ${readerTexture !== 'none' ? `texture-${readerTexture}` : ''}`}
      style={currentStyle}
    >
      {/* Top Bar Overlay */}
      <div 
        className={`fixed top-0 inset-x-0 backdrop-blur-md shadow-chip z-50 transition-transform duration-300 ${showControls && !isFocusMode ? 'translate-y-0' : '-translate-y-full'} border-b border-current/15 ${activeCustomTheme ? '' : 'bg-[#FBF6EC]/95 dark:bg-[#0F0F0F]/95'}`}
        style={activeCustomTheme ? { backgroundColor: activeCustomTheme.surface, color: activeCustomTheme.text } : undefined}
      >
        <div className="max-w-3xl mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-[#3D2B1F] dark:text-[#ADADAD] hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <h1 className="font-display text-sm font-bold truncate opacity-90 text-[#3D2B1F] dark:text-[#ADADAD]">{currentActiveChapter || chapterName}</h1>
            {currentActiveChapter && currentActiveChapter !== chapterName && (
              <span className="text-[10px] opacity-70 truncate text-[#6B5645] dark:text-[#888888]">{chapterName}</span>
            )}
          </div>
          {detectedChapters.length > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTocDrawer(true); }} 
              className="p-2 rounded-full text-[#3D2B1F] dark:text-[#ADADAD] hover:bg-black/5 dark:hover:bg-white/10"
              title="Table of Contents"
            >
              <List className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowHighlightsDrawer(true); }} 
            className="p-2 rounded-full text-[#3D2B1F] dark:text-[#ADADAD] hover:bg-black/5 dark:hover:bg-white/10"
            title="Highlights & Notes"
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsFocusMode(f => !f); }}
            className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${isFocusMode ? 'text-[#E8604F]' : 'text-[#3D2B1F] dark:text-[#ADADAD]'}`}
            title="Focus Mode (F)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Subtle bottom chapter indicator when controls are hidden */}
      <div className={`fixed bottom-2 right-4 text-[10px] opacity-40 font-sans truncate max-w-[70%] transition-opacity duration-300 pointer-events-none z-40 ${showControls ? 'opacity-0' : 'opacity-60'}`}>
        {currentActiveChapter || chapterName}
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
          <div className="flex flex-col items-center justify-center py-40 opacity-60 text-[#6B5645]">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#E8604F]" />
            <p className="font-bold">Đang tải nội dung...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-[#E8604F]/10 p-4 rounded-full mb-4">
              {error.includes('Failed to fetch') || error.includes('Network') || !navigator.onLine ? (
                <WifiOff className="w-10 h-10 text-[#E8604F]" />
              ) : error.includes('không được hỗ trợ') || error.includes('not supported') || error.includes('not found') ? (
                <FileQuestion className="w-10 h-10 text-[#E8604F]" />
              ) : (
                <AlertCircle className="w-10 h-10 text-[#E8604F]" />
              )}
            </div>
            <h3 className="text-lg font-bold text-[#3D2B1F] dark:text-[#ADADAD] mb-2">Không thể tải chương sách</h3>
            <p className="text-[#6B5645] dark:text-[#888888] mb-8 max-w-md text-sm">
              {error.includes('Failed to fetch') || error.includes('Network') || !navigator.onLine
                ? "Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại."
                : error.includes('not found')
                ? "Không tìm thấy chương này."
                : error}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto">
              {!(error.includes('không được hỗ trợ') || error.includes('not supported') || error.includes('not found')) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); loadContent(); }} 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E8604F] hover:bg-[#D6503F] text-white rounded-full transition-colors font-bold shadow-chip"
                >
                  <RefreshCw className="w-4 h-4" /> Thử lại
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(-1); }} 
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#E4D9C8] text-[#3D2B1F] rounded-full transition-colors font-bold shadow-chip"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`prose prose-lg max-w-none reader-content-wrapper ${fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight || 1.8 }}
          >
            {/* Chapter Header */}
            <h1 className="font-display text-center font-bold mb-10 pb-4 border-b border-current/20" style={{ fontSize: `${Math.max(22, fontSize * 1.3)}px`, lineHeight: 1.4 }}>
              {chapterName}
            </h1>
            
            <MemoizedContent
              isHtmlContent={isHtmlContent}
              content={content}
              processedContent={processedContent}
              contentRef={contentRef}
            />
            
            {/* Prev/Next Navigation */}
            <div className="mt-16 pt-8 border-t border-[#EFE6D8] dark:border-[#222222] flex flex-col sm:flex-row gap-4 justify-between">
              {prevChapter ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/read/${prevChapter.id}`, { state: { chapterName: prevChapter.name, mimeType: prevChapter.mimeType, bookId, bookName } });
                  }}
                  className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-[#EFE6D8] dark:border-[#222222] hover:border-[#E8604F] transition-all flex-1 text-left shadow-chip"
                >
                  <ChevronLeft className="w-5 h-5 shrink-0 text-[#E8604F]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider font-sans">Chương trước</div>
                    <div className="font-bold truncate text-sm mt-1">{formatChapterName(prevChapter.name)}</div>
                  </div>
                </button>
              ) : <div className="flex-1" />}
              
              {nextChapter ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/read/${nextChapter.id}`, { state: { chapterName: nextChapter.name, mimeType: nextChapter.mimeType, bookId, bookName } });
                  }}
                  className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-[#EFE6D8] dark:border-[#222222] hover:border-[#E8604F] transition-all flex-1 text-right justify-end shadow-chip"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold opacity-60 uppercase tracking-wider font-sans">Chương sau</div>
                    <div className="font-bold truncate text-sm mt-1">{formatChapterName(nextChapter.name)}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0 text-[#E8604F]" />
                </button>
              ) : <div className="flex-1" />}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Overlay */}
      <div 
        className={`fixed bottom-0 inset-x-0 backdrop-blur-md shadow-chip border-t border-current/15 z-50 transition-transform duration-300 pb-safe ${showControls ? 'translate-y-0' : 'translate-y-full'} ${activeCustomTheme ? '' : 'bg-white/95 dark:bg-[#0F0F0F]/95'}`}
        style={activeCustomTheme ? { backgroundColor: activeCustomTheme.surface, color: activeCustomTheme.text } : undefined}
      >
        <div className="max-w-3xl mx-auto p-4 space-y-5">
          
          {/* Font Controls */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-[#F0E7D8] dark:bg-black/40 p-1.5 rounded-full">
              {[
                { id: 'sans', label: 'Sans', fontClass: 'font-sans' },
                { id: 'serif', label: 'Serif', fontClass: 'font-serif' },
                { id: 'mono', label: 'Mono', fontClass: 'font-mono' }
              ].map(font => (
                <button
                  key={font.id}
                  onClick={() => setFontFamily(font.id as any)}
                  className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${fontFamily === font.id ? 'bg-white text-[#E8604F] shadow-chip' : 'text-[#6B5645] dark:text-[#888888] hover:text-[#3D2B1F] dark:hover:text-white'}`}
                >
                  <span className={font.fontClass}>{font.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 px-3">
              <span className="text-xs font-bold opacity-60">A</span>
              <input
                type="range"
                min="12"
                max="32"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 h-2 bg-[#F0E7D8] dark:bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#E8604F]"
              />
              <span className="text-xl font-bold opacity-90">A</span>
            </div>

            {/* Line Height Selector */}
            <div className="flex items-center gap-2 px-3 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 shrink-0">Dòng</span>
              <div className="flex gap-1.5 flex-1">
                {[1.4, 1.6, 1.8, 2.0, 2.2].map(lh => (
                  <button
                    key={lh}
                    onClick={() => setLineHeight(lh)}
                    className={`flex-1 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${lineHeight === lh ? 'bg-[#E8604F] text-white border-[#E8604F]' : 'border-[#E4D9C8] dark:border-[#222222]'}`}
                  >
                    {lh}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-0.5">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${theme === 'light' ? 'border-[#E8604F] bg-[#E8604F]/10 text-[#E8604F]' : 'border-[#E4D9C8] dark:border-[#222222]'}`}
              >
                <Sun className="w-3.5 h-3.5" /> Cozy Paper
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`flex-1 py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${theme === 'sepia' ? 'border-[#8B6B4A] bg-[#F4ECD8] text-[#5B4636]' : 'border-[#E4D9C8] dark:border-[#222222]'}`}
              >
                <Coffee className="w-3.5 h-3.5" /> Sepia
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${theme === 'dark' ? 'border-[#E8604F] bg-[#0F0F0F] text-[#ADADAD]' : 'border-[#E4D9C8] dark:border-[#222222]'}`}
              >
                <Moon className="w-3.5 h-3.5" /> Night
              </button>
            </div>

            {/* Custom Themes list */}
            {customThemes.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 shrink-0">Tùy chỉnh:</span>
                {customThemes.map(ct => (
                  <button
                    key={ct.id}
                    onClick={() => setTheme(ct.id)}
                    style={{ backgroundColor: ct.bg, color: ct.text, borderColor: ct.accent }}
                    className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all cursor-pointer shrink-0 ${theme === ct.id ? 'ring-2 ring-[#E8604F] scale-105 shadow-chip' : 'opacity-80 hover:opacity-100'}`}
                  >
                    🎨 {ct.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Texture + Focus Mode */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B5645] dark:text-[#888888] shrink-0">Texture</span>
            <div className="flex gap-1.5 flex-1">
              {(['none','paper','linen','aged'] as const).map(tx => (
                <button
                  key={tx}
                  onClick={() => setReaderTexture(tx)}
                  className={`flex-1 py-1.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer capitalize ${readerTexture === tx ? 'bg-[#E8604F] text-white border-[#E8604F]' : 'border-[#E4D9C8] dark:border-[#222222] text-[#6B5645] dark:text-[#888888]'}`}
                >
                  {tx === 'none' ? 'Tắt' : tx === 'paper' ? 'Giấy' : tx === 'linen' ? 'Vải' : 'Cũ'}
                </button>
              ))}
            </div>
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
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-2 resize-none outline-none border border-gray-700 focus:border-[#E06B65] transition-colors"
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
                  className="px-3 py-1.5 text-xs font-medium bg-[#E06B65] text-white rounded-lg hover:bg-[#C9534E] transition-colors"
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
            <Bookmark className="w-4 h-4 text-[#E06B65]" />
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
                          className="text-[#E06B65] hover:text-[#C9534E] flex items-center gap-1"
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
            <List className="w-4 h-4 text-[#E06B65]" />
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
