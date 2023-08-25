import { getCurrentInstance, onBeforeUnmount } from 'vue-demi';

/**
 * export 临时兼容 Vue 2.6.x
 */
export const expose = (exposing: Record<string, any>) => {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error('expose should be called in setup().');
  }

  const keys = Object.keys(exposing);

  keys.forEach((key) => {
    (instance.proxy as any)[key] = exposing[key];
  });

  onBeforeUnmount(() => {
    keys.forEach((key) => {
      (instance.proxy as any)[key] = undefined;
    });
  });
};
