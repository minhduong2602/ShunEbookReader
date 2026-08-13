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
    // AutoSync will handle this
  };

  const handleEdit = (id: string, currentText: string) => {
    setEditingId(id);
    setEditContent(currentText);
  };

  const saveEdit = () => {
    if (editingId && editContent.trim()) {
      updateQuickNote(editingId, { text: editContent.trim() });
      // AutoSync will handle this
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    removeQuickNote(id);
    // AutoSync will handle this
  };
  
  const togglePin = (id: string, currentPinned?: boolean) => {
    updateQuickNote(id, { pinned: !currentPinned });
    // AutoSync will handle this
  };

  const changeColor = (id: string, color?: string) => {
    updateQuickNote(id, { color });
    // AutoSync will handle this
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
    { name: 'Coral', value: 'bg-[#E8604F]' },
    { name: 'Purple', value: 'bg-[#8D7FC4]' },
    { name: 'Blue', value: 'bg-[#4A7FC1]' },
    { name: 'Amber', value: 'bg-[#EDB65B]' },
    { name: 'Green', value: 'bg-[#7BAA5C]' },
    { name: 'Teal', value: 'bg-[#4FA6A8]' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full -mb-4 font-sans">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20 text-[#6B5645] bg-white border border-[#E4D9C8] rounded-3xl p-8 shadow-chip">
            <p className="font-display text-lg font-bold text-[#3D2B1F]">
              Chưa có ghi chú nào
            </p>
            <p className="text-sm text-[#6B5645] mt-1">Bắt đầu nhập nội dung bên dưới để lưu ghi chú mượt mà!</p>
          </div>
        ) : (
          filteredNotes.map((note, index) => {
            const isEditing = editingId === note.id;
            const oldColors: Record<string, string> = { 'bg-blue-600': 'bg-[#4A7FC1]', 'bg-purple-600': 'bg-[#8D7FC4]', 'bg-emerald-600': 'bg-[#7BAA5C]', 'bg-orange-600': 'bg-[#EDB65B]', 'bg-rose-600': 'bg-[#E8604F]', 'bg-slate-700': 'bg-[#3D2B1F]' };
            const bgClass = oldColors[note.color || ''] || note.color || 'bg-[#E8604F]';
            const links = getLinks(note.text);
            const showPinDivider = index > 0 && filteredNotes[index - 1].pinned && !note.pinned;

            return (
              <React.Fragment key={note.id}>
                {showPinDivider && (
                  <div className="flex items-center gap-4 my-6 opacity-60">
                    <div className="h-px bg-[#EFE6D8] flex-1"></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B5645]">Ghi chú khác</span>
                    <div className="h-px bg-[#EFE6D8] flex-1"></div>
                  </div>
                )}
                <div className="flex justify-end">
                  <div className={`${bgClass} text-white p-4 rounded-2xl rounded-tr-xs w-[88%] sm:max-w-[75%] shadow-chip relative group transition-all hover:shadow-md flex flex-col`}>
                    
                    {note.pinned && (
                      <div className="absolute -top-2 -left-2 bg-[#EDB65B] text-[#3D2B1F] p-1.5 rounded-full shadow-md z-10" title="Ghi chú đã ghim">
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}

                    {isEditing ? (
                      <div className="flex flex-col gap-2 w-full">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-black/20 text-white border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-white outline-none resize-none"
                          rows={4}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="p-1.5 hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={saveEdit} className="p-1.5 hover:bg-black/30 bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm leading-relaxed break-words prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-a:text-white prose-a:underline prose-li:my-0 font-sans">
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

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/20 gap-4">
                          <span className="text-[10px] opacity-80 font-medium tracking-wide">{formatTime(note.timestamp)}</span>
                          
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {/* Color Picker */}
                            <div className="relative group/color">
                              <button className="p-1.5 hover:bg-black/20 rounded-lg transition-colors" title="Đổi màu">
                                <Palette className="w-3.5 h-3.5 opacity-90" />
                              </button>
                              <div className="absolute bottom-full right-0 mb-1 hidden group-hover/color:flex bg-white p-2 rounded-2xl shadow-xl gap-1.5 border border-[#EFE6D8] z-20">
                                {colors.map(c => (
                                  <button
                                    key={c.value}
                                    onClick={() => changeColor(note.id, c.value)}
                                    className={`w-6 h-6 rounded-full ${c.value} border-2 ${bgClass === c.value ? 'border-[#3D2B1F] shadow-inner' : 'border-transparent hover:scale-110'} transition-transform`}
                                    title={c.name}
                                  />
                                ))}
                              </div>
                            </div>

                            <button 
                              onClick={() => togglePin(note.id, note.pinned)}
                              className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
                              title={note.pinned ? "Bỏ ghim" : "Ghim ghi chú"}
                            >
                              <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-current opacity-100' : 'opacity-90'}`} />
                            </button>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(note.text);
                              }}
                              className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
                              title="Sao chép"
                            >
                              <Copy className="w-3.5 h-3.5 opacity-90" />
                            </button>
                            <button 
                              onClick={() => handleEdit(note.id, note.text)}
                              className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <Pencil className="w-3.5 h-3.5 opacity-90" />
                            </button>
                            <button 
                              onClick={() => handleDelete(note.id)}
                              className="p-1.5 hover:bg-black/20 hover:text-red-200 rounded-lg transition-colors"
                              title="Xóa"
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

      <div className="p-4 bg-transparent border-t border-[#EFE6D8] mt-2">
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
            placeholder="Nhập ghi chú hoặc dán liên kết... (Shift+Enter để xuống dòng)"
            className="flex-1 bg-white border border-[#E4D9C8] rounded-2xl px-5 py-3.5 text-sm text-[#3D2B1F] focus:ring-2 focus:ring-[#E8604F]/30 placeholder-[#6B5645] shadow-chip resize-none min-h-[50px] max-h-[150px] outline-none transition-shadow"
            rows={1}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-[#E8604F] hover:bg-[#D6503F] disabled:opacity-50 text-white rounded-full p-3.5 transition-all shrink-0 shadow-chip flex items-center justify-center h-[50px] w-[50px] active:scale-95 cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
