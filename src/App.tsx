import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Connect from './pages/Connect';
import Bookshelf from './pages/Bookshelf';
import Book from './pages/Book';
import Reader from './pages/Reader';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useStore(state => state.token);
  const folderId = useStore(state => state.folderId);
  if (!token || !folderId) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}
