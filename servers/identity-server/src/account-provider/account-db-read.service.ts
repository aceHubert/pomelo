import { snakeCase } from 'lodash';
import { Injectable } from '@nestjs/common';
import { md5, UserMetaPresetKeys } from '@ace-pomelo/shared/server';
import { UserDatasourceService } from '../user-datasource';
import { AccountClaims, AccountProviderOptionsFactory } from './interfaces/account-provider-options.interface';

@Injectable()
export class AccountDBReadService implements AccountProviderOptionsFactory {
  constructor(private readonly userDatasourceService: UserDatasourceService) {}

  createAccountProviderOptions() {
    return {
      adapter: () => ({
        getAccount: async (options: XOR<{ id: number }, { username: string }>) => {
          const user = await this.userDatasourceService.getUser(options);

          if (!user) {
            return;
          }

          const claims: AccountClaims = {
            id: user.id,
            login_name: user.loginName,
            display_name: user.displayName,
            nice_name: user.niceName,
            url: user.url,
            updated_at: new Date(user.updatedAt).getTime(),
          };

          if (user.email) {
            claims.email = user.email;
            claims.email_verified = true;
          }

          if (user.mobile) {
            claims.phone_number = user.mobile;
            claims.phone_number_verified = true;
          }

          return claims;
        },
        getClaims: async (id: number) => {
          const metas = await this.userDatasourceService.getUserMetas(id, Object.values(UserMetaPresetKeys));

          return metas.reduce((acc, meta) => {
            const metaKey = meta.metaKey.startsWith(this.userDatasourceService.tablePrefix)
              ? meta.metaKey.substring(this.userDatasourceService.tablePrefix.length)
              : meta.metaKey;

            switch (metaKey) {
              case UserMetaPresetKeys.VerifingEmail:
                acc.email = meta.metaValue;
                acc.email_verified = false;
                break;
              case UserMetaPresetKeys.VerifingMobile:
                acc.phone_number = meta.metaValue;
                acc.phone_number_verified = false;
                break;
              case UserMetaPresetKeys.Capabilities:
                acc.role = meta.metaValue;
                break;
              default:
                acc[snakeCase(metaKey)] = meta.metaValue;
            }
            return acc;
          }, {} as Omit<AccountClaims, 'id'>);
        },
        getPhoneRegionCode: async () => {
          return this.userDatasourceService.getPhoneRegionCode();
        },
        verifyAccount: async (loginName: string, password: string) => {
          const user = await this.userDatasourceService.verifyUser(loginName, md5(password));
          return user ? String(user.id) : false;
        },
        updatePassword: async (
          options: XOR<{ id: number }, { username: string }> & { oldPwd: string; newPwd: string },
        ) => {
          await this.userDatasourceService.updatePassword({
            ...options,
            oldPwd: md5(options.oldPwd),
            newPwd: md5(options.newPwd),
          });
        },
        resetPassword: async (id: number, newPwd: string) => {
          await this.userDatasourceService.resetPassword(id, md5(newPwd));
        },
      }),
    };
  }
}
