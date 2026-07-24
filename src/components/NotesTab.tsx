import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Send, Trash2 } from 'lucide-react';

export default function NotesTab() {
  const { quickNotes, addQuickNote, removeQuickNote, triggerSyncToDrive } = useStore();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleDelete = (id: string) => {
    removeQuickNote(id);
    triggerSyncToDrive();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {quickNotes.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
            <p className="font-medium text-gray-600 dark:text-gray-300">No notes yet.</p>
            <p className="text-sm text-gray-400 mt-1">Start typing below to add a quick note!</p>
          </div>
        ) : (
          quickNotes.map((note) => (
            <div key={note.id} className="flex justify-end">
              <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm relative group">
                <p className="whitespace-pre-wrap text-sm">{note.text}</p>
                <div className="flex items-center justify-between mt-1 pt-1 gap-4 opacity-70">
                  <span className="text-[10px]">{formatTime(note.timestamp)}</span>
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a quick note..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 dark:text-gray-100 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-full p-3 transition-colors shrink-0"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
