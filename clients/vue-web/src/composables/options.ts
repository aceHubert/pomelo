import { getCurrentInstance, toRef } from '@vue/composition-api';
import { warn } from '@ace-util/core';

// Types
import type { Ref } from '@vue/composition-api';

export function useOptions<T extends string = string>(name: string): Ref<T | undefined>;
export function useOptions(): Readonly<Record<string, string>>;
export function useOptions<T extends string = string>(
  name?: string,
): Ref<T | undefined> | Readonly<Record<string, string>> {
  const instance = getCurrentInstance();
  if (!instance) {
    warn(process.env.NODE_ENV === 'production', 'method can only be used inside setup() or functional components');
    return undefined as any;
  }

  // provide from plugins/options
  const options = instance.proxy.$config || {};

  if (name) {
    return toRef(options, name) as Ref<T | undefined>;
  }
  return options;
}
