import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useThemeStore } from './store/theme';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import GameDetails from './pages/GameDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

function App() {
  const { initialize: checkAuth } = useAuthStore();
  const { initialize: initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [checkAuth, initTheme]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
        <Header />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Catalog />} />
            <Route path="/games/:id" element={<GameDetails />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route path="/profile/:id" element={<Profile />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
