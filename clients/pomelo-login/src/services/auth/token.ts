export type AccessTokenRecord = {
  token: string;
  type: string;
};

const ACCESS_TOKEN_KEY = 'access-token';

function parseTokenRecord(rawValue: string | null) {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<AccessTokenRecord>;
    if (!parsed?.token) return null;
    return {
      token: parsed.token,
      type: parsed.type || 'Bearer',
    };
  } catch {
    return null;
  }
}

export function getStoredAuthToken() {
  const localToken = parseTokenRecord(window.localStorage.getItem(ACCESS_TOKEN_KEY));
  if (localToken) return localToken;

  return parseTokenRecord(window.sessionStorage.getItem(ACCESS_TOKEN_KEY));
}

export function setStoredAuthToken(token: string, type = 'Bearer', remember = false) {
  const payload = JSON.stringify({ token, type });
  if (remember) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, payload);
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, payload);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearStoredAuthToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getAuthorizationHeader() {
  const authToken = getStoredAuthToken();
  if (!authToken?.token) return '';

  return [authToken.type || 'Bearer', authToken.token].filter(Boolean).join(' ');
}
