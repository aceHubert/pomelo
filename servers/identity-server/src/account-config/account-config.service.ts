import { snakeCase } from 'lodash';
import { CountryCode } from 'libphonenumber-js';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  md5,
  INFRASTRUCTURE_SERVICE,
  UserPattern,
  UserMetaPresetKeys,
  OptionPresetKeys,
  OptionPattern,
} from '@ace-pomelo/shared/server';

import {
  AccountProviderOptionsFactory,
  AccountClaims,
} from '../account-provider/interfaces/account-provider-options.interface';

@Injectable()
export class AccountConfigService implements AccountProviderOptionsFactory {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) private basicService: ClientProxy) {}

  createAccountProviderOptions() {
    return {
      adapter: () => ({
        getAccount: async (options: XOR<{ id: number }, { username: string }>) => {
          const user = await this.basicService
            .send<
              | {
                  id: number;
                  loginName: string;
                  niceName: string;
                  displayName: string;
                  mobile?: string;
                  email?: string;
                  url: string;
                  updatedAt: string;
                }
              | undefined
            >(UserPattern.Get, {
              fields: ['id', 'loginName', 'niceName', 'displayName', 'email', 'mobile', 'url', 'updatedAt'],
              requestUserId: options.id,
              requestUsername: options.username,
            })
            .lastValue();

          if (user) {
            const claims: AccountClaims = {
              id: user.id,
              login_name: user.loginName,
              display_name: user.displayName,
              nice_name: user.niceName,
              url: user.url,
              updated_at: new Date(user.updatedAt).getTime(),
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
        getClaims: async (id: number) => {
          const metas = await this.basicService
            .send<Array<{ id: string; metaKey: string; metaValue: string }>>(UserPattern.GetMetas, {
              userId: id,
              metaKeys: Object.values(UserMetaPresetKeys),
              fields: ['metaKey', 'metaValue'],
            })
            .lastValue();

          return metas.reduce((acc, meta) => {
            switch (meta.metaKey) {
              case UserMetaPresetKeys.VerifingEmail:
                acc['email'] = meta.metaValue;
                acc['email_verified'] = false;
                break;
              case UserMetaPresetKeys.VerifingMobile:
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
          }, {} as Omit<AccountClaims, 'id'>);
        },
        getPhoneRegionCode: async () => {
          return this.basicService
            .send<CountryCode | undefined>(OptionPattern.GetValue, {
              optionName: OptionPresetKeys.DefaultPhoneNumberRegion,
            })
            .lastValue();
        },
        verifyAccount: async (loginName: string, password: string) => {
          const user = await this.basicService
            .send<{ id: number } | false>(UserPattern.Verify, {
              username: loginName,
              password,
            })
            .lastValue();
          if (user) {
            return String(user.id);
          }
          return false;
        },
        updatePassword: async (
          options: XOR<{ id: number }, { username: string }> & { oldPwd: string; newPwd: string },
        ) => {
          return this.basicService
            .send<void>(UserPattern.UpdatePassword, {
              id: options.id,
              username: options.username,
              oldPwd: md5(options.oldPwd),
              newPwd: md5(options.newPwd),
            })
            .lastValue();
        },
        resetPassword: async (id: number, newPwd: string) => {
          return this.basicService
            .send<void>(UserPattern.ResetPassword, {
              id,
              password: md5(newPwd),
            })
            .lastValue();
        },
      }),
    };
  }
}
