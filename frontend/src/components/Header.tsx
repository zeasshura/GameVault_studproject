import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/auth';

import { ThemeToggle } from './header/ThemeToggle';
import { SearchBar } from './header/SearchBar';
import { UserMenu } from './header/UserMenu';
import { MobileMenu } from './header/MobileMenu';
import { DesktopNav } from './header/DesktopNav';

const Header: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Главная', exact: true },
    { to: '/games', label: 'Каталог', exact: false },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-14 gap-4">
          
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              <Gamepad2 className="w-4.5 h-4.5 text-black" style={{ width: 18, height: 18 }} />
            </div>
            <span className="text-base font-bold hidden sm:block" style={{ color: 'var(--text)' }}>
              GameVault
            </span>
          </Link>

          <SearchBar onSearchSubmit={() => setMobileOpen(false)} />

          <DesktopNav navLinks={navLinks} />

          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />

            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    Войти
                  </Link>
                  <Link to="/register" className="btn-primary py-1.5 px-4 text-xs">
                    Регистрация
                  </Link>
                </>
              )}
            </div>

            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMobileOpen((p) => !p)}
              aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <MobileMenu navLinks={navLinks} closeMenu={() => setMobileOpen(false)} />
      )}
    </header>
  );
};

export default Header;
