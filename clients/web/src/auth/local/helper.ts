import { storage, session } from '@/store/utils';

const ACCESS_TOKEN_KEY = 'access-token';

export function getToken() {
  const accessToken =
    storage.get<{ token: string; type: string }>(ACCESS_TOKEN_KEY) ||
    session.get<{ token: string; type: string }>(ACCESS_TOKEN_KEY);
  if (!accessToken) {
    return null;
  }

  return {
    token: accessToken.token,
    type: accessToken.type,
  };
}

export function setToken(token: string, type = 'Baerer', remember = false) {
  if (remember) {
    storage.set(ACCESS_TOKEN_KEY, { token, type });
  } else {
    session.set(ACCESS_TOKEN_KEY, { token, type });
  }
}

export function removeToken() {
  storage.remove(ACCESS_TOKEN_KEY);
  session.remove(ACCESS_TOKEN_KEY);
}
