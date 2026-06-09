import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, Gamepad2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/auth';
import LoadingSpinner from '../components/LoadingSpinner';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, setUser, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { document.title = 'Войти — GameVault'; }, []);
  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Заполните все поля'); return; }
    setLoading(true);
    try {
      const tokens = await authApi.login({ email, password });
      login(tokens);
      const user = await authApi.getMe();
      setUser(user);
      navigate('/');
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-sm animate-slide-up">

        {/* Logo header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: 'var(--accent)' }}
          >
            <Gamepad2 className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>GameVault</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Войдите в свой аккаунт</p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">

            <div>
              <label htmlFor="login-email" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-dim)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                  aria-label={showPassword ? 'Скрыть' : 'Показать'}
                  id="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-xs px-3 py-2.5 rounded-lg animate-fade-in"
                style={{ background: 'rgba(255,85,85,0.1)', color: 'var(--red)', border: '1px solid rgba(255,85,85,0.2)' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? <LoadingSpinner size="sm" /> : <LogIn className="w-4 h-4" />}
              Войти
            </button>
          </form>

          <div className="mt-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Нет аккаунта?{' '}
            <Link
              to="/register"
              id="go-to-register"
              className="font-semibold transition-colors"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
