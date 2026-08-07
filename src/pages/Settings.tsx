import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Loader2, Plus, Trash2, Check, Palette, Layers, Keyboard, LayoutGrid, List, AlignJustify } from 'lucide-react';
import { useStore, CustomTheme, ReaderTexture, BookshelfLayout } from '../store';
import { READER_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import ThemePreview from '../components/ThemePreview';

const TEXTURE_OPTIONS: { value: ReaderTexture; label: string; desc: string }[] = [
  { value: 'none',  label: 'Không',      desc: 'Màu nền thuần' },
  { value: 'paper', label: 'Giấy',       desc: 'Vân giấy nhẹ' },
  { value: 'linen', label: 'Vải linen',  desc: 'Kết cấu sợi vải' },
  { value: 'aged',  label: 'Cũ kỹ',     desc: 'Grained vintage' },
];

const LAYOUT_OPTIONS: { value: BookshelfLayout; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'grid',    label: 'Lưới',      icon: LayoutGrid },
  { value: 'list',    label: 'Danh sách', icon: List },
  { value: 'compact', label: 'Compact',   icon: AlignJustify },
];

const DEFAULT_DRAFT: Omit<CustomTheme, 'id' | 'name'> = {
  bg: '#FBF6EC',
  text: '#3D2B1F',
  accent: '#E8604F',
  surface: '#FFFFFF',
};

export default function Settings() {
  const navigate = useNavigate();
  const {
    userName, setUserName,
    theme, setTheme,
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    logout, readHistory, triggerSyncToDrive, isSyncing, lastSyncedAt,
    // Phase 4
    customThemes, saveCustomTheme, deleteCustomTheme,
    readerTexture, setReaderTexture,
    bookshelfLayout, setBookshelfLayout,
  } = useStore();

  const [saving, setSaving] = useState(false);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [editingTheme, setEditingTheme] = useState<CustomTheme>({
    id: '',
    name: '',
    ...DEFAULT_DRAFT,
  });

  const handleManualSync = async () => {
    setSaving(true);
    await triggerSyncToDrive();
    setSaving(false);
  };

  const openNewThemeEditor = () => {
    setEditingTheme({ id: crypto.randomUUID(), name: '', ...DEFAULT_DRAFT });
    setShowThemeEditor(true);
  };

  const openEditThemeEditor = (t: CustomTheme) => {
    setEditingTheme({ ...t });
    setShowThemeEditor(true);
  };

  const handleSaveTheme = () => {
    if (!editingTheme.name.trim()) return;
    saveCustomTheme(editingTheme);
    setTheme(editingTheme.id);
    setShowThemeEditor(false);
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

        {/* ─── Profile ──────────────────────────────────────────────────── */}
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

        {/* ─── Reading Preferences ──────────────────────────────────────── */}
        <section className="bg-white p-6 rounded-[24px] shadow-chip border border-[#EFE6D8] space-y-6">
          <h2 className="font-display text-lg font-bold text-[#3D2B1F] border-b border-[#EFE6D8] pb-2">Tùy chọn đọc sách</h2>

          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#3D2B1F] uppercase tracking-wider">Phông chữ mặc định</label>
            <div className="flex bg-[#F0E7D8] p-1.5 rounded-full">
              {[
                { id: 'sans',  label: 'Sans',  fontClass: 'font-sans' },
                { id: 'serif', label: 'Serif', fontClass: 'font-serif' },
                { id: 'mono',  label: 'Mono',  fontClass: 'font-mono' }
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
                { id: 'sepia', label: 'Sepia',      bg: 'bg-[#F4ECD8] text-[#5B4636] border-[#E0CDA9]' },
                { id: 'dark',  label: 'Night',      bg: 'bg-[#0F0F0F] text-[#ADADAD] border-[#222222]' }
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

          {/* Font size */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#3D2B1F] uppercase tracking-wider">Cỡ chữ mặc định ({fontSize}px)</label>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold opacity-60">A</span>
              <input
                type="range" min="12" max="32" value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 h-2 bg-[#F0E7D8] rounded-lg appearance-none cursor-pointer accent-[#E8604F]"
              />
              <span className="text-xl font-bold opacity-90">A</span>
            </div>
          </div>

          {/* Reader Texture */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#3D2B1F] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#E8604F]" /> Texture trang đọc
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEXTURE_OPTIONS.map(tx => (
                <button
                  key={tx.value}
                  onClick={() => setReaderTexture(tx.value)}
                  className={`px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    readerTexture === tx.value
                      ? 'border-[#E8604F] bg-[#E8604F]/5 text-[#E8604F]'
                      : 'border-[#EFE6D8] bg-[#F9F5EE] text-[#6B5645]'
                  }`}
                >
                  <p className="text-xs font-bold">{tx.label}</p>
                  <p className="text-[10px] opacity-70">{tx.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Phase 4.1: Theme Engine ──────────────────────────────────── */}
        <section className="bg-white p-6 rounded-[24px] shadow-chip border border-[#EFE6D8] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFE6D8] pb-2">
            <h2 className="font-display text-lg font-bold text-[#3D2B1F] flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#E8604F]" /> Theme tuỳ chỉnh
            </h2>
            <button
              onClick={openNewThemeEditor}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#E8604F] text-white rounded-full text-xs font-bold shadow-chip hover:bg-[#D6503F] active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo mới
            </button>
          </div>

          {customThemes.length === 0 ? (
            <div className="text-center py-6 text-[#6B5645] text-sm">
              <Palette className="w-10 h-10 mx-auto opacity-30 mb-2 text-[#E8604F]" />
              <p className="font-semibold">Chưa có theme tuỳ chỉnh nào</p>
              <p className="text-xs opacity-70 mt-1">Tạo theme với màu nền, chữ và accent của riêng bạn.</p>
            </div>
          ) : (
            <div className="flex gap-4 flex-wrap">
              {customThemes.map(t => (
                <div key={t.id} className="flex flex-col items-center">
                  <ThemePreview
                    theme={t}
                    isActive={theme === t.id}
                    onSelect={() => setTheme(t.id)}
                    onDelete={() => deleteCustomTheme(t.id)}
                  />
                  <button
                    onClick={() => openEditThemeEditor(t)}
                    className="mt-1.5 text-[11px] font-bold text-[#E8604F] hover:underline cursor-pointer"
                  >
                    ✏️ Sửa
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Theme Editor Inline Panel */}
          {showThemeEditor && (
            <div className="mt-4 p-4 bg-[#F9F5EE] rounded-2xl border border-[#EFE6D8] space-y-4 animate-fade-in">
              <h3 className="font-bold text-sm text-[#3D2B1F]">
                {customThemes.find(t => t.id === editingTheme.id) ? 'Chỉnh sửa theme' : 'Tạo theme mới'}
              </h3>

              {/* Name */}
              <input
                type="text"
                placeholder="Tên theme (vd: Đêm xanh)"
                value={editingTheme.name}
                onChange={e => setEditingTheme(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-white border border-[#EFE6D8] rounded-full text-sm focus:ring-2 focus:ring-[#E8604F]/30 outline-none"
              />

              {/* Color pickers */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'bg',      label: 'Nền trang' },
                  { key: 'text',    label: 'Màu chữ' },
                  { key: 'accent',  label: 'Accent (nút)' },
                  { key: 'surface', label: 'Surface (card)' },
                ] as { key: keyof Omit<CustomTheme,'id'|'name'>; label: string }[]).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-[#EFE6D8] shadow-chip group-hover:border-[#E8604F]/50 transition-colors">
                      <input
                        type="color"
                        value={editingTheme[key]}
                        onChange={e => setEditingTheme(prev => ({ ...prev, [key]: e.target.value }))}
                        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: editingTheme[key] }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#3D2B1F]">{label}</p>
                      <p className="text-[10px] text-[#6B5645] font-mono">{editingTheme[key]}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Preview */}
              <div>
                <p className="text-[10px] font-bold text-[#6B5645] uppercase tracking-wider mb-2">Preview</p>
                <ThemePreview theme={editingTheme} size="md" />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveTheme}
                  disabled={!editingTheme.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#E8604F] hover:bg-[#D6503F] text-white font-bold text-xs rounded-full shadow-chip disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Lưu theme
                </button>
                <button
                  onClick={() => setShowThemeEditor(false)}
                  className="px-5 py-2.5 bg-[#F0E7D8] text-[#6B5645] font-bold text-xs rounded-full hover:bg-[#EFE6D8] active:scale-95 transition-all cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ─── Phase 4.3: Bookshelf Layout ─────────────────────────────── */}
        <section className="bg-white p-6 rounded-[24px] shadow-chip border border-[#EFE6D8] space-y-4">
          <h2 className="font-display text-lg font-bold text-[#3D2B1F] border-b border-[#EFE6D8] pb-2">Bố cục thư viện</h2>
          <div className="grid grid-cols-3 gap-3">
            {LAYOUT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setBookshelfLayout(value)}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  bookshelfLayout === value
                    ? 'border-[#E8604F] bg-[#E8604F]/5 text-[#E8604F]'
                    : 'border-[#EFE6D8] bg-[#F9F5EE] text-[#6B5645]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-bold">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ─── Phase 4.4: Keyboard Shortcuts ───────────────────────────── */}
        <section className="bg-white p-6 rounded-[24px] shadow-chip border border-[#EFE6D8] space-y-4">
          <h2 className="font-display text-lg font-bold text-[#3D2B1F] border-b border-[#EFE6D8] pb-2 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#E8604F]" /> Phím tắt (trong Reader)
          </h2>
          <div className="space-y-2">
            {READER_SHORTCUTS.map((s) => (
              <div key={s.key} className="flex items-center justify-between py-2 border-b border-[#F5EFE3] last:border-0">
                <span className="text-sm text-[#6B5645]">{s.description}</span>
                <kbd className="px-2.5 py-1 bg-[#F0E7D8] text-[#3D2B1F] font-mono font-bold text-xs rounded-lg border border-[#E4D9C8] shadow-xs min-w-[32px] text-center">
                  {s.label}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Sync Status ──────────────────────────────────────────────── */}
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
