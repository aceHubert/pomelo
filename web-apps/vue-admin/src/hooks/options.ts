import { getCurrentInstance, toRef } from '@vue/composition-api';
import { warn } from '@pomelo/shared-web';

// Types
import type { Ref } from '@vue/composition-api';

export function useOptions(key: string): Ref<string>;
export function useOptions(): Ref<Record<string, string>>;
export function useOptions(key?: string): Ref<string> | Ref<Record<string, string>> {
  const instance = getCurrentInstance();
  if (!instance) {
    warn(process.env.NODE_ENV === 'production', 'method can only be used inside setup() or functional components');
    return undefined as any;
  }

  // provide from plugins/options
  const options = instance.proxy.$config;

  if (key) {
    return toRef(options.value, key);
  }
  return options;
}
