import { jwtDecode, type JwtPayload } from 'jwt-decode';
import { absoluteGo } from '@ace-util/core';
import { Modal } from '@/components';
import { i18n } from '@/i18n';
import { UserManager, type IUser, type ISigninArgs, type ISignoutArgs } from '../user-manager';
import { getToken, setToken, removeToken } from './helper';

export interface UserManagerOptions {
  filterProtocolClaims?: boolean | string[];
}

/**
 * Protocol claims that could be removed by default from profile.
 * Derived from the following sets of claims:
 * - {@link https://datatracker.ietf.org/doc/html/rfc7519.html#section-4.1}
 * - {@link https://openid.net/specs/openid-connect-core-1_0.html#IDToken}
 * - {@link https://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken}
 */
const DefaultProtocolClaims = [
  'nbf',
  'jti',
  'auth_time',
  'nonce',
  'acr',
  'amr',
  'azp',
  'at_hash', // https://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken
] as const;

/**
 * Protocol claims that should never be removed from profile.
 * "sub" is needed internally and others should remain required as per the OIDC specs.
 */
const InternalRequiredProtocolClaims = ['sub', 'iss', 'aud', 'exp', 'iat'];

class Timer {
  public static getEpochTime() {
    return Math.floor(new Date().getTime() / 1000);
  }
}

class User implements IUser {
  payload: JwtPayload;

  constructor(
    private readonly token: string,
    private readonly options: UserManagerOptions & {
      tokenType?: string;
    },
  ) {
    this.payload = jwtDecode(token);
  }

  get access_token() {
    return this.token;
  }

  get token_type() {
    return this.options.tokenType ?? 'Bearer';
  }

  get profile() {
    const result = { ...this.payload } as IUser['profile'];

    if (this.options.filterProtocolClaims) {
      let protocolClaims;
      if (Array.isArray(this.options.filterProtocolClaims)) {
        protocolClaims = this.options.filterProtocolClaims;
      } else {
        protocolClaims = DefaultProtocolClaims;
      }

      for (const claim of protocolClaims) {
        if (!InternalRequiredProtocolClaims.includes(claim)) {
          delete result[claim];
        }
      }
    }

    return result;
  }

  get expires_in(): number | undefined {
    if (this.payload.exp === undefined) {
      return undefined;
    }
    return this.payload.exp - Timer.getEpochTime();
  }

  /** Computed value indicating if the access token is expired. */
  public get expired(): boolean | undefined {
    const expires_in = this.expires_in;
    if (expires_in === undefined) {
      return undefined;
    }
    return expires_in <= 0;
  }
}

export class LocalUserManagerCreator extends UserManager {
  constructor(private readonly options: UserManagerOptions = {}) {
    super();
  }

  getUser(): Promise<IUser | null> {
    const { accessToken, tokenType } = getToken();
    if (accessToken) {
      const user = new User(accessToken, { tokenType, ...this.options });
      return Promise.resolve(user);
    }
    return Promise.resolve(null);
  }

  removeUser(): Promise<void> {
    removeToken();
    return Promise.resolve();
  }

  modifyPassword(): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        absoluteGo(`/login/password/modify?returnUrl=${encodeURIComponent(location.pathname)}`);
        resolve();
      }, 0);
    });
  }

  signin(args: ISigninArgs = {}): Promise<void> {
    const { noInteractive, redirect_uri = '/' } = args;
    if (noInteractive) {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          absoluteGo(`${process.env.BASE_URL}login?returnUrl=${encodeURIComponent(redirect_uri)}`);
          resolve();
        }, 0);
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
      return new Promise<void>(() => {});
    }
  }
  signout(args: ISignoutArgs = {}): Promise<void> {
    const { redirect_uri = '/' } = args;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        window.location.href = `${process.env.BASE_URL}login?returnUrl=${encodeURIComponent(redirect_uri)}`;
        resolve();
      }, 0);
    });
  }
}

export { setToken, removeToken };
