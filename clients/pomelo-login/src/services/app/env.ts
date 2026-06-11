const DEFAULT_GRAPHQL_URI = '/action/basic/graphql';

function normalizePath(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return normalized.replace(/\/+$/, '') || fallback;
}

function normalizeViteBase(value: string | undefined) {
  const normalized = normalizePath(value, '/');
  return normalized === '/' ? '/' : normalized;
}

export const APP_TITLE = import.meta.env.VITE_APP_TITLE?.trim() || 'Pomelo Login';
export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME?.trim() || 'Pomelo';
export const AUTH_BASENAME = normalizeViteBase(import.meta.env.BASE_URL);
export const HOME_URL = import.meta.env.VITE_HOME_URL?.trim() || '/';

export function resolveGraphqlUri() {
  const configuredUri = import.meta.env.VITE_GRAPHQL_URI?.trim() || import.meta.env.VITE_BASIC_GRAPHQL_URI?.trim();
  if (!configuredUri) return DEFAULT_GRAPHQL_URI;

  if (/^https?:\/\//i.test(configuredUri)) return configuredUri;
  return configuredUri.startsWith('/') ? configuredUri : `/${configuredUri}`;
}
