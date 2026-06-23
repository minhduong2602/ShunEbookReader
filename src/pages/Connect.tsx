import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Folder, Key } from 'lucide-react';
import { useStore } from '../store';

export default function Connect() {
  const navigate = useNavigate();
  const { token, folderId, clientId, setToken, setFolderId, setClientId } = useStore();
  const [localClientId, setLocalClientId] = useState(clientId || '');
  const [localFolderId, setLocalFolderId] = useState(folderId || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && folderId) {
      navigate('/bookshelf', { replace: true });
    }
  }, [token, folderId, navigate]);

  const isPreConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_DRIVE_FOLDER_ID);
  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false);

  useEffect(() => {
    if (isPreConfigured && !token && !hasAttemptedAutoConnect && !error) {
      setHasAttemptedAutoConnect(true);
      // Optional: Auto-trigger connect if it's completely rigid but standard OAuth needs user action
      // We will let the user click instead of throwing popup arbitrarily.
    }
  }, [isPreConfigured, token, hasAttemptedAutoConnect, error]);

  const handleConnect = () => {
    setError('');
    if (!localClientId) {
      setError('Google Client ID is required');
      return;
    }
    if (!localFolderId) {
      setError('Drive Folder ID is required');
      return;
    }

    setClientId(localClientId);
    setFolderId(localFolderId);

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: localClientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.appdata',
        callback: (response: any) => {
          if (response.error) {
            setError(response.error_description || 'Failed to authenticate');
            return;
          }
          if (response.access_token) {
            setToken(response.access_token);
            navigate('/bookshelf', { replace: true });
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      setError('Google Identity Services not loaded. Please check your Client ID or refresh.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Drive Reader</h1>
          <p className="text-gray-500 text-sm">
            {isPreConfigured ? 'Your app is pre-configured. Click connect to proceed.' : 'Connect your Google Drive folder to start reading'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!isPreConfigured && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Google Client ID
                </label>
                <input
                  type="text"
                  value={localClientId}
                  onChange={(e) => setLocalClientId(e.target.value)}
                  placeholder="123456789-abc...apps.googleusercontent.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-400">Needs 'drive.readonly' and 'drive.appdata' scopes</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Folder className="w-4 h-4" /> Bookshelf Folder ID
                </label>
                <input
                  type="text"
                  value={localFolderId}
                  onChange={(e) => setLocalFolderId(e.target.value)}
                  placeholder="1A2b3C4d5E6f7G8h9I0j"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-400">The ID from your Google Drive folder URL</p>
              </div>
            </>
          )}

          <button
            onClick={handleConnect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Connect to Drive
          </button>
        </div>
      </div>
    </div>
  );
}
