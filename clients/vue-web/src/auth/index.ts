import { userManager as LocalUserManager } from './local';
import { userManager as OidcUserManager } from './openid-connect';

// Types
import type _Vue from 'vue';
import type { UserManager as OidcUserManagerType } from 'oidc-client-ts';
import type { UserManager } from './user-manager';

function getUserManager(
  type: 'oidc' | 'local' = 'local',
): UserManager & Partial<Pick<OidcUserManagerType, 'signinSilent' | 'storeUser'>> {
  return type === 'oidc' ? OidcUserManager : LocalUserManager;
}

export const auth = {
  getUserManager,
  install(Vue: typeof _Vue) {
    Object.defineProperty(Vue.prototype, '$userManager', {
      get() {
        return getUserManager(this.$config.authType);
      },
    });
  },
};

declare module 'vue/types/vue' {
  interface Vue {
    readonly $userManager: ReturnType<typeof getUserManager>;
  }
}
