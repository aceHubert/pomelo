import { getCurrentInstance } from '@vue/composition-api';
import { warn } from '@pomelo/shared-web';

// Types
import type { MicroApp } from '@/plugins/micro-app';

export const useMicroApp = (): MicroApp => {
  const instance = getCurrentInstance();
  if (!instance) {
    warn(process.env.NODE_ENV === 'production', 'method can only be used inside setup() or functional components');
    return undefined as any;
  }

  return instance.proxy.$micorApp;
};
