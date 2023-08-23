import Oidc from 'oidc-client';
import { UserManagerCreator } from './user-manager';

// Types
import type { UserManager } from './user-manager';

export const RedirectKey = 'oidc.redirect';

Object.defineProperties(Oidc.UserManager.prototype, {
  saveRedirect: {
    value: function () {
      if (['/signin', '/session-timeout'].indexOf(location.pathname) === -1) {
        localStorage.setItem(RedirectKey, location.href);
      }
    },
    writable: false,
    enumerable: false,
  },
  getRedirect: {
    value: function () {
      return localStorage.getItem(RedirectKey) || '/';
    },
    writable: false,
    enumerable: false,
  },
  signIn: {
    value: function (this: Oidc.UserManager) {
      return this.getUser().then((user) => {
        const removeUser = user ? this.removeUser() : Promise.resolve();
        return removeUser.then(() => {
          this.saveRedirect();

          // TODO: 其它登录方式

          // 跳转登录
          this.signinRedirect({
            useReplaceToNavigate: true,
          });
        });
      });
    },
    writable: false,
    enumerable: false,
  },
  signOut: {
    value: function (this: Oidc.UserManager) {
      const $signOut = () => this.signoutRedirect();

      // TODO: 退出其它

      return $signOut();
    },
    writable: false,
    enumerable: false,
  },
});

// Oidc.Log.logger = console

export class OidcUserManagerCreator extends UserManagerCreator {
  _userManager: UserManager;

  constructor(readonly options: Oidc.UserManagerSettings) {
    super();
    const userManager = new Oidc.UserManager(this.options);
    userManager.events.addUserSignedOut(function () {
      userManager.removeUser();
    });
    this._userManager = userManager;
  }

  get userManager() {
    return this._userManager;
  }
}

declare module 'oidc-client/index' {
  export interface UserManager {
    saveRedirect(): void;
    getRedirect(): string;
    signIn(): Promise<void>;
    signOut(redirectUrl?: string): Promise<void>;
  }
}
