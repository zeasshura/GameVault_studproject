import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, LogOut, LogIn, UserPlus, Shield, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useThemeStore } from '../../store/theme';

interface MobileMenuProps {
  navLinks: Array<{ to: string; label: string; exact: boolean }>;
  closeMenu: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ navLinks, closeMenu }) => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/games?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
      closeMenu();
    }
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  return (
    <div
      className="md:hidden animate-fade-in"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      <form onSubmit={handleSearch} className="px-4 py-3 relative">
        <Search
          className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--text-dim)' }}
        />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Поиск игр..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
      </form>

      <div className="px-4 pb-4 flex flex-col gap-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.exact}
            onClick={closeMenu}
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-white' : ''
              }`
            }
            style={{ color: 'var(--text-muted)' }}
          >
            {link.label}
          </NavLink>
        ))}
        {isAuthenticated && (
          <NavLink
            to="/profile"
            onClick={closeMenu}
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'text-white' : ''}`
            }
            style={{ color: 'var(--text-muted)' }}
          >
            Профиль
          </NavLink>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <NavLink
            to="/admin"
            onClick={closeMenu}
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${isActive ? 'text-white' : ''}`
            }
            style={{ color: 'var(--text-muted)' }}
          >
            <Shield className="w-4 h-4" /> Панель админа
          </NavLink>
        )}
        
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Тема</span>
          <button
            onClick={toggle}
            className="p-2 rounded-lg transition-colors bg-white/5"
            style={{ color: 'var(--text)' }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
        
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
            style={{ color: 'var(--red)' }}
          >
            <LogOut className="w-4 h-4" /> Выйти
          </button>
        ) : (
          <div className="flex flex-col gap-2 pt-1">
            <Link
              to="/login"
              onClick={closeMenu}
              className="btn-secondary py-2.5 text-sm"
            >
              <LogIn className="w-4 h-4" /> Войти
            </Link>
            <Link
              to="/register"
              onClick={closeMenu}
              className="btn-primary py-2.5 text-sm"
            >
              <UserPlus className="w-4 h-4" /> Регистрация
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
