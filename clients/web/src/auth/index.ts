import { getEnv } from '@ace-util/core';
import { LocalUserManagerCreator } from './local';
import { OidcUserManagerCreator } from './openid-connect';

// Types
import type _Vue from 'vue';
import type { UserManager as OidcUserManagerType, UserManagerSettings as OidcUserManngerSetions } from 'oidc-client-ts';
import type { UserManager } from './user-manager';

export enum AuthType {
  Oidc = 'OIDC',
  Local = 'LOCAL',
}

let authType = (process.env.VUE_APP_AUTH_TYPE as AuthType) || AuthType.Local;

if (!Object.values(AuthType).includes(authType)) {
  authType = AuthType.Local;
}

export class Authoriztion {
  private static instance: Authoriztion;
  readonly userManager: UserManager & Partial<Pick<OidcUserManagerType, 'signinSilent' | 'storeUser'>>;
  readonly options: ConstructorParameters<typeof LocalUserManagerCreator | typeof OidcUserManagerCreator>[0];

  constructor(type: AuthType.Oidc, options: ConstructorParameters<typeof OidcUserManagerCreator>[0]);
  constructor(type: AuthType.Local, options: ConstructorParameters<typeof LocalUserManagerCreator>[0]);
  constructor(
    type: AuthType,
    options: ConstructorParameters<typeof LocalUserManagerCreator | typeof OidcUserManagerCreator>[0],
  ) {
    this.options = options;
    if (type === AuthType.Oidc) {
      const userManager = new OidcUserManagerCreator(options as OidcUserManngerSetions);

      userManager.events.addUserSignedOut(() => {
        userManager.removeUser();
      });
      this.userManager = userManager;
    } else {
      this.userManager = new LocalUserManagerCreator(options);
    }
  }

  static get authType() {
    return authType;
  }

  static getInstance() {
    if (!this.instance) {
      this.instance =
        authType === AuthType.Oidc
          ? new Authoriztion(AuthType.Oidc, getEnv<OidcUserManngerSetions>('oidc', {} as any, window._ENV))
          : new Authoriztion(AuthType.Local, {});
    }

    return this.instance;
  }

  static install(Vue: typeof _Vue) {
    const instance = this.getInstance();

    Object.defineProperties(Vue.prototype, {
      $userManager: {
        get() {
          return instance.userManager;
        },
      },
      $authType: {
        get() {
          return authType;
        },
      },
    });
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    readonly $userManager: UserManager & Partial<Pick<OidcUserManagerType, 'signinSilent' | 'storeUser'>>;
    readonly $authType: AuthType;
  }
}
