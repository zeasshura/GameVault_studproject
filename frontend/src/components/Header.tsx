import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Moon,
  Sun,
  Menu,
  X,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Scroll detection for header style
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
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

  const navLinks = [
    { to: '/', label: 'Главная', exact: true },
    { to: '/games', label: 'Каталог', exact: false },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-1 py-0.5 text-sm font-medium transition-colors duration-200
    after:absolute after:bottom-0 after:left-0 after:h-0.5 after:rounded-full
    after:transition-all after:duration-300
    ${
      isActive
        ? 'text-primary-400 after:w-full after:bg-primary-400'
        : 'text-gray-400 hover:text-primary-300 after:w-0 hover:after:w-full after:bg-primary-400'
    }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass border-b border-white/10 shadow-xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={() => setMobileOpen(false)}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/40 transition-shadow duration-300">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:block">GameVault</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.exact} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <NavLink to="/profile" className={navLinkClass}>
                Профиль
              </NavLink>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass}>
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Админка
                </span>
              </NavLink>
            )}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              id="theme-toggle"
              onClick={toggle}
              className="p-2 rounded-xl text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all duration-200"
              aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                      {user?.username?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-300 max-w-[100px] truncate">
                      {user?.username}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 glass shadow-xl rounded-xl overflow-hidden animate-fade-in">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-primary-500/10 hover:text-primary-300 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Профиль
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-primary-500/10 hover:text-primary-300 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Панель админа
                        </Link>
                      )}
                      <div className="border-t border-white/10" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary py-2 px-4 text-sm">
                    <LogIn className="w-4 h-4" />
                    Войти
                  </Link>
                  <Link to="/register" className="btn-primary py-2 px-4 text-sm">
                    <UserPlus className="w-4 h-4" />
                    Регистрация
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              id="mobile-menu-btn"
              className="md:hidden p-2 rounded-xl text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Открыть меню"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden glass border-t border-white/10 animate-fade-in">
          <div className="section-container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-300'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <NavLink
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-300'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`
                }
              >
                Профиль
              </NavLink>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-300'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`
                }
              >
                <Shield className="w-4 h-4" />
                Админка
              </NavLink>
            )}
            <div className="border-t border-white/10 mt-2 pt-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-secondary py-2.5 text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    Войти
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary py-2.5 text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
