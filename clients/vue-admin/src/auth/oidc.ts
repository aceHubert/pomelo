import * as Oidc from 'oidc-client-ts';
import { Modal } from '@/components';
import { i18n } from '../i18n';

// Types
import type { UserManager } from './user-manager';

export type SigninSilentArgs = Oidc.SigninSilentArgs;
export type SigninArgs = Oidc.SigninRedirectArgs & { noInteractive?: boolean };
export type SignoutArgs = Oidc.SignoutRedirectArgs;

export const RedirectKey = 'oidc.redirect';
export const LoginNameKey = 'oidc.login_name';
export const IgnoreRoutes = ['/signin', '/signout', '/internal-access-only'];

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
    value: function (this: Oidc.UserManager, user?: Oidc.User) {
      return (typeof user !== 'undefined' ? Promise.resolve(user) : this.getUser()).then((user) => {
        if (user?.profile) {
          // 退出前保存用户识别信息
          user.profile.login_name && sessionStorage.setItem(LoginNameKey, user.profile.login_name);
          // store sign in params before redirect to user center
        }
      });
    },
    writable: false,
    enumerable: false,
  },
  // 从存储中获取登录参数
  getExtraQueryParams: {
    value: function (this: Oidc.UserManager, user?: Oidc.User) {
      return this.prepareSignIn(user).then(() => {
        const extraQueryParams: Record<string, string | number | boolean> = {};

        let loginName;
        // 自动填充登录名
        if ((loginName = sessionStorage.getItem(LoginNameKey))) {
          extraQueryParams['login_hint'] = loginName; // add login hint
          sessionStorage.removeItem(LoginNameKey);
        }
        // add extra query params

        return extraQueryParams;
      });
    },
    writable: false,
    enumerable: false,
  },
  // 重写 signinSilent 方法，跳转之前构造登录参数
  signinSilent: {
    value: function (this: Oidc.UserManager, args: SigninSilentArgs = {}) {
      return this.getExtraQueryParams().then((extraQueryParams) => {
        return innerSigninSilent.call(this, {
          ...args,
          ui_locales: i18n.locale, // add locale
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
    value: function (this: Oidc.UserManager, args: SigninArgs = {}) {
      const { noInteractive, redirect_uri, ...restArgs } = args;
      this.saveRedirect(redirect_uri);
      if (noInteractive) {
        return this.getUser().then((user) => {
          const removeUser = user ? this.removeUser() : Promise.resolve();
          return Promise.all([this.getExtraQueryParams(user || void 0), removeUser]).then(([extraQueryParams]) => {
            const $signIn = () =>
              this.signinRedirect({
                ...restArgs,
                ui_locales: i18n.locale, // add locale
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
      } else {
        Modal.destroyAll();
        Modal.confirm({
          icon: 'logout',
          title: i18n.tv('session_timeout_confirm.title', 'OOPS!'),
          content: i18n.tv('session_timeout_confirm.content', '登录会话已超时，需要您重新登录。'),
          okText: i18n.tv('session_timeout_confirm.ok_text', '重新登录') as string,
          onOk: () => this.signin({ noInteractive: true }),
        });
        return Promise.resolve(() => {});
      }
    },
    writable: false,
    enumerable: false,
  },
  // sign out and redirect to user center
  // then redirect to home page after authorized
  signout: {
    value: function (this: Oidc.UserManager, args: SignoutArgs = {}) {
      // 退出前保存用户识别信息
      return this.getUser().then((user) =>
        this.prepareSignIn(user || void 0).then(() => {
          const $signOut = () =>
            this.signoutRedirect({
              ...args,
              redirectMethod: args.redirectMethod ?? 'replace', // 默认使用 replace 跳转
              extraQueryParams: {
                ...args.extraQueryParams,
                locale: i18n.locale, // add locale
                // add extra query params
              },
            });

          // TODO: 退出其它
          // 如微信、钉钉、飞书等用户解绑

          // 跳转登出
          return $signOut();
        }),
      );
    },
    writable: false,
    enumerable: false,
  },
});

// Oidc.Log.logger = console

export class OidcUserManagerCreator
  extends Oidc.UserManager
  implements UserManager<SigninArgs, SignoutArgs, Oidc.User>
{
  constructor(settings: Oidc.UserManagerSettings) {
    super(settings);
  }
}

declare module 'oidc-client-ts' {
  export interface UserManager {
    getRedirect(): string;
    saveRedirect(redirectUrl?: string): void;
    prepareSignIn(user?: Oidc.User): Promise<void>;
    getExtraQueryParams(user?: Oidc.User): Promise<Record<string, string | number | boolean>>;
    signin(args?: SigninArgs): Promise<void>;
    signout(args?: SignoutArgs): Promise<void>;
  }

  export interface IdTokenClaims {
    login_name?: string;
    display_name?: string;
    role?: string;
  }
}
