import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/theme';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggle } = useThemeStore();

  return (
    <button
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
  );
};
