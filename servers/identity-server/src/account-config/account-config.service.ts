import { snakeCase } from 'lodash';
import { CountryCode } from 'libphonenumber-js';
import { Injectable } from '@nestjs/common';
import { md5 } from '@ace-pomelo/shared-server';
import {
  UserDataSource,
  UserMetaPresetKeys,
  OptionDataSource,
  OptionPresetKeys,
} from '@ace-pomelo/infrastructure-datasource';
import {
  AccountProviderOptionsFactory,
  AccountClaims,
} from '../account-provider/interfaces/account-provider-options.interface';

@Injectable()
export class AccountConfigService implements AccountProviderOptionsFactory {
  constructor(private readonly userDataSource: UserDataSource, private readonly optionDataSource: OptionDataSource) {}

  createAccountProviderOptions() {
    return {
      adapter: () => ({
        getAccount: async (sub: string) => {
          const user = await this.userDataSource.get(
            ['id', 'loginName', 'niceName', 'displayName', 'email', 'mobile', 'url', 'updatedAt'],
            Number(sub),
          );
          if (user) {
            const claims: AccountClaims = {
              sub: String(user.id),
              login_name: user.loginName,
              display_name: user.displayName,
              nice_name: user.niceName,
              url: user.url,
              updated_at: user.updatedAt.getTime(),
            };

            if (user.email) {
              claims['email'] = user.email;
              claims['email_verified'] = true;
            }

            if (user.mobile) {
              claims['phone_number'] = user.mobile;
              claims['phone_number_verified'] = true;
            }

            return claims;
          }
          return;
        },
        getClaims: async (sub: string) => {
          const metas = await this.userDataSource.getMetas(Number(sub), Object.values(UserMetaPresetKeys), [
            'metaKey',
            'metaValue',
          ]);

          return metas.reduce((acc, meta) => {
            switch (meta.metaKey) {
              case UserMetaPresetKeys.VerifingEmail:
                acc['email'] = meta.metaValue;
                acc['email_verified'] = false;
                break;
              case UserMetaPresetKeys.VerifingPhone:
                acc['phone_number'] = meta.metaValue;
                acc['phone_number_verified'] = false;
                break;
              case UserMetaPresetKeys.Capabilities:
                acc['role'] = meta.metaValue;
                break;
              default:
                acc[snakeCase(meta.metaKey)] = meta.metaValue;
            }
            return acc;
          }, {} as Omit<AccountClaims, 'sub'>);
        },
        getAccountByUsername: async (username: string) => {
          const user = await this.userDataSource.get(
            ['id', 'loginName', 'niceName', 'displayName', 'email', 'mobile', 'url', 'updatedAt'],
            username,
          );

          if (user) {
            const claims: AccountClaims = {
              sub: String(user.id),
              login_name: user.loginName,
              display_name: user.displayName,
              nice_name: user.niceName,
              url: user.url,
              updated_at: user.updatedAt.getTime(),
            };

            if (user.email) {
              claims['email'] = user.email;
              claims['email_verified'] = true;
            }

            if (user.mobile) {
              claims['phone_number'] = user.mobile;
              claims['phone_number_verified'] = true;
            }

            return claims;
          }
          return;
        },
        getPhoneRegionCode: async () => {
          return this.optionDataSource.getValue<CountryCode>(OptionPresetKeys.DefaultPhoneNumberRegion);
        },
        verifyAccount: async (loginName: string, password: string) => {
          const user = await this.userDataSource.verifyUser(loginName, md5(password).toString());
          if (user) {
            return String(user.id);
          }
          return false;
        },
        updatePassword: async (sub: string, oldPwd: string, newPwd: string) => {
          return this.userDataSource.updateLoginPwd(Number(sub), md5(oldPwd), md5(newPwd));
        },
        updatePasswordByUsername: async (username: string, oldPwd: string, newPwd: string) => {
          return this.userDataSource.updateLoginPwd(username, md5(oldPwd), md5(newPwd));
        },
        resetPassword: async (sub: string, newPwd: string) => {
          return this.userDataSource.resetLoginPwd(Number(sub), md5(newPwd));
        },
      }),
    };
  }
}
