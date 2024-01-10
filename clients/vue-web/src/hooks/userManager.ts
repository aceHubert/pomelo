import { getCurrentInstance } from '@vue/composition-api';
import { warn } from '@ace-util/core';

// Types
import type Vue from 'vue';

export const useUserManager = (): Vue['$userManager'] => {
  const instance = getCurrentInstance();
  if (!instance) {
    warn(process.env.NODE_ENV === 'production', 'method can only be used inside setup() or functional components');
    return undefined as any;
  }

  return instance.proxy.$userManager;
};
