import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Loader2 } from 'lucide-react';
import { useStore } from '../store';

export default function Settings() {
  const navigate = useNavigate();
  const { 
    userName, setUserName, 
    theme, setTheme, 
    fontFamily, setFontFamily, 
    fontSize, setFontSize,
    logout, readHistory, triggerSyncToDrive, isSyncing, lastSyncedAt 
  } = useStore();

  const [saving, setSaving] = useState(false);

  const handleManualSync = async () => {
    setSaving(true);
    await triggerSyncToDrive();
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#FBF6EC] text-[#3D2B1F] pb-24 font-sans">
      <header className="bg-white/90 backdrop-blur-md shadow-chip sticky top-0 z-10 border-b border-[#EFE6D8]">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 text-[#6B5645] hover:text-[#3D2B1F] hover:bg-[#F0E7D8] rounded-full transition-colors cursor-pointer">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="font-display text-xl font-bold text-[#3D2B1F]">Cài đặt Cozy Shelf</h1>
          </div>
          <button onClick={() => { logout(); navigate('/', { replace: true }); }} className="flex items-center gap-2 text-xs font-bold text-[#B54B3C] bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition-colors cursor-pointer">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-6 mt-2">
        {/* Profile */}
        <section className="bg-white p-6 rounded-[24px] shadow-chip border border-[#EFE6D8] space-y-4">
          <h2 className="font-display text-lg font-bold text-[#3D2B1F] border-b border-[#EFE6D8] pb-2">Tài khoản & Hồ sơ</h2>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#3D2B1F] uppercase tracking-wider">Tên hiển thị</label>
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 bg-[#F0E7D8] border border-transparent rounded-full text-sm text-[#3D2B1F] focus:ring-2 focus:ring-[#E8604F]/30 outline-none font-medium transition-all"
            />
          </div>
          <div className="text-xs font-medium text-[#6B5645] pt-1">
            <p>Số sách đã đọc: {readHistory.length} cuốn</p>
          </div>
        </section>

        {/* Reading Preferences */}
        <section className="bg-white p-6 rounded-[24px] shadow-chip border border-[#EFE6D8] space-y-6">
          <h2 className="font-display text-lg font-bold text-[#3D2B1F] border-b border-[#EFE6D8] pb-2">Tùy chọn đọc sách</h2>
          
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#3D2B1F] uppercase tracking-wider">Phông chữ mặc định</label>
            <div className="flex bg-[#F0E7D8] p-1.5 rounded-full">
              {[
                { id: 'sans', label: 'Sans', fontClass: 'font-sans' },
                { id: 'serif', label: 'Serif', fontClass: 'font-serif' },
                { id: 'mono', label: 'Mono', fontClass: 'font-mono' }
              ].map(font => (
                <button
                  key={font.id}
                  onClick={() => setFontFamily(font.id as any)}
                  className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${fontFamily === font.id ? 'bg-white shadow-chip text-[#E8604F]' : 'text-[#6B5645] hover:text-[#3D2B1F]'}`}
                >
                  <span className={font.fontClass}>{font.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#3D2B1F] uppercase tracking-wider">Giao diện đọc sách</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Cozy Paper', bg: 'bg-[#FBF6EC] text-[#3D2B1F] border-[#E4D9C8]' },
                { id: 'sepia', label: 'Sepia', bg: 'bg-[#F4ECD8] text-[#5B4636] border-[#E0CDA9]' },
                { id: 'dark', label: 'Night', bg: 'bg-[#2B2119] text-[#F5EFE3] border-[#3D2B1F]' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`py-3 rounded-2xl border ${t.bg} transition-transform active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer ${theme === t.id ? 'ring-2 ring-[#E8604F]' : ''}`}
                >
                  <span className="text-xs font-bold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

        </section>

        {/* Sync Status */}
        <section className="bg-white p-6 rounded-[24px] shadow-chip border border-[#EFE6D8] space-y-4">
          <h2 className="font-display text-lg font-bold text-[#3D2B1F] border-b border-[#EFE6D8] pb-2">Đồng bộ đám mây</h2>
          <div className="flex items-center justify-between">
            <div className="text-xs text-[#6B5645]">
              <p>Lần đồng bộ gần nhất: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('vi-VN') : 'Chưa có'}</p>
              {isSyncing && <p className="text-[#E8604F] font-bold mt-1">Đang đồng bộ trong nền...</p>}
            </div>
            <button 
              onClick={handleManualSync} 
              disabled={saving || isSyncing}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#E8604F] hover:bg-[#D6503F] text-white font-bold text-xs rounded-full transition-all shadow-chip disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đồng bộ ngay'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
