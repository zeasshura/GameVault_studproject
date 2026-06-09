import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, User, Shield, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
        style={{ background: 'var(--bg-card)' }}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-black text-xs font-bold flex-shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          {user?.username?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <span className="text-sm font-medium max-w-[80px] truncate" style={{ color: 'var(--text)' }}>
          {user?.username}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-44 rounded-lg overflow-hidden animate-fade-in z-50"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <User className="w-4 h-4" /> Профиль
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Shield className="w-4 h-4" /> Панель админа
            </Link>
          )}
          <div style={{ borderTop: '1px solid var(--border)' }} />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors"
            style={{ color: 'var(--red)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut className="w-4 h-4" /> Выйти
          </button>
        </div>
      )}
    </div>
  );
};
