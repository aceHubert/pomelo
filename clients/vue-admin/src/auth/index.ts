import Vue from 'vue';
import { getEnv } from '@ace-util/core';
import { OidcUserManagerCreator } from './oidc';

export const userManager = new OidcUserManagerCreator(getEnv('oidc', {}, (window as any)._ENV));

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
