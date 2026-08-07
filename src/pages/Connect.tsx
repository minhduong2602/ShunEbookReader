import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Key, Loader2 } from 'lucide-react';
import { useStore } from '../store';

export default function Connect() {
  const navigate = useNavigate();
  const { token, folderId, setUserName, setToken, setFolderId } = useStore();
  const [localId, setLocalId] = useState('');
  const [localPassword, setLocalPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token && folderId) {
      navigate('/bookshelf', { replace: true });
    }
  }, [token, folderId, navigate]);

  const handleStart = async () => {
    setError('');
    const trimmedId = localId.trim();
    if (!trimmedId || !localPassword) {
      setError('Vui lòng nhập ID và Mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trimmedId, password: localPassword })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }
      
      setUserName(trimmedId);
      setToken(data.token);
      setFolderId('r2_bookshelf');
      navigate('/bookshelf', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E7DDCE] flex flex-col items-center justify-center p-6 font-sans">
      {/* Background decorative page texture floating card */}
      <div className="w-full max-w-md bg-[#FBF6EC] rounded-[28px] shadow-book p-8 space-y-6 border border-[#E4D9C8]">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto overflow-hidden drop-shadow-md bg-white p-3 rounded-2xl border border-[#EFE6D8] flex items-center justify-center">
            <img src="/icon.png" alt="Novel Reader Logo" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-[#3D2B1F] tracking-tight">
            Cozy Shelf
          </h1>
          <p className="text-[#6B5645] text-sm font-medium">
            Tủ sách câu chuyện ấm áp của bạn. Vui lòng đăng nhập để bắt đầu đọc sách.
          </p>
        </div>

        {error && (
          <div className="bg-[#E8604F]/10 text-[#B54B3C] p-3.5 rounded-2xl text-sm text-center font-bold border border-[#E8604F]/20">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#3D2B1F] flex items-center gap-2">
              <User className="w-4 h-4 text-[#6B5645]" /> Tài khoản ID
            </label>
            <input
              type="text"
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              placeholder="Nhập ID..."
              className="w-full px-4 py-3 bg-[#F0E7D8] border border-transparent rounded-full text-sm text-[#3D2B1F] placeholder-[#6B5645] focus:ring-2 focus:ring-[#E8604F]/30 outline-none transition-all font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStart();
              }}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#3D2B1F] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#6B5645]" /> Mật khẩu
            </label>
            <input
              type="password"
              value={localPassword}
              onChange={(e) => setLocalPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full px-4 py-3 bg-[#F0E7D8] border border-transparent rounded-full text-sm text-[#3D2B1F] placeholder-[#6B5645] focus:ring-2 focus:ring-[#E8604F]/30 outline-none transition-all font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStart();
              }}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full bg-[#E8604F] hover:bg-[#D6503F] disabled:opacity-50 text-white font-bold py-3.5 rounded-full transition-all shadow-chip active:scale-95 flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Mở tủ sách'}
          </button>
        </div>
      </div>
    </div>
  );
}
