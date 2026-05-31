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

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    document.title = 'Регистрация — GameVault';
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!username.trim() || username.length < 3) {
      newErrors.username = 'Имя пользователя должно содержать не менее 3 символов';
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Введите корректный email';
    }
    if (!password || password.length < 8) {
      newErrors.password = 'Пароль должен содержать не менее 8 символов';
    }
    if (password !== password2) {
      newErrors.password2 = 'Пароли не совпадают';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await authApi.register({ username, email, password, password2 });
      navigate('/login', { state: { registered: true } });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: Record<string, string[]> } };
      if (apiErr.response?.data) {
        const data = apiErr.response.data;
        setErrors({
          username: data.username?.[0],
          email: data.email?.[0],
          password: data.password?.[0],
          password2: data.password2?.[0],
          general: data.non_field_errors?.[0] ?? data.detail?.[0],
        });
      } else {
        setErrors({ general: 'Ошибка регистрации. Попробуйте ещё раз.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `input-field ${errors[field] ? 'border-red-500 focus:border-red-400 focus:ring-red-500/20' : ''}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary-600/15 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-accent-600/10 rounded-full blur-[100px]" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-xl shadow-primary-500/30 mb-4 animate-float">
            <Gamepad2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black gradient-text">GameVault</h1>
          <p className="text-gray-500 mt-1">Создайте бесплатный аккаунт</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
            {/* Username */}
            <div>
              <label htmlFor="reg-username" className="block text-sm font-medium text-gray-300 mb-2">
                Имя пользователя
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="gamer2024"
                  className={`${inputClass('username')} pl-11`}
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="text-red-400 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`${inputClass('email')} pl-11`}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Не менее 8 символов"
                  className={`${inputClass('password')} pl-11 pr-11`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  id="toggle-password-reg"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-password2" className="block text-sm font-medium text-gray-300 mb-2">
                Подтвердите пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-password2"
                  type={showPassword2 ? 'text' : 'password'}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Повторите пароль"
                  className={`${inputClass('password2')} pl-11 pr-11`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  id="toggle-password2-reg"
                >
                  {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password2 && (
                <p className="text-red-400 text-xs mt-1">{errors.password2}</p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
                {errors.general}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="register-submit-btn"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-5 h-5" />}
              Создать аккаунт
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Уже есть аккаунт?{' '}
            <Link
              to="/login"
              id="go-to-login"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
