const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');

function normalizeBaseUrl(value: string | undefined, defaultValue: string) {
  const baseUrl = (value || defaultValue).trim() || defaultValue;
  if (/^https?:\/\//i.test(baseUrl)) {
    return trimTrailingSlash(baseUrl);
  }

  return trimTrailingSlash(baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`);
}

function joinPath(baseUrl: string, path: string) {
  const routePath = trimLeadingSlash(path);
  return routePath ? `${baseUrl}/${routePath}` : baseUrl;
}

function withReturnUrl(url: string, returnUrl?: string) {
  if (!returnUrl) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}returnUrl=${encodeURIComponent(returnUrl)}`;
}

export const authBaseUrl = normalizeBaseUrl(process.env.VUE_APP_AUTH_BASE_URL, '/auth');
export const initializeBaseUrl = normalizeBaseUrl(process.env.VUE_APP_INITIALIZE_BASE_URL, '/initialize');

export function getLoginEntryUrl(returnUrl?: string) {
  return withReturnUrl(joinPath(authBaseUrl, '/login'), returnUrl);
}

export function getPasswordModifyEntryUrl(returnUrl?: string) {
  return withReturnUrl(joinPath(authBaseUrl, '/password/modify'), returnUrl);
}

export function getInitializeEntryUrl(redirect?: string) {
  if (!redirect) {
    return initializeBaseUrl;
  }

  const separator = initializeBaseUrl.includes('?') ? '&' : '?';
  return `${initializeBaseUrl}${separator}redirect=${encodeURIComponent(redirect)}`;
}
