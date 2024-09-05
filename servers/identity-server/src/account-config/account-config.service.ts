import { snakeCase } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { CountryCode } from 'libphonenumber-js';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { md5, UserMetaPresetKeys, OptionPresetKeys } from '@ace-pomelo/shared/server';
import { INFRASTRUCTURE_SERVICE } from '@/constants';

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
        getAccount: async (idOrUserName: number | string) => {
          const user = await lastValueFrom(
            this.basicService.send<
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
            >(
              { cmd: 'user.getRequest' },
              {
                fields: ['id', 'loginName', 'niceName', 'displayName', 'email', 'mobile', 'url', 'updatedAt'],
                requestUserIdOrUsername: idOrUserName,
              },
            ),
          );
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
          const metas = await lastValueFrom(
            this.basicService.send<Array<{ id: string; metaKey: string; metaValue: string }>>(
              { cmd: 'user.metas.get' },
              {
                userId: id,
                metaKeys: Object.values(UserMetaPresetKeys),
                fields: ['metaKey', 'metaValue'],
              },
            ),
          );

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
          return lastValueFrom(
            this.basicService.send<CountryCode | undefined>(
              { cmd: 'option.getValue' },
              { optionName: OptionPresetKeys.DefaultPhoneNumberRegion },
            ),
          );
        },
        verifyAccount: async (loginName: string, password: string) => {
          const user = await lastValueFrom(
            this.basicService.send<{ id: number }>(
              { cmd: 'user.verify' },
              {
                username: loginName,
                password,
              },
            ),
          );
          if (user) {
            return String(user.id);
          }
          return false;
        },
        updatePassword: async (id: number, oldPwd: string, newPwd: string) => {
          return lastValueFrom(
            this.basicService.send<void>(
              { cmd: 'user.update.password' },
              {
                id,
                oldPwd: md5(oldPwd),
                newPwd: md5(newPwd),
              },
            ),
          );
        },
        updatePasswordByUsername: async (username: string, oldPwd: string, newPwd: string) => {
          return lastValueFrom(
            this.basicService.send<void>(
              { cmd: 'user.update.passwordByUsername' },
              {
                username,
                oldPwd: md5(oldPwd),
                newPwd: md5(newPwd),
              },
            ),
          );
        },
        resetPassword: async (id: number, newPwd: string) => {
          return lastValueFrom(
            this.basicService.send<void>(
              { cmd: 'user.reset.password' },
              {
                id,
                password: md5(newPwd),
              },
            ),
          );
        },
      }),
    };
  }
}
