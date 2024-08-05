import { getEnv } from '@ace-util/core';
import { OidcUserManagerCreator } from './oidc';

// Types
import type _Vue from 'vue';
import type { UserManagerSettings } from 'oidc-client-ts';

const userManager = new OidcUserManagerCreator(getEnv<UserManagerSettings>('oidc', {} as any, window._ENV));

userManager.events.addUserSignedOut(() => {
  userManager.removeUser();
});

export const auth = {
  userManager,
  install(Vue: typeof _Vue) {
    Vue.prototype.$userManager = userManager;
  },
};

declare module 'vue/types/vue' {
  interface Vue {
    readonly $userManager: typeof userManager;
  }
}
