import { storage } from '@/store/utils';

const ACCESS_TOKEN_KEY = 'access-token',
  TOKEY_TYPE_KEY = 'token-type';

export function getToken() {
  return {
    accessToken: storage.get(ACCESS_TOKEN_KEY),
    tokenType: storage.get(TOKEY_TYPE_KEY),
  };
}

export function setToken(token: string, type = 'Baerer') {
  storage.set(ACCESS_TOKEN_KEY, token);
  storage.set(TOKEY_TYPE_KEY, type);
}

export function removeToken() {
  storage.remove(ACCESS_TOKEN_KEY);
  storage.remove(TOKEY_TYPE_KEY);
}
