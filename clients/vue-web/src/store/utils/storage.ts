import store from 'store';
import engine from 'store/src/store-engine';
import sessStorage from 'store/storages/sessionStorage';

export const STORAGE_PREFIX = 'po-web';

function defineStorage(store: StoreJsAPI, prefix?: string) {
  const getKey = (key: string) => (prefix ? `${prefix}/${key}` : key);
  return {
    get: <T = any>(key: string, defaultValue?: T): T => {
      return store.get(getKey(key), defaultValue);
    },
    set: (key: string, value: any) => {
      return store.set(getKey(key), value);
    },
    remove: (key: string) => {
      return store.remove(getKey(key));
    },
    clearAll: () => store.clearAll(),
  };
}

export const storage = defineStorage(store, STORAGE_PREFIX);
export const globalStorage = defineStorage(store);

const sessionStorage = engine.createStore([sessStorage]);
export const session = defineStorage(sessionStorage, STORAGE_PREFIX);
export const globalSession = defineStorage(sessionStorage);
