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
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
          <button onClick={() => { logout(); navigate('/', { replace: true }); }} className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-8 mt-4">
        {/* Profile */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Profile</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Display Name</label>
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="text-sm text-gray-500 mt-2">
            <p>Books Read: {readHistory.length}</p>
          </div>
        </section>

        {/* Reading Preferences */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Default Reading Preferences</h2>
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Default Font Family</label>
            <div className="flex bg-gray-100 p-1.5 rounded-xl">
              {[
                { id: 'sans', label: 'Sans' },
                { id: 'serif', label: 'Serif' },
                { id: 'mono', label: 'Mono' }
              ].map(font => (
                <button
                  key={font.id}
                  onClick={() => setFontFamily(font.id as any)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${fontFamily === font.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <span className={`font-${font.id}`}>{font.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Reading Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light', bg: 'bg-white text-gray-900 border-gray-200' },
                { id: 'sepia', label: 'Sepia', bg: 'bg-[#f4ecd8] text-[#5b4636] border-[#e0cda9]' },
                { id: 'dark', label: 'Dark', bg: 'bg-gray-900 text-gray-100 border-gray-800' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`py-3 rounded-xl border ${t.bg} transition-transform active:scale-95 flex flex-col items-center justify-center gap-1 ${theme === t.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                >
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

        </section>

        {/* Sync Status */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Sync</h2>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <p>Last synced: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Never'}</p>
              {isSyncing && <p className="text-blue-500">Syncing in background...</p>}
            </div>
            <button 
              onClick={handleManualSync} 
              disabled={saving || isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sync Now'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
