const TOKEN_KEY = 'pomelo.identity.management.token';

export function getManagementToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setManagementToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearManagementToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}
