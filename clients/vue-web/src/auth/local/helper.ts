import { storage } from '@/store/utils';

const TOKEN_KEY = 'token';

export function getToken() {
  return storage.get(TOKEN_KEY);
}

export function setToken(token: string) {
  return storage.set(TOKEN_KEY, token);
}
