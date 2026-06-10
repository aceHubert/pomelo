import { AUTH_BASENAME, HOME_URL } from '@/services/app/env';

export const LOGIN_ROUTE = '/login';
export const MODIFY_PASSWORD_ROUTE = '/password/modify';
export const FORGOT_PASSWORD_ROUTE = '/password/forgot';

export type MissingReturnUrlScene = 'login-success' | 'modify-cancel' | 'forgot-cancel';

function joinPath(base: string, path: string) {
  return `${base}${path}`.replace(/\/{2,}/g, '/');
}

export function buildCanonicalPath(route: string) {
  return joinPath(AUTH_BASENAME, route);
}

export function buildAuthRootPath() {
  return AUTH_BASENAME;
}

export function getCurrentFullPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function getReturnUrl(search: string) {
  const returnUrl = new URLSearchParams(search).get('returnUrl');
  return returnUrl?.trim() || '';
}

export function buildMissingReturnUrlResultPath(scene: MissingReturnUrlScene) {
  const search = toSearch({ scene, from: HOME_URL });
  return `${buildAuthRootPath()}${search}`;
}

export function resolveReturnTarget(search: string, scene: MissingReturnUrlScene) {
  return getReturnUrl(search) || buildMissingReturnUrlResultPath(scene);
}

export function redirectTo(target: string) {
  window.location.assign(target);
}

export function toSearch(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const search = searchParams.toString();
  return search ? `?${search}` : '';
}

export function normalizeLegacyEntry() {
  const { pathname, search, hash } = window.location;
  const canonicalLoginPath = buildCanonicalPath(LOGIN_ROUTE);
  const canonicalModifyPath = buildCanonicalPath(MODIFY_PASSWORD_ROUTE);
  const canonicalForgotPath = buildCanonicalPath(FORGOT_PASSWORD_ROUTE);
  const canonicalRootPath = buildAuthRootPath();

  const aliasMap = new Map<string, string>([
    ['/', canonicalRootPath],
    [LOGIN_ROUTE, canonicalLoginPath],
    [MODIFY_PASSWORD_ROUTE, canonicalModifyPath],
    [FORGOT_PASSWORD_ROUTE, canonicalForgotPath],
  ]);

  const nextPath = aliasMap.get(pathname);
  if (!nextPath || nextPath === pathname) return;

  window.history.replaceState(null, '', `${nextPath}${search}${hash}`);
}
