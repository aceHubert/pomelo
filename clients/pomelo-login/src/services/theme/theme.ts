export type ResolvedThemeMode = 'light' | 'dark';
export type ThemePreference = ResolvedThemeMode | 'system';

const THEME_STORAGE_KEY = 'pomelo.login.theme';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function getStoredThemePreference(): ThemePreference {
  const theme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(theme) ? theme : 'system';
}

export function getResolvedThemeMode(): ResolvedThemeMode {
  const theme = document.documentElement.dataset.theme;
  if (theme === 'dark' || theme === 'light') return theme;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyThemePreference(theme: ThemePreference) {
  if (theme === 'system') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyStoredThemePreference() {
  applyThemePreference(getStoredThemePreference());
}
