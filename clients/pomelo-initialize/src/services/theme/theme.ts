export type ResolvedThemeMode = 'light' | 'dark';

export function getResolvedThemeMode(): ResolvedThemeMode {
  const theme = document.documentElement.dataset.theme;
  if (theme === 'dark' || theme === 'light') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function observeResolvedThemeMode(listener: (mode: ResolvedThemeMode) => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const syncThemeMode = () => listener(getResolvedThemeMode());
  const observer = new MutationObserver(syncThemeMode);

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  media.addEventListener('change', syncThemeMode);

  return () => {
    observer.disconnect();
    media.removeEventListener('change', syncThemeMode);
  };
}
