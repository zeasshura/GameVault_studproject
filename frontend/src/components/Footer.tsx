import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Github, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
      <div className="section-container py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent)' }}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="text-base font-bold" style={{ color: 'var(--text)' }}>GameVault</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-muted)' }}>
              Ваша персональная игровая библиотека. Открывайте, отслеживайте и оценивайте игры.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-dim)' }}>
              Навигация
            </h3>
            <ul className="flex flex-col gap-2">
              {[
                { to: '/', label: 'Главная' },
                { to: '/games', label: 'Каталог игр' },
                { to: '/login', label: 'Войти' },
                { to: '/register', label: 'Регистрация' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
