import { getStoredAuthToken } from './token';

export type LoginJwtPayload = {
  sub?: string;
  exp?: number;
  login_name?: string;
  username?: string;
  preferred_username?: string;
  [key: string]: unknown;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (item) => item.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token: string): LoginJwtPayload | null {
  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    return JSON.parse(decodeBase64Url(payload)) as LoginJwtPayload;
  } catch {
    return null;
  }
}

export function getStoredLoginPayload() {
  const authToken = getStoredAuthToken();
  if (!authToken?.token) return null;

  return decodeJwtPayload(authToken.token);
}

export function getStoredLoginName() {
  const payload = getStoredLoginPayload();
  return payload?.login_name || payload?.preferred_username || payload?.username || '';
}
