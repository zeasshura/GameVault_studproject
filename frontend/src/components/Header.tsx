import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Menu,
  X,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Search,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';


const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/games?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
      setMobileOpen(false);
    }
  };

  const navLinks = [
    { to: '/', label: 'Главная', exact: true },
    { to: '/games', label: 'Каталог', exact: false },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive ? 'text-white' : 'hover:text-white'
    }`;

  const activeDot = (isActive: boolean) => isActive
    ? 'relative after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-[var(--accent)]'
    : '';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-14 gap-4">

          {/* Logo */}
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

          {/* Search bar — center, like RAWG */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md relative"
          >
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-dim)' }}
            />
            <input
              id="header-search"
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Поиск игр..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </form>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) =>
                  `${navLinkClass({ isActive })} ${activeDot(isActive)}`
                }
                style={{ color: 'var(--text-muted)' }}
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${navLinkClass({ isActive })} ${activeDot(isActive)}`
                }
                style={{ color: 'var(--text-muted)' }}
              >
                Профиль
              </NavLink>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${navLinkClass({ isActive })} ${activeDot(isActive)} flex items-center gap-1`
                }
                style={{ color: 'var(--text-muted)' }}
              >
                <Shield className="w-3.5 h-3.5" />
                Админка
              </NavLink>
            )}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Theme toggle */}
            <button
              id="theme-toggle"
              onClick={toggle}
              className="p-2 rounded-lg transition-colors hidden sm:block"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
            >
              {isDark ? <Sun className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                       : <Moon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />}
            </button>

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenuOpen((p) => !p)}
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
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-1 w-44 rounded-lg overflow-hidden animate-fade-in z-50"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
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
                          onClick={() => setUserMenuOpen(false)}
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

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-btn"
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Открыть меню"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden animate-fade-in"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          {/* Mobile search */}
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
                onClick={() => setMobileOpen(false)}
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
                onClick={() => setMobileOpen(false)}
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
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${isActive ? 'text-white' : ''}`
                }
                style={{ color: 'var(--text-muted)' }}
              >
                <Shield className="w-4 h-4" /> Админка
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
                  onClick={() => setMobileOpen(false)}
                  className="btn-secondary py-2.5 text-sm"
                >
                  <LogIn className="w-4 h-4" /> Войти
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary py-2.5 text-sm"
                >
                  <UserPlus className="w-4 h-4" /> Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
