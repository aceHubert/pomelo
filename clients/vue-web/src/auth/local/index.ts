import { jwtDecode, type JwtPayload } from 'jwt-decode';
import { UserManager, type IUser } from '../user-manager';
import { getToken, setToken } from './helper';

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
  constructor(
    private readonly payload: JwtPayload,
    private readonly options: { filterProtocolClaims?: boolean | string[] },
  ) {}

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

class LocalUserManagerCreator extends UserManager {
  constructor(private readonly options: { filterProtocolClaims?: boolean | string[] } = {}) {
    super();
  }

  getUser() {
    const token = getToken();
    if (!token) {
      const payload = jwtDecode(token);
      return Promise.resolve(new User(payload, this.options));
    }
    return Promise.resolve(null);
  }
  signin() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        window.location.href = process.env.BASE_URL + 'login';
        resolve();
      }, 1000);
    });
  }
  signout() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        window.location.href = process.env.BASE_URL + 'login';
        resolve();
      }, 1000);
    });
  }
}

export const userManager = new LocalUserManagerCreator();

export { setToken };
