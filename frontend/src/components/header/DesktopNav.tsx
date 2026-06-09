import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

interface DesktopNavProps {
  navLinks: Array<{ to: string; label: string; exact: boolean }>;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ navLinks }) => {
  const { isAuthenticated, user } = useAuthStore();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive ? 'text-white' : 'hover:text-white'
    }`;

  const activeDot = (isActive: boolean) => isActive
    ? 'relative after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-[var(--accent)]'
    : '';

  return (
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
  );
};
