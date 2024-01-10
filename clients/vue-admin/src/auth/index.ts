import Vue from 'vue';
import { getEnv } from '@ace-util/core';
import { OidcUserManagerCreator } from './oidc';

// Types
import type { UserManagerSettings } from 'oidc-client-ts';

export const userManager = new OidcUserManagerCreator(getEnv<UserManagerSettings>('oidc', {} as any, window._ENV));

userManager.events.addUserSignedOut(() => {
  userManager.removeUser();
});

Object.defineProperties(Vue.prototype, {
  $userManager: {
    value: userManager,
    writable: false,
    enumerable: false,
  },
});

declare module 'vue/types/vue' {
  interface Vue {
    readonly $userManager: typeof userManager;
  }
}
