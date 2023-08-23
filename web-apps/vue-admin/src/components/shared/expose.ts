import { getCurrentInstance, onBeforeUnmount } from '@vue/composition-api';
import { warn } from '@pomelo/shared-web';

/**
 * export 临时兼容 Vue 2.6.x
 */
export const expose = (exposing: Record<string, any>) => {
  const instance = getCurrentInstance();
  if (!instance) {
    warn(process.env.NODE_ENV === 'production', 'method can only be used inside setup() or functional components');
    return;
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
