import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Github, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm mt-auto">
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">GameVault</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
              Ваша персональная игровая библиотека. Открывайте, отслеживайте и оценивайте видеоигры.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
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
                    className="text-sm text-gray-500 hover:text-primary-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Проект
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-400 transition-colors duration-200"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600 dark:text-gray-500">
            © {year} GameVault. Все права защищены.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-500 flex items-center gap-1">
            Сделано с <Heart className="w-3 h-3 text-red-500 fill-red-500" /> для геймеров
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
