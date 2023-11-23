import { getCurrentInstance } from '@vue/composition-api';
import { warn } from '@ace-util/core';

// Types
import type { UserManager } from '@/auth/user-manager';

export const useUserManager = (): UserManager => {
  const instance = getCurrentInstance();
  if (!instance) {
    warn(process.env.NODE_ENV === 'production', 'method can only be used inside setup() or functional components');
    return undefined as any;
  }

  return instance.proxy.$userManager;
};
