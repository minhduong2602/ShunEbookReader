import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { Send, Trash2, Search, Pin, Pencil, Check, X, Palette, ExternalLink, Link as LinkIcon, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setData(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) return (
    <div className="bg-black/20 p-2 rounded-lg text-xs flex items-center gap-2.5 animate-pulse">
      <div className="w-12 h-12 bg-white/20 rounded-md shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/20 rounded w-3/4"></div>
        <div className="h-2 bg-white/20 rounded w-1/2"></div>
      </div>
    </div>
  );

  if (!data || !data.title) return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="bg-black/20 hover:bg-black/30 p-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors overflow-hidden">
      <div className="bg-white/20 p-1.5 rounded-md shrink-0"><LinkIcon className="w-3.5 h-3.5" /></div>
      <span className="truncate flex-1 font-medium opacity-90">{url}</span>
    </a>
  );

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="bg-black/20 hover:bg-black/30 flex overflow-hidden rounded-lg transition-colors border border-white/10 group">
      {data.image && (
        <div className="w-20 sm:w-24 shrink-0 border-r border-white/10 relative overflow-hidden bg-white/5">
          <img src={data.image} alt={data.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
        </div>
      )}
      <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-center">
        <span className="text-xs font-bold truncate opacity-100">{data.title}</span>
        {data.description && <span className="text-[10px] line-clamp-2 opacity-75 mt-0.5 leading-snug">{data.description}</span>}
        <span className="text-[9px] opacity-50 mt-1 uppercase tracking-wider flex items-center gap-1">
          <LinkIcon className="w-2.5 h-2.5" /> {data.siteName || new URL(url).hostname}
        </span>
      </div>
    </a>
  );
}

export default function NotesTab() {
  const { quickNotes, addQuickNote, removeQuickNote, updateQuickNote, triggerSyncToDrive } = useStore();
  const [text, setText] = useState('');
      const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new note is added and not searching
  useEffect(() => {
    if (!editingId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [quickNotes.length, editingId]);

  // Filtering and sorting
  const filteredNotes = useMemo(() => {
    let filtered = quickNotes;
    // Sort: pinned first, then chronological
    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.timestamp - b.timestamp;
    });
  }, [quickNotes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    addQuickNote({
      id: crypto.randomUUID(),
      text: text.trim(),
      timestamp: Date.now()
    });
    setText('');
    triggerSyncToDrive();
  };

  const handleEdit = (id: string, currentText: string) => {
    setEditingId(id);
    setEditContent(currentText);
  };

  const saveEdit = () => {
    if (editingId && editContent.trim()) {
      updateQuickNote(editingId, { text: editContent.trim() });
      triggerSyncToDrive();
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    removeQuickNote(id);
    triggerSyncToDrive();
  };
  
  const togglePin = (id: string, currentPinned?: boolean) => {
    updateQuickNote(id, { pinned: !currentPinned });
    triggerSyncToDrive();
  };

  const changeColor = (id: string, color?: string) => {
    updateQuickNote(id, { color });
    triggerSyncToDrive();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const getLinks = (text: string) => {
    const matches = text.match(urlRegex) || [];
    return Array.from(new Set(matches));
  };

  const colors = [
    { name: 'Coral', value: 'bg-[#E06B65]' },
    { name: 'Sage', value: 'bg-[#5B8C7B]' },
    { name: 'Slate', value: 'bg-[#7B95B1]' },
    { name: 'Golden', value: 'bg-[#D1A054]' },
    { name: 'Mauve', value: 'bg-[#9F838C]' },
    { name: 'Olive', value: 'bg-[#4A5D23]' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full -mb-4">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white/50 border border-white/60 rounded-3xl p-8 shadow-sm">
            <p className="font-medium text-gray-600 dark:text-gray-300">
              "No notes yet."
            </p>
            <p className="text-sm text-gray-400 mt-1">Start typing below to add a quick note!</p>
          </div>
        ) : (
          filteredNotes.map((note, index) => {
            const isEditing = editingId === note.id;
            const oldColors: Record<string, string> = { 'bg-blue-600': 'bg-[#E06B65]', 'bg-purple-600': 'bg-[#9F838C]', 'bg-emerald-600': 'bg-[#5B8C7B]', 'bg-orange-600': 'bg-[#D1A054]', 'bg-rose-600': 'bg-[#E06B65]', 'bg-slate-700': 'bg-[#7B95B1]' };
            const bgClass = oldColors[note.color || ''] || note.color || 'bg-[#E06B65]';
            const links = getLinks(note.text);
            const showPinDivider = index > 0 && filteredNotes[index - 1].pinned && !note.pinned;

            return (
              <React.Fragment key={note.id}>
                {showPinDivider && (
                  <div className="flex items-center gap-4 my-6 opacity-60">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Unpinned Notes</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                )}
                <div className="flex justify-end">
                  <div className={`${bgClass} text-white p-3 rounded-2xl rounded-tr-sm w-[85%] sm:max-w-[75%] shadow-sm relative group transition-colors flex flex-col`}>
                    
                    {note.pinned && (
                      <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 p-1.5 rounded-full shadow-md z-10" title="Pinned Note">
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}

                    {isEditing ? (
                      <div className="flex flex-col gap-2 w-full">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-black/20 text-white border-none rounded-lg p-2 text-sm focus:ring-1 focus:ring-white resize-none"
                          rows={4}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="p-1.5 hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={saveEdit} className="p-1.5 hover:bg-black/30 bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm leading-relaxed break-words prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-a:text-white prose-a:underline prose-li:my-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {note.text}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Link Previews */}
                        {links.length > 0 && (
                          <div className="mt-3 flex flex-col gap-1.5">
                            {links.map((link, i) => (
                              <LinkPreview key={i} url={link} />
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20 gap-4">
                          <span className="text-[10px] opacity-80 font-medium tracking-wide">{formatTime(note.timestamp)}</span>
                          
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {/* Color Picker */}
                            <div className="relative group/color">
                              <button className="p-1.5 hover:bg-black/20 rounded-lg transition-colors" title="Change Color">
                                <Palette className="w-3.5 h-3.5 opacity-90" />
                              </button>
                              <div className="absolute bottom-full right-0 mb-1 hidden group-hover/color:flex bg-white p-2 rounded-xl shadow-xl gap-1.5 border border-gray-100 border-gray-100 z-20">
                                {colors.map(c => (
                                  <button
                                    key={c.value}
                                    onClick={() => changeColor(note.id, c.value)}
                                    className={`w-6 h-6 rounded-full ${c.value} border-2 ${bgClass === c.value ? 'border-gray-900 border-gray-900 shadow-inner' : 'border-transparent hover:scale-110'} transition-transform`}
                                    title={c.name}
                                  />
                                ))}
                              </div>
                            </div>

                            <button 
                              onClick={() => togglePin(note.id, note.pinned)}
                              className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
                              title={note.pinned ? "Unpin Note" : "Pin Note"}
                            >
                              <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-current opacity-100' : 'opacity-90'}`} />
                            </button>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(note.text);
                                // could add local toast here but keeping it simple for now
                              }}
                              className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
                              title="Copy Note"
                            >
                              <Copy className="w-3.5 h-3.5 opacity-90" />
                            </button>
                            <button 
                              onClick={() => handleEdit(note.id, note.text)}
                              className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
                              title="Edit Note"
                            >
                              <Pencil className="w-3.5 h-3.5 opacity-90" />
                            </button>
                            <button 
                              onClick={() => handleDelete(note.id)}
                              className="p-1.5 hover:bg-black/20 hover:text-red-200 rounded-lg transition-colors"
                              title="Delete Note"
                            >
                              <Trash2 className="w-3.5 h-3.5 opacity-90" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-transparent border-t border-gray-200/60 mt-4">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type a quick note or paste a link... (Shift+Enter for newline)"
            className="flex-1 bg-white border border-gray-100 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#E06B65]/30 placeholder-gray-500 shadow-sm resize-none min-h-[50px] max-h-[150px] outline-none"
            rows={1}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-[#E06B65] hover:bg-[#C9534E] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl p-3.5 transition-colors shrink-0 shadow-sm flex items-center justify-center h-[50px]"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
