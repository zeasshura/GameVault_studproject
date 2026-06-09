import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, Gamepad2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/auth';
import LoadingSpinner from '../components/LoadingSpinner';

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  password2?: string;
  general?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<FormErrors>({});

  useEffect(() => { document.title = 'Регистрация — GameVault'; }, []);
  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!username.trim() || username.length < 3) e.username = 'Минимум 3 символа';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = 'Некорректный email';
    if (!password || password.length < 8) e.password = 'Минимум 8 символов';
    if (password !== password2) e.password2 = 'Пароли не совпадают';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setErrors({});
    try {
      await authApi.register({ username, email, password, password2 });
      navigate('/login', { state: { registered: true } });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: Record<string, string[]> } };
      if (apiErr.response?.data) {
        const d = apiErr.response.data;
        setErrors({
          username: d.username?.[0], email: d.email?.[0],
          password: d.password?.[0], password2: d.password2?.[0],
          general: d.non_field_errors?.[0] ?? d.detail?.[0],
        });
      } else {
        setErrors({ general: 'Ошибка регистрации. Попробуйте ещё раз.' });
      }
    } finally { setLoading(false); }
  };

  const fieldBorder = (field: keyof FormErrors) =>
    errors[field] ? { borderColor: 'var(--red)' } : {};

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
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
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Создайте бесплатный аккаунт</p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-3.5" id="register-form">

            {/* Username */}
            <div>
              <label htmlFor="reg-username" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Имя пользователя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="gamer2024"
                  className="input-field pl-10"
                  style={fieldBorder('username')}
                  autoComplete="username"
                />
              </div>
              {errors.username && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  style={fieldBorder('email')}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  className="input-field pl-10 pr-10"
                  style={fieldBorder('password')}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-dim)' }} id="toggle-password-reg">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reg-password2" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Подтвердите пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-dim)' }} />
                <input
                  id="reg-password2"
                  type={showPassword2 ? 'text' : 'password'}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Повторите пароль"
                  className="input-field pl-10 pr-10"
                  style={fieldBorder('password2')}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword2(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-dim)' }} id="toggle-password2-reg">
                  {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password2 && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.password2}</p>}
            </div>

            {errors.general && (
              <div className="text-xs px-3 py-2.5 rounded-lg animate-fade-in"
                style={{ background: 'rgba(255,85,85,0.1)', color: 'var(--red)', border: '1px solid rgba(255,85,85,0.2)' }}>
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              id="register-submit-btn"
              disabled={loading}
              className="btn-primary w-full py-3 mt-1"
            >
              {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
              Создать аккаунт
            </button>
          </form>

          <div className="mt-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" id="go-to-login" className="font-semibold" style={{ color: 'var(--accent)' }}>
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
