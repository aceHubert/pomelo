import Vue from 'vue';
import { getEnv } from '@pomelo/shared-web';
import { OidcUserManagerCreator } from './oidc';
import { UserManagerCreator } from './user-manager';

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
    readonly $userManager: InstanceType<typeof UserManagerCreator>;
  }
}
