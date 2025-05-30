import * as Oidc from 'oidc-client-ts';
import { trailingSlash, absoluteGo } from '@ace-util/core';
import { Modal, message } from '@/components';
import { STORAGE_PREFIX } from '@/store/utils';
import { i18n } from '@/i18n/index';

// Types
import type { UserManager, ISigninArgs, ISignoutArgs } from '../user-manager';

export type SigninSilentArgs = Oidc.SigninSilentArgs;
export type SigninArgs = (Oidc.SigninRedirectArgs | Oidc.SigninPopupArgs) & ISigninArgs;
export type SignoutArgs = (Oidc.SignoutRedirectArgs | Oidc.SignoutPopupArgs) & ISignoutArgs;

if (process.env.NODE_ENV === 'development') {
  Oidc.Log.setLogger(console);
  Oidc.Log.setLevel(Oidc.Log.DEBUG);
}

export const RedirectKey = `${STORAGE_PREFIX}/oidc.redirect`;
export const LoginNameKey = `${STORAGE_PREFIX}/oidc.login_name`;
export const IgnoreRoutes = ['/signin', '/signout'].map(
  (path) => `${trailingSlash(process.env.BASE_URL ?? '/')}${path.substring(1)}`,
);

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
    enumerable: true,
  },
  getRedirect: {
    value: function () {
      return localStorage.getItem(RedirectKey) || '/';
    },
    writable: false,
    enumerable: true,
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
    enumerable: true,
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
    enumerable: true,
  },
  modifyPassword: {
    value: function (this: Oidc.UserManager) {
      const { authority, client_id } = this.settings;
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          absoluteGo(
            `${trailingSlash(authority)}password/modify?returnUrl=${encodeURIComponent(
              location.href,
            )}&clientId=${client_id}`,
          );
          resolve();
        }, 0);
      });
    },
    writable: false,
    enumerable: true,
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
    enumerable: true,
  },
  // try to sign in to get access token if user center is authorized and stay in current page
  // otherwise, redirect to user center to sign in
  signin: {
    value: function (this: Oidc.UserManager, args: SigninArgs = {}) {
      const { noInteractive, popup, redirect_uri, extraQueryParams, ...restArgs } = args;
      this.saveRedirect(redirect_uri);
      if (noInteractive) {
        return this.getUser().then((user) => {
          const removeUser = user ? this.removeUser() : Promise.resolve();
          return Promise.all([this.getExtraQueryParams(user || void 0), removeUser]).then(([localQueryParams]) => {
            const $signIn = () =>
              popup
                ? this.signinPopup({
                    ...restArgs,
                    ui_locales: i18n.locale, // add locale
                    extraQueryParams: {
                      ...extraQueryParams,
                      ...localQueryParams,
                    },
                  }).then((user) => {
                    if (!user) {
                      message.error(i18n.tv('signin_popup_failed', '登录失败，请重试！') as string);
                    }
                  })
                : this.signinRedirect({
                    ...restArgs,
                    ui_locales: i18n.locale, // add locale
                    extraQueryParams: {
                      ...extraQueryParams,
                      ...localQueryParams,
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
          onOk: () =>
            this.signin({
              ...args,
              noInteractive: true,
            }),
        });
        return Promise.resolve(() => {});
      }
    },
    writable: false,
    enumerable: true,
  },
  // sign out and redirect to user center
  // then redirect to home page after authorized
  signout: {
    value: function (this: Oidc.UserManager, args: SignoutArgs = {}) {
      const { popup, redirect_uri, post_logout_redirect_uri, extraQueryParams, ...restArgs } = args;
      // 退出前保存用户识别信息
      return this.getUser().then((user) =>
        this.prepareSignIn(user || void 0).then(() => {
          let redirectUri = post_logout_redirect_uri;
          if (redirect_uri) {
            redirectUri = /https?:\/\//.test(redirect_uri) ? redirect_uri : `${location.origin}${redirect_uri}`;
          }

          const $signOut = () =>
            popup
              ? this.signoutPopup({
                  ...restArgs,
                  post_logout_redirect_uri: redirectUri,
                  extraQueryParams: {
                    ...extraQueryParams, // add extra query params
                    ui_locales: i18n.locale, // add locale
                  },
                })
              : this.signoutRedirect({
                  ...restArgs,
                  post_logout_redirect_uri: redirectUri,
                  extraQueryParams: {
                    ...extraQueryParams, // add extra query params
                    ui_locales: i18n.locale, // add locale
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
    enumerable: true,
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
    modifyPassword(): Promise<void>;
    signin(args?: SigninArgs): Promise<void>;
    signout(args?: SignoutArgs): Promise<void>;
  }

  export interface IdTokenClaims {
    login_name?: string;
    display_name?: string;
    role?: string;
  }
}
