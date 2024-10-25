import { getEnv } from '@ace-util/core';
import { LocalUserManagerCreator } from './local';
import { OidcUserManagerCreator } from './openid-connect';

// Types
import type _Vue from 'vue';
import type { UserManager as OidcUserManagerType, UserManagerSettings as OidcUserManngerSetions } from 'oidc-client-ts';
import type { UserManager } from './user-manager';

export enum AuthType {
  Oidc = 'oidc',
  Local = 'local',
}

export class Authoriztion {
  private static type: AuthType;
  private static instance: Authoriztion;
  userManager: UserManager & Partial<Pick<OidcUserManagerType, 'signinSilent' | 'storeUser'>>;

  constructor(type: AuthType.Oidc, options: ConstructorParameters<typeof OidcUserManagerCreator>[0]);
  constructor(type: AuthType.Local, options: ConstructorParameters<typeof LocalUserManagerCreator>[0]);
  constructor(
    type: AuthType,
    options: ConstructorParameters<typeof LocalUserManagerCreator | typeof OidcUserManagerCreator>[0],
  ) {
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

  static setType = (type: AuthType) => {
    if (this.type === type) return this;

    this.type = type;
    this.instance =
      type === AuthType.Oidc
        ? new Authoriztion(AuthType.Oidc, getEnv<OidcUserManngerSetions>('oidc', {} as any, window._ENV))
        : new Authoriztion(AuthType.Local, {});
    return this;
  };

  static getInstance(defaultType: AuthType = AuthType.Local) {
    if (!this.instance) {
      this.setType(defaultType);
    }

    return this.instance;
  }

  static install(Vue: typeof _Vue, type: AuthType = AuthType.Local) {
    const self = this.setType(type);

    Object.defineProperty(Vue.prototype, '$userManager', {
      get() {
        return self.getInstance().userManager;
      },
    });
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    readonly $userManager: UserManager & Partial<Pick<OidcUserManagerType, 'signinSilent' | 'storeUser'>>;
  }
}
