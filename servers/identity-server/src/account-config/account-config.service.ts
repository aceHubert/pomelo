import { snakeCase } from 'lodash';
import { CountryCode } from 'libphonenumber-js';
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { md5, UserMetaPresetKeys, OptionPresetKeys, POMELO_SERVICE_PACKAGE_NAME } from '@ace-pomelo/shared/server';
import { UserServiceClient, USER_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/user';
import { OptionServiceClient, OPTION_SERVICE_NAME } from '@ace-pomelo/shared/server/proto-ts/option';
import {
  AccountProviderOptionsFactory,
  AccountClaims,
} from '../account-provider/interfaces/account-provider-options.interface';

/**
 * 账户配置服务
 * 使用 gRPC 方式与用户服务和选项服务通信
 */
@Injectable()
export class AccountConfigService implements AccountProviderOptionsFactory, OnModuleInit {
  private userServiceClient!: UserServiceClient;
  private optionServiceClient!: OptionServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private client: ClientGrpc) {}

  /**
   * 初始化 gRPC 客户端
   * 在模块初始化时从 ClientGrpc 获取用户服务和选项服务客户端
   */
  onModuleInit() {
    this.userServiceClient = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
    this.optionServiceClient = this.client.getService<OptionServiceClient>(OPTION_SERVICE_NAME);
  }

  /**
   * 创建账户提供者选项
   * 返回账户适配器的各种方法实现
   */
  createAccountProviderOptions() {
    return {
      adapter: () => ({
        /**
         * 获取账户信息
         * @param options 用户ID或用户名
         * @returns 账户声明信息或undefined
         */
        getAccount: async (options: XOR<{ id: number }, { username: string }>) => {
          // 通过 gRPC 调用获取用户信息
          const { user } = await this.userServiceClient
            .getRequestUser({
              ...options,
              fields: ['id', 'loginName', 'niceName', 'displayName', 'email', 'mobile', 'url', 'updatedAt'],
            })
            .lastValue();

          if (user) {
            const claims: AccountClaims = {
              id: user.id,
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

        /**
         * 获取用户声明信息
         * @param id 用户ID
         * @returns 用户元数据声明
         */
        getClaims: async (id: number) => {
          // 调用 gRPC 获取用户元数据
          const { metas } = await this.userServiceClient
            .getMetas({
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

        /**
         * 获取手机区域代码
         * @returns 国家/地区代码或undefined
         */
        getPhoneRegionCode: async () => {
          // 获取默认手机区号配置
          const { optionValue } = await this.optionServiceClient
            .getValue({
              optionName: OptionPresetKeys.DefaultPhoneNumberRegion,
            })
            .lastValue();

          return optionValue as CountryCode | undefined;
        },

        /**
         * 验证用户账户
         * @param loginName 登录名
         * @param password 密码
         * @returns 验证成功返回用户ID字符串，失败返回false
         */
        verifyAccount: async (loginName: string, password: string) => {
          // 验证用户凭据
          const { verified, user } = await this.userServiceClient
            .verifyUser({
              username: loginName,
              password: md5(password),
            })
            .lastValue();

          if (verified && user) {
            return String(user.id);
          }
          return false;
        },

        /**
         * 更新用户密码
         * @param options 包含用户标识和新旧密码
         */
        updatePassword: async (
          options: XOR<{ id: number }, { username: string }> & { oldPwd: string; newPwd: string },
        ) => {
          // 更新登录密码
          await this.userServiceClient
            .updateLoginPassword({
              ...options,
              oldPwd: md5(options.oldPwd),
              newPwd: md5(options.newPwd),
            })
            .lastValue();
        },

        /**
         * 重置用户密码
         * @param id 用户ID
         * @param newPwd 新密码
         */
        resetPassword: async (id: number, newPwd: string) => {
          // 管理员重置用户密码
          await this.userServiceClient
            .resetLoginPassword({
              requestUserId: id,
              newPwd: md5(newPwd),
            })
            .lastValue();
        },
      }),
    };
  }
}
