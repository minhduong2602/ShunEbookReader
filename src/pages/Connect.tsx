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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto mb-4 overflow-hidden drop-shadow-md">
            <img src="/icon.png" alt="Novel Reader Logo" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Novel Reader</h1>
          <p className="text-gray-500 text-sm">
            Tủ sách cá nhân của bạn. Vui lòng đăng nhập để tiếp tục.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> ID
            </label>
            <input
              type="text"
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              placeholder="Nhập ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStart();
              }}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Key className="w-4 h-4 text-gray-400" /> Mật khẩu
            </label>
            <input
              type="password"
              value={localPassword}
              onChange={(e) => setLocalPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStart();
              }}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
