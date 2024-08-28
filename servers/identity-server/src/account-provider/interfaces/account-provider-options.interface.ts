import { ModuleMetadata, Type } from '@nestjs/common';
import { CountryCode } from 'libphonenumber-js';
import { CanBePromise } from 'oidc-provider';

export interface AccountClaims {
  id: number;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  updated_at?: number;
  [key: string]: unknown;
}

export interface AccountProviderOptions {
  adapter: () => {
    /**
     * get account
     * @param idOrUserName account id or username
     * @returns account claims (snakecase keys)
     */
    getAccount(idOrUserName: number | string): CanBePromise<AccountClaims | undefined>;
    /**
     * get extra claims(claims to be issued in userinfo and id_token)
     * @param id account id
     * @returns extra claims (snakecase keys)
     */
    getClaims(id: number): CanBePromise<Omit<AccountClaims, 'id'> & { [key: string]: unknown }>;
    /**
     * get phone region code
     */
    getPhoneRegionCode(): CanBePromise<CountryCode | undefined>;
    /**
     * verify account by username and password
     * @param username username (account identifier, such as login name, email, phone number, etc.)
     * @param password password
     * @returns false if account is not found by username and password, otherwise return the account id
     */
    verifyAccount(username: string, password: string): CanBePromise<false | string>;
    /**
     * update password by account id
     * @param id account id
     * @param oldPwd old password
     * @param newPwd new password
     */
    updatePassword(id: number, oldPwd: string, newPwd: string): CanBePromise<void>;
    /**
     * update password by username
     * @param username username (account identifier, such as login name, email, phone number, etc.)
     * @param oldPwd old password
     * @param newPwd
     */
    updatePasswordByUsername(username: string, oldPwd: string, newPwd: string): CanBePromise<void>;
    /**
     * reset password
     * @param id account id
     * @param newPwd new password
     */
    resetPassword(id: number, newPwd: string): CanBePromise<void>;
  };
  /**
   * is global module
   */
  isGlobal?: boolean;
}

export interface AccountProviderOptionsFactory {
  createAccountProviderOptions():
    | Promise<Omit<AccountProviderOptions, 'isGlobal'>>
    | Omit<AccountProviderOptions, 'isGlobal'>;
}

export interface AccountProviderAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * is global module
   */
  isGlobal?: boolean;
  useExisting?: Type<AccountProviderOptionsFactory>;
  useClass?: Type<AccountProviderOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<Omit<AccountProviderOptions, 'isGlobal'>> | Omit<AccountProviderOptions, 'isGlobal'>;
  inject?: any[];
}
