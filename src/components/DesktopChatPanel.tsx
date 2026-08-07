import React, { useState } from 'react';
import { StickyNote, Plus, Trash2, X } from 'lucide-react';
import { useStore } from '../store';

interface DesktopChatPanelProps {
  onClose?: () => void;
  isCollapsible?: boolean;
}

export const DesktopChatPanel: React.FC<DesktopChatPanelProps> = ({
  onClose,
  isCollapsible = false
}) => {
  const { quickNotes, addQuickNote, removeQuickNote, triggerSyncToDrive } = useStore();
  const [newNote, setNewNote] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addQuickNote({
      id: crypto.randomUUID(),
      text: newNote.trim(),
      timestamp: Date.now()
    });
    setNewNote('');
    triggerSyncToDrive().catch(console.error);
  };

  const handleRemove = (noteId: string) => {
    removeQuickNote(noteId);
    triggerSyncToDrive().catch(console.error);
  };

  return (
    <aside className="w-full lg:w-[360px] xl:w-[380px] h-full bg-[#FBF6EC] border-l border-[#EFE6D8] flex flex-col shrink-0 shadow-xs">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-white border-b border-[#EFE6D8] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8604F]/10 text-[#E8604F] flex items-center justify-center font-bold">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#3D2B1F] leading-tight">
              Ghi chú đọc sách
            </h2>
            <p className="text-xs text-[#6B5645] font-medium">Lưu suy nghĩ & trích dẫn cá nhân ({quickNotes?.length || 0})</p>
          </div>
        </div>

        {isCollapsible && onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B5645] hover:bg-[#F0E7D8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden p-4">
        {/* Notes scroll list */}
        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
          {(!quickNotes || quickNotes.length === 0) ? (
            <div className="text-center py-16 text-[#6B5645] space-y-2">
              <StickyNote className="w-12 h-12 mx-auto opacity-30 text-[#E8604F]" />
              <p className="text-sm font-semibold text-[#3D2B1F]">Chưa có ghi chú nào</p>
              <p className="text-xs opacity-75 max-w-xs mx-auto">Thêm suy nghĩ, cảm nhận hoặc trích dẫn hay trong lúc đọc sách vào đây!</p>
            </div>
          ) : (
            quickNotes.map((note) => (
              <div key={note.id} className="p-4 rounded-2xl bg-white border border-[#EFE6D8] shadow-chip space-y-2 relative group hover:border-[#E8604F]/30 transition-all">
                <p className="text-xs sm:text-sm font-medium text-[#3D2B1F] leading-relaxed whitespace-pre-wrap">{note.text}</p>
                <div className="flex items-center justify-between pt-1 border-t border-[#EFE6D8]/60 text-[10px] text-[#6B5645]">
                  <span>{new Date(note.timestamp).toLocaleString('vi-VN')}</span>
                  <button
                    onClick={() => handleRemove(note.id)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Xóa ghi chú"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Viết ghi chú nhanh mới..."
            className="flex-1 bg-white text-[#3D2B1F] placeholder-[#6B5645] text-xs sm:text-sm px-4 py-3 rounded-full border border-[#EFE6D8] shadow-xs outline-none focus:ring-2 focus:ring-[#E8604F]/30 transition-shadow"
          />
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="px-5 py-3 bg-[#E8604F] hover:bg-[#D6503F] disabled:opacity-50 text-white text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer shadow-chip flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </form>
      </div>
    </aside>
  );
};

export default DesktopChatPanel;
