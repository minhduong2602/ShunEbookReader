import { useState, useEffect, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, LogOut, Loader2, Folder as FolderIcon, Download, Clock, Settings, FileText, List, Upload, MessageSquare, CheckCircle2, Circle, ArrowUpDown, LayoutGrid, Search, Home, ArrowUpRight, Menu, X as XIcon } from 'lucide-react';
import { useStore } from '../store';
import { getFolders, DriveFile } from '../lib/drive';
import UploadModal from '../components/UploadModal';
import NotesTab from '../components/NotesTab';

const getGradientClasses = (name: string) => {
  const gradients = [
    'from-[#E06B65] to-[#C9534E]', // Red/Coral
    'from-[#5B8C7B] to-[#457060]', // Sage Green
    'from-[#7B95B1] to-[#5C7896]', // Slate Blue
    'from-[#D1A054] to-[#B5853B]', // Golden
    'from-[#9F838C] to-[#80656D]', // Mauve
    'from-[#4A5D23] to-[#364515]', // Olive
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export default function Bookshelf() {
  const navigate = useNavigate();
  const { token, folderId, logout, loadSyncFromDrive, readHistory, userName, completedBooks, toggleBookCompleted, triggerSyncToDrive, quickNotes } = useStore();
  const [books, setBooks] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'books' | 'recent' | 'notes'>(
    (localStorage.getItem('reader_active_tab') as any) || 'recent'
  );
  const [sortBy, setSortBy] = useState<'newest' | 'name'>(
    (localStorage.getItem('reader_sort_by') as any) || 'newest'
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [r2Status, setR2Status] = useState<{r2: boolean, message: string} | null>(null);

  useEffect(() => {
    localStorage.setItem('reader_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('reader_sort_by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    
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

  const sortedBooks = [...books]
    .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = a.updatedAt || 0;
        const timeB = b.updatedAt || 0;
        if (timeA !== timeB) return timeB - timeA;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      }
    });

  const handleToggleBookRead = (e: MouseEvent, bookId: string) => {
    e.stopPropagation();
    toggleBookCompleted(bookId);
    triggerSyncToDrive().catch(console.error);
  };

  const NavItem = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button 
      onClick={(e) => { onClick(e); setIsSidebarOpen(false); }}
      className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all ${
        isActive 
          ? 'bg-[#FDF3F2] text-[#E06B65] font-bold shadow-sm' 
          : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'
      }`}
    >
      <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-[#E06B65]' : 'text-gray-400'}`} />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex overflow-hidden">
      {/* Sidebar */}
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 flex-shrink-0 border-r border-gray-200/60 flex flex-col justify-between py-8 px-4 h-screen overflow-y-auto bg-[#F7F5F0] transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="space-y-12">
          {/* Logo */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="Logo" className="w-10 h-10 drop-shadow-sm" />
              <span className="font-serif text-2xl font-bold leading-none text-gray-900 tracking-tight">Novel<br/>Reader</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 md:hidden rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            <NavItem icon={Home} label="Home" isActive={activeTab === 'recent'} onClick={() => setActiveTab('recent')} />
            <NavItem icon={FolderIcon} label="Library" isActive={activeTab === 'books'} onClick={() => setActiveTab('books')} />
            <NavItem icon={MessageSquare} label="Notes" isActive={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
            <div className="my-4 border-t border-gray-200/60"></div>
            <NavItem icon={Settings} label="Settings" isActive={false} onClick={() => navigate('/settings')} />
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3">
           <button 
             onClick={() => setIsUploadOpen(true)}
             className="flex items-center justify-center gap-2 p-4 w-full bg-[#E06B65] hover:bg-[#C9534E] text-white rounded-2xl transition-all shadow-md active:scale-95"
           >
             <Upload className="w-5 h-5" />
             <span className="font-semibold">Upload</span>
           </button>
           <button 
             onClick={handleLogoutClick}
             className="flex items-center justify-center gap-2 p-4 w-full text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-95"
           >
             <LogOut className="w-5 h-5" />
             <span className="font-medium">Log out</span>
           </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-12 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Top bar */}
                    <div className="mb-12 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="md:hidden font-serif text-xl font-bold leading-none text-gray-900 tracking-tight">Novel Reader</div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0 ml-auto">
              {activeTab !== 'notes' && (
                isSearchExpanded || searchQuery ? (
                  <div className="relative w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-300">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search book name, author..." 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (activeTab === 'recent') setActiveTab('books');
                      }}
                      autoFocus
                      onBlur={() => {
                        if (!searchQuery) setIsSearchExpanded(false);
                      }}
                      className="w-full sm:w-80 md:w-96 bg-white pl-12 pr-10 py-3 rounded-full border border-gray-100 shadow-sm focus:ring-2 focus:ring-[#E06B65]/30 outline-none text-gray-700 transition-shadow"
                    />
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchExpanded(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsSearchExpanded(true)}
                    className="p-3 bg-white border border-gray-100 shadow-sm rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )
              )}
              {deferredPrompt && (
                <button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Install
                </button>
              )}
            </div>
          </div>

          {r2Status && !r2Status.r2 && (
             <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl text-sm flex items-start gap-3 mb-8">
               <span className="shrink-0 mt-0.5">⚠️</span>
               <div>
                 <p className="font-semibold mb-1">Cảnh báo đồng bộ Cloudflare R2 (Sync Warning)</p>
                 <p className="opacity-90 leading-relaxed">
                   {r2Status.message} Ứng dụng hiện đang hiển thị các tệp lưu trữ tạm thời trên Local Storage.
                 </p>
               </div>
             </div>
          )}

          {activeTab === 'notes' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-140px)]">
              <NotesTab />
            </div>
          ) : activeTab === 'recent' ? (
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-12 items-start">
              
              {/* Left Column (Main Home Content) */}
              <div>
                 <div className="mb-16">
                   <h1 className="text-5xl md:text-6xl font-serif text-gray-900 mb-6 leading-tight tracking-tight">Happy reading,<br /> {userName}</h1>
                   <p className="text-gray-600 mb-8 max-w-lg leading-relaxed text-base">
                     Wow! you've delved deep into the books. Let's explore new chapters today and finish your reading list. Get reading now!
                   </p>
                   {readHistory.length > 0 && (
                     <button 
                       onClick={() => {
                         const lastRead = readHistory[0];
                         if(lastRead.lastChapterId) {
                           navigate(`/read/${lastRead.lastChapterId}`, { 
                             state: { 
                               chapterName: lastRead.lastChapterName, 
                               mimeType: lastRead.lastChapterId.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain', 
                               bookId: lastRead.bookId, 
                               bookName: lastRead.bookName 
                             }
                           });
                         } else {
                           navigate(`/book/${lastRead.bookId}`, { state: { bookName: lastRead.bookName }});
                         }
                       }}
                       className="bg-[#2D2D2D] hover:bg-black text-white px-8 py-3.5 rounded-full flex items-center gap-2 font-medium transition-colors shadow-xl shadow-black/10 active:scale-95 w-max"
                     >
                       Start reading <ArrowUpRight className="w-4 h-4" />
                     </button>
                   )}
                 </div>

                 <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-serif font-bold text-gray-900">Popular Now</h2>
                 </div>
                 
                 {readHistory.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border border-white/60">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-gray-600">No recently read books.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
                      {readHistory.map((entry, idx) => {
                         const book = books.find(b => b.id === entry.bookId);
                         return (
                           <div key={entry.bookId} className="group cursor-pointer" onClick={() => navigate(`/book/${entry.bookId}`, { state: { bookName: entry.bookName }})}>
                              <div className={`aspect-[2/3] w-full rounded-md shadow-[8px_8px_16px_rgba(0,0,0,0.1)] group-hover:shadow-[12px_12px_24px_rgba(0,0,0,0.15)] group-hover:-translate-y-2 transition-all relative overflow-hidden flex flex-col justify-end p-4 bg-gradient-to-br ${getGradientClasses(entry.bookName)} mb-4`}>
                                 <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                 <div className="z-10 w-full mt-auto">
                                    <h2 className="font-serif font-bold text-white leading-tight text-xl break-words drop-shadow-md">
                                      {entry.bookName}
                                    </h2>
                                 </div>
                              </div>
                              <h3 className="font-bold text-gray-900 truncate mb-1 px-1 font-serif text-base">{entry.bookName}</h3>
                              <p className="text-xs text-gray-500 truncate px-1 font-sans">
                                {entry.lastChapterName || 'Start reading'}
                              </p>
                           </div>
                         );
                      })}
                    </div>
                 )}
              </div>

              {/* Right Sidebar (Step 3 Content) */}
              <div className="hidden xl:flex flex-col gap-10 sticky top-0 pl-4 border-l border-gray-200/60 min-h-screen pt-4">
                 
                 {/* Currently Reading */}
                 <div>
                   {readHistory.length > 0 && (
                     <>
                        {(() => {
                           const lastRead = readHistory[0];
                           const book = books.find(b => b.id === lastRead.bookId);
                           return (
                             <div className="flex flex-col">
                               <div className={`w-full aspect-[4/3] rounded-2xl shadow-xl shadow-black/10 relative overflow-hidden flex flex-col justify-center items-center p-6 bg-gradient-to-br ${getGradientClasses(lastRead.bookName)} mb-6 -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-pointer`} onClick={() => navigate(`/book/${lastRead.bookId}`, { state: { bookName: lastRead.bookName }})}>
                                 <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                                 <div className="w-[140px] aspect-[2/3] bg-white rounded-md shadow-2xl flex flex-col p-4 relative z-10 rotate-3">
                                   <div className="flex-1 bg-gray-50 rounded-sm border border-gray-100 flex items-center justify-center p-2 text-center overflow-hidden">
                                      <span className="font-serif font-bold text-gray-800 text-sm leading-tight line-clamp-4">{lastRead.bookName}</span>
                                   </div>
                                 </div>
                               </div>
                               <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2 leading-tight">{lastRead.bookName}</h2>
                               <p className="text-sm font-medium text-[#E06B65] mb-3">Currently Reading</p>
                               <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                                 {lastRead.lastChapterName ? `You left off at ${lastRead.lastChapterName}. Jump back in to continue the journey.` : 'Ready to start reading this novel?'}
                               </p>
                             </div>
                           )
                        })()}
                     </>
                   )}
                 </div>



                 {/* Recent Notes (Replacing Reader Friends) */}
                 <div>
                   <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Recent Notes</h3>
                   {quickNotes && quickNotes.length > 0 ? (
                     <div className="flex flex-col gap-4">
                       {quickNotes.slice().sort((a,b) => b.timestamp - a.timestamp).slice(0, 3).map(note => (
                         <div key={note.id} className="flex gap-4">
                           <div className="w-10 h-10 rounded-full bg-[#FDF3F2] text-[#E06B65] flex items-center justify-center shrink-0 border border-[#E06B65]/20">
                             <MessageSquare className="w-4 h-4" />
                           </div>
                           <div>
                             <p className="font-bold text-gray-900 text-sm mb-1">You</p>
                             <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{note.text}</p>
                             <p className="text-[10px] text-gray-400 mt-1 font-medium">{new Date(note.timestamp).toLocaleDateString()}</p>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-gray-500 text-sm">No recent notes.</div>
                   )}
                 </div>

              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-serif font-bold text-gray-900">Your Library</h2>
                <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                  <button
                    onClick={() => setSortBy('newest')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      sortBy === 'newest' ? 'bg-[#F7F5F0] text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" /> Recent
                  </button>
                  <button
                    onClick={() => setSortBy('name')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      sortBy === 'name' ? 'bg-[#F7F5F0] text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    A-Z
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#E06B65]" />
                  <p className="font-medium">Loading your books...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-100">
                  <p>{error}</p>
                  <button onClick={loadBooks} className="mt-2 text-sm font-semibold hover:underline">Try Again</button>
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <FolderIcon className="w-16 h-16 mx-auto mb-6 opacity-20 text-[#E06B65]" />
                  <p className="font-serif text-2xl font-bold text-gray-900 mb-2">Your Bookshelf is empty</p>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">Upload your first novel to start reading and build your personal collection!</p>
                  <button 
                    onClick={() => setIsUploadOpen(true)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#E06B65] hover:bg-[#C9534E] text-white font-bold rounded-full transition-all shadow-lg shadow-[#E06B65]/30 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Novel Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                  {sortedBooks.map((book, index) => {
                    const isRead = completedBooks[book.id];
                    const isReading = !isRead && readHistory.some(h => h.bookId === book.id);
                    return (
                      <div
                        key={book.id}
                        onClick={() => navigate(`/book/${book.id}`, { state: { bookName: book.name } })}
                        className="group cursor-pointer flex flex-col h-full"
                      >
                        <div className={`aspect-[2/3] w-full rounded-md shadow-[6px_6px_12px_rgba(0,0,0,0.08)] group-hover:shadow-[12px_12px_24px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 transition-all relative overflow-hidden flex flex-col justify-between p-4 bg-gradient-to-br ${getGradientClasses(book.name)} mb-4`}>
                          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                          
                          <div className="flex justify-between items-start z-10 w-full opacity-90 text-white text-[10px] font-semibold uppercase tracking-wider">
                            <div className="flex flex-col drop-shadow-md">
                              <span>{isRead ? 'Read' : isReading ? 'Reading' : 'Unread'}</span>
                            </div>
                            <button
                              onClick={(e) => handleToggleBookRead(e, book.id)}
                              className="p-1.5 hover:scale-110 transition-transform -mt-1.5 -mr-1.5 bg-black/10 rounded-full backdrop-blur-md"
                              title={isRead ? 'Bỏ đánh dấu đã đọc' : isReading ? 'Đang đọc (click để đánh dấu đã đọc)' : 'Đánh dấu đã đọc'}
                            >
                              {isRead ? (
                                <CheckCircle2 className="w-4 h-4 text-white drop-shadow-md" />
                              ) : isReading ? (
                                <Clock className="w-4 h-4 text-white/90 drop-shadow-md" />
                              ) : (
                                <Circle className="w-4 h-4 text-white/70 hover:text-white drop-shadow-md" />
                              )}
                            </button>
                          </div>

                          <div className="z-10 w-full mt-auto">
                            <h2 className={`font-serif font-bold text-white leading-tight ${book.name.length > 20 ? 'text-lg' : 'text-xl'} break-words drop-shadow-md ${isRead ? 'opacity-50 line-through' : ''}`}>
                              {book.name}
                            </h2>
                          </div>
                        </div>
                        
                        <div className="px-1 mt-auto">
                          <h3 className={`font-bold text-gray-900 truncate mb-0.5 font-serif ${isRead ? 'line-through text-gray-400' : ''}`}>{book.name}</h3>
                          <p className="text-xs text-gray-500 font-sans">
                            {book.updatedAt ? new Date(book.updatedAt).toLocaleDateString() : 'New'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

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
