import { create } from 'zustand';

const THEME_KEY = 'gv_theme';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  initialize: () => void;
}

const applyTheme = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true,

  toggle: () => {
    const newDark = !get().isDark;
    applyTheme(newDark);
    localStorage.setItem(THEME_KEY, newDark ? 'dark' : 'light');
    set({ isDark: newDark });
  },

  initialize: () => {
    const saved = localStorage.getItem(THEME_KEY);
    const isDark = saved ? saved === 'dark' : true; // default to dark
    applyTheme(isDark);
    set({ isDark });
  },
}));
