import React, { useState } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, Plus, StickyNote, X } from 'lucide-react';
import { useStore } from '../store';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  suggestedBooks?: { id: string; title: string; author: string }[];
}

interface DesktopChatPanelProps {
  onClose?: () => void;
  isCollapsible?: boolean;
}

export const DesktopChatPanel: React.FC<DesktopChatPanelProps> = ({
  onClose,
  isCollapsible = false
}) => {
  const { userName, quickNotes, addQuickNote } = useStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [inputText, setInputText] = useState('');
  const [newNote, setNewNote] = useState('');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Xin chào ${userName || 'bạn'}! Tôi là trợ lý Cozy Shelf. Hôm nay bạn muốn đọc thể loại sách nào?`,
      time: '10:00'
    },
    {
      id: '2',
      sender: 'user',
      text: 'Gợi ý cho tôi vài cuốn sách hay về khoa học viễn tưởng hoặc kỹ năng.',
      time: '10:01'
    },
    {
      id: '3',
      sender: 'bot',
      text: 'Dưới đây là một số tựa sách phổ biến trong tủ sách của bạn:',
      time: '10:01',
      suggestedBooks: [
        { id: '1', title: 'Đắc Nhân Tâm', author: 'Dale Carnegie' },
        { id: '2', title: 'Nhà Giả Kim', author: 'Paulo Coelho' }
      ]
    }
  ]);

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Simulate friendly Cozy Assistant reply
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `Cảm ơn bạn đã hỏi! Tôi đã ghi nhận thông tin: "${trimmed}". Bạn có thể xem thêm trong phần ghi chú tủ sách.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addQuickNote(newNote.trim());
    setNewNote('');
  };

  return (
    <aside className="w-full lg:w-[360px] xl:w-[380px] h-full bg-[#FBF6EC] border-l border-[#EFE6D8] flex flex-col shrink-0 shadow-xs">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-white border-b border-[#EFE6D8] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8604F]/10 text-[#E8604F] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#3D2B1F] leading-tight">
              Cozy Assistant
            </h2>
            <p className="text-xs text-[#6B5645] font-medium">Trợ lý & Ghi chú đọc sách</p>
          </div>
        </div>

        {isCollapsible && onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B5645] hover:bg-[#F0E7D8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 flex gap-2 border-b border-[#EFE6D8] bg-[#FBF6EC]">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white text-[#E8604F] shadow-chip'
              : 'text-[#6B5645] hover:text-[#3D2B1F]'
          }`}
        >
          <Bot className="w-4 h-4" />
          Trò chuyện
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-white text-[#E8604F] shadow-chip'
              : 'text-[#6B5645] hover:text-[#3D2B1F]'
          }`}
        >
          <StickyNote className="w-4 h-4" />
          Ghi chú nhanh ({quickNotes?.length || 0})
        </button>
      </div>

      {/* Content Body */}
      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages scroll area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-[#E8604F] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[82%] space-y-2`}>
                  {/* Chat bubble */}
                  <div 
                    className={`p-3.5 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#8D7FC4] text-white rounded-2xl rounded-br-xs shadow-chip font-sans'
                        : 'bg-white text-[#3D2B1F] border border-[#E4D9C8] rounded-2xl rounded-bl-xs shadow-chat font-sans'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Suggested book thumbnails inside bot message */}
                    {msg.suggestedBooks && (
                      <div className="mt-3 pt-2 border-t border-[#EFE6D8] space-y-2">
                        {msg.suggestedBooks.map(b => (
                          <div 
                            key={b.id}
                            className="flex items-center gap-2 p-2 rounded-xl bg-[#FBF6EC] hover:bg-[#F0E7D8] transition-colors cursor-pointer"
                          >
                            <div className="w-7 h-9 rounded bg-[#E8604F] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#3D2B1F] truncate">{b.title}</p>
                              <p className="text-[11px] text-[#B54B3C] truncate">{b.author}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`block text-[10px] text-[#6B5645] ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#3D2B1F] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <form 
            onSubmit={handleSendChat}
            className="p-3 bg-white border-t border-[#EFE6D8] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-[#F0E7D8] text-[#3D2B1F] placeholder-[#6B5645] text-sm px-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-[#E8604F]/30 transition-shadow"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full bg-[#E8604F] hover:bg-[#D6503F] disabled:opacity-50 text-white flex items-center justify-center transition-transform active:scale-95 shrink-0 shadow-chip cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-hidden p-4">
          <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
            {(!quickNotes || quickNotes.length === 0) ? (
              <div className="text-center py-12 text-[#6B5645] space-y-2">
                <StickyNote className="w-10 h-10 mx-auto opacity-30 text-[#E8604F]" />
                <p className="text-sm font-semibold">Chưa có ghi chú nào</p>
                <p className="text-xs opacity-75">Thêm ghi chú suy nghĩ hoặc trích dẫn sách vào đây!</p>
              </div>
            ) : (
              quickNotes.map((note, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white border border-[#EFE6D8] shadow-chip space-y-1">
                  <p className="text-xs font-semibold text-[#3D2B1F] leading-relaxed">{note.text}</p>
                  <p className="text-[10px] text-[#6B5645]">{new Date(note.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Thêm ghi chú nhanh..."
              className="flex-1 bg-[#F0E7D8] text-[#3D2B1F] placeholder-[#6B5645] text-xs px-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-[#E8604F]/30"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#E8604F] hover:bg-[#D6503F] text-white text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer shadow-chip"
            >
              Thêm
            </button>
          </form>
        </div>
      )}
    </aside>
  );
};

export default DesktopChatPanel;
