import { getCurrentInstance } from '@vue/composition-api';
import { warn } from '@pomelo/shared-web';

// Types
import type { UserManagerCreator } from '@/auth/user-manager';

export function useUserManager(): UserManagerCreator {
  const instance = getCurrentInstance();
  if (!instance) {
    warn(process.env.NODE_ENV === 'production', 'method can only be used inside setup() or functional components');
    return undefined as any;
  }

  return instance.proxy.$userManager;
}
