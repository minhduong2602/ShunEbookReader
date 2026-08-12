import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import { useStore } from './store';
import Connect from './pages/Connect';
import Bookshelf from './pages/Bookshelf';
import Book from './pages/Book';
import Reader from './pages/Reader';
import Settings from './pages/Settings';
import { Key } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useStore(state => state.token);
  const folderId = useStore(state => state.folderId);
  if (!token || !folderId) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AutoSync() {
  const { token, scrollPositions, highlights, fontSize, theme, fontFamily, triggerSyncToDrive } = useStore();
  const lastStateRef = useRef<any>(null);

  useEffect(() => {
    if (!token) return;
    
    const currentState = { scrollPositions, highlights, fontSize, theme, fontFamily };
    if (!lastStateRef.current) {
      lastStateRef.current = currentState;
      return; 
    }

    const isChanged = JSON.stringify(currentState) !== JSON.stringify(lastStateRef.current);
    
    if (isChanged) {
      lastStateRef.current = currentState;
      const timeoutId = setTimeout(() => {
        triggerSyncToDrive();
      }, 30000); // 30 second debounce for auto sync
      
      return () => clearTimeout(timeoutId);
    }
  }, [token, scrollPositions, highlights, fontSize, theme, fontFamily, triggerSyncToDrive]);

  return null;
}

function SessionModal() {
  const { isSessionExpired, clientId, setToken, logout } = useStore();

  if (!isSessionExpired) return null;

  const handleReconnect = () => {
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.appdata',
        callback: (response: any) => {
          if (response.access_token) {
            setToken(response.access_token);
          }
        },
      });
      client.requestAccessToken();
    } catch (err) {
      console.error('Google Identity Services error', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600 dark:text-blue-400">
          <Key className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Session Expired</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Your Google Drive session has expired (limit 1 hr). Reconnect to continue exactly where you left off.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleReconnect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Reconnect to Drive
          </button>
          <button
            onClick={logout}
            className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-xl transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AutoSync />
      <SessionModal />
      <Routes>
        <Route path="/" element={<Connect />} />
        <Route path="/bookshelf" element={
          <ProtectedRoute><Bookshelf /></ProtectedRoute>
        } />
        <Route path="/book/:id" element={
          <ProtectedRoute><Book /></ProtectedRoute>
        } />
        <Route path="/read/:id" element={
          <ProtectedRoute><Reader /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><Settings /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/bookshelf" replace />} />
      </Routes>
    </HashRouter>
  );
}
