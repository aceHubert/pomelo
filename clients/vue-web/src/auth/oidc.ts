import * as Oidc from 'oidc-client-ts';

// Types
import type {
  User as OidcUser,
  UserManager as OidcUserManager,
  UserManagerSettings,
  SigninRedirectArgs,
  SigninSilentArgs,
  SignoutRedirectArgs,
} from 'oidc-client-ts';
import type { UserManager } from './user-manager';

export const RedirectKey = 'oidc.redirect';
export const IgnoreRoutes = ['/signin', '/signout'];

const innerSigninSilent = Oidc.UserManager.prototype.signinSilent;
Object.defineProperties(Oidc.UserManager.prototype, {
  saveRedirect: {
    value: function (redirectUrl?: string) {
      if (redirectUrl) {
        localStorage.setItem(RedirectKey, redirectUrl);
      } else if (IgnoreRoutes.indexOf(location.pathname) === -1) {
        localStorage.setItem(RedirectKey, location.href);
      } else {
        // remove cached redirect url
        localStorage.removeItem(RedirectKey);
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
  // 存储登录时需要的额外参数
  prepareSignIn: {
    value: function (this: OidcUserManager, user?: OidcUser) {
      return (typeof user !== 'undefined' ? Promise.resolve(user) : this.getUser()).then((user) => {
        if (user?.profile) {
          // store sign in params before redirect to user center
        }
      });
    },
    writable: false,
    enumerable: false,
  },
  // 从存储中获取登录参数
  getExtraQueryParams: {
    value: function (this: OidcUserManager, user?: OidcUser) {
      return this.prepareSignIn(user).then(() => {
        const extraQueryParams: Record<string, string | number | boolean> = {};

        // add extra query params

        return extraQueryParams;
      });
    },
    writable: false,
    enumerable: false,
  },
  // 重写 signinSilent 方法，跳转之前构造登录参数
  signinSilent: {
    value: function (this: OidcUserManager, args: SigninSilentArgs = {}) {
      return this.getExtraQueryParams().then((extraQueryParams) => {
        return innerSigninSilent.call(this, {
          ...args,
          extraQueryParams: {
            ...args.extraQueryParams,
            ...extraQueryParams,
          },
        });
      });
    },
    writable: false,
    enumerable: false,
  },
  // try to sign in to get access token if user center is authorized and stay in current page
  // otherwise, redirect to user center to sign in
  signin: {
    value: function (this: OidcUserManager, args: SigninRedirectArgs = {}) {
      const { redirect_uri, ...restArgs } = args;
      this.saveRedirect(redirect_uri);

      return this.getUser().then((user: any) => {
        const removeUser = user ? this.removeUser() : Promise.resolve();
        return Promise.all([this.getExtraQueryParams(user), removeUser]).then(([extraQueryParams]) => {
          const $signIn = () =>
            this.signinRedirect({
              ...restArgs,
              extraQueryParams: {
                ...restArgs.extraQueryParams,
                ...extraQueryParams,
              },
            });

          // TODO: 以其它方式登录
          // 如微信、钉钉、飞书等

          // 跳转登录
          return $signIn();
        });
      });
    },
    writable: false,
    enumerable: false,
  },
  // sign out and redirect to user center
  // then redirect to home page after authorized
  signout: {
    value: function (this: OidcUserManager, args: SignoutRedirectArgs = {}) {
      // 退出前保存用户的企业识别信息
      return this.prepareSignIn().then(() => {
        const $signOut = () =>
          this.signoutRedirect({
            ...args,
            redirectMethod: args.redirectMethod ?? 'replace', // 默认使用 replace 跳转
          });

        // TODO: 退出其它
        // 如微信、钉钉、飞书等用户解绑

        // 跳转登出
        return $signOut();
      });
    },
    writable: false,
    enumerable: false,
  },
});

// Oidc.Log.logger = console

export class OidcUserManagerCreator implements UserManager<SigninRedirectArgs, SignoutRedirectArgs, OidcUser> {
  private readonly oidcUserManager: Oidc.UserManager;

  constructor(readonly settings: UserManagerSettings) {
    const userManager = new Oidc.UserManager(settings);
    userManager.events.addUserSignedOut(() => {
      userManager.removeUser();
    });

    this.oidcUserManager = userManager;
  }

  get events() {
    return this.oidcUserManager.events;
  }

  get settingsStore() {
    return this.oidcUserManager.settings;
  }

  get metadataService() {
    return this.oidcUserManager.metadataService;
  }

  async getUser() {
    return this.oidcUserManager.getUser();
  }

  /**
   * 触发静态授权请求（如iframe）
   */
  signinSilent(args?: SigninSilentArgs) {
    return this.oidcUserManager.signinSilent(args);
  }

  /**
   * 触发尝试从授权登录中心获取登录态
   * 如果用户中心未授权，则跳转到授权登录页面, 登录成功后并返回到当前页面
   */
  signin(args?: SigninRedirectArgs) {
    return this.oidcUserManager.signin(args);
  }

  signinRedirect(args: SigninRedirectArgs) {
    return this.oidcUserManager.signinRedirect(args);
  }

  signinRedirectCallback(url?: string) {
    return this.oidcUserManager.signinRedirectCallback(url);
  }

  /**
   *  结束会话并重定向到授权登录页面
   */
  signout(args?: SignoutRedirectArgs) {
    return this.oidcUserManager.signout(args);
  }

  signoutRedirect(args?: SignoutRedirectArgs) {
    return this.oidcUserManager.signoutRedirect(args);
  }

  signoutRedirectCallback(url?: string) {
    return this.oidcUserManager.signoutRedirectCallback(url);
  }
}

declare module 'oidc-client-ts' {
  export interface UserManager {
    getRedirect(): string;
    saveRedirect(redirectUrl?: string): void;
    prepareSignIn(user?: OidcUser): Promise<void>;
    getExtraQueryParams(user?: OidcUser): Promise<Record<string, string | number | boolean>>;
    signin(args?: SigninRedirectArgs): Promise<void>;
    signout(args?: SignoutRedirectArgs): Promise<void>;
  }

  export interface OidcStandardClaims {
    display_name?: string;
    role?: string;
  }
}

// 通过这里扩展 UserManager 类型
// 不需要改主体流程
// 在 signin 页面中使用
declare module './user-manager' {
  export interface UserManager
    extends Pick<
      Oidc.UserManager,
      'signinSilent' | 'signinRedirect' | 'signinRedirectCallback' | 'signoutRedirect' | 'signoutRedirectCallback'
    > {}
}
