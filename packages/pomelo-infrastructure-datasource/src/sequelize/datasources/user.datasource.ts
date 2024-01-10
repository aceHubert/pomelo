import { isUndefined } from 'lodash';
import { CountryCode } from 'libphonenumber-js';
import { isEmail, isPhoneNumber } from 'class-validator';
import { WhereOptions, Attributes, Op } from 'sequelize';
import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { ForbiddenError, ValidationError } from '@ace-pomelo/shared-server';
import { UserCapability } from '../helpers/user-capability';
import { UserMetaPresetKeys } from '../helpers/user-preset-keys';
import { default as User } from '../entities/users.entity';
import {
  UserStatus,
  UserModel,
  UserWithRoleModel,
  UserMetaModel,
  PagedUserArgs,
  PagedUserModel,
  NewUserInput,
  NewUserMetaInput,
  UpdateUserInput,
} from '../interfaces/user.interface';
import { OptionPresetKeys } from '../helpers/option-preset-keys';
import { MetaDataSource } from './meta.datasource';

@Injectable()
export class UserDataSource extends MetaDataSource<UserMetaModel, NewUserMetaInput> {
  constructor(protected readonly moduleRef: ModuleRef) {
    super(moduleRef);
  }

  /**
   * 获取当前用户信息
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @param fields 返回的字段（除密码以外的字段）
   * @param requestUserId 请求的用户Id
   */
  async get(fields: string[], requestUserId: number): Promise<UserModel | undefined>;
  /**
   * 匿名获取用户信息
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @param id 用户 Id
   * @param fields 返回的字段（"id" ,"loginName", "niceName", "displayName", "url" 字段）
   */
  async get(id: number, fields: string[]): Promise<UserModel | undefined>;
  /**
   * 获取用户信息 (需要权限验证)
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [EditUsers]
   * @param id 用户 Id
   * @param fields 返回的字段（除密码以外的字段）
   * @param requestUserId 请求的用户Id
   */
  async get(id: number, fields: string[], requestUserId: number): Promise<UserModel | undefined>;
  async get(
    ...args: [string[], number] | [number, string[]] | [number, string[], number]
  ): Promise<UserModel | undefined> {
    let id: number | undefined, fields: string[], requestUserId: number | undefined;

    if (args.length === 2) {
      if (typeof args[0] === 'number') {
        [id, fields] = args as [number, string[]];
      } else {
        [fields, requestUserId] = args as [string[], number];
      }
    } else {
      [id, fields, requestUserId] = args;
    }

    if (id && requestUserId && id !== requestUserId) {
      // 查询非自己时，需要权限验证
      await this.hasCapability(UserCapability.EditUsers, requestUserId, true);
    } else if (!id && requestUserId) {
      // 查询自己
      id = requestUserId;
    } else {
      // 匿名查询
      fields = fields.filter((field) => ['id', 'loginName', 'niceName', 'displayName', 'url'].includes(field));
    }

    // 排除登录密码
    fields = fields.filter((field) => field !== 'loginPwd');

    // 主键
    if (!fields.includes('id')) {
      fields.unshift('id');
    }

    return this.models.Users.findByPk(id!, {
      attributes: this.filterFields(fields, this.models.Users),
    }).then((user) => user?.toJSON() as any as UserModel);
  }

  private async getFieldValue<F extends keyof UserModel>(
    idOrUserName: number | string,
    field: F,
  ): Promise<Pick<UserModel, 'id' | F> | undefined> {
    const id = typeof idOrUserName === 'number' ? idOrUserName : undefined,
      username = id ? undefined : (idOrUserName as string),
      region = username ? await this.getOption<CountryCode>(OptionPresetKeys.DefaultPhoneNumberRegion) : undefined;

    if (id) {
      return this.models.Users.findByPk(id, {
        attributes: ['id', field],
      }).then((user) => user?.toJSON() as any as UserModel);
    } else {
      return this.models.Users.findOne({
        attributes: ['id', field],
        where: {
          [Op.or]: [
            { loginName: username },
            isEmail(username) && { email: username },
            isPhoneNumber(username!, region!) && { mobile: username },
          ].filter(Boolean) as any,
        },
      }).then((user) => user?.toJSON() as any as UserModel);
    }
  }

  /**
   * 获取用户邮箱
   * @param idOrUserName 用户 Id 或 登录名/邮箱/手机号码
   */
  async getEmail(idOrUserName: number | string): Promise<Pick<UserModel, 'id' | 'email'> | undefined> {
    return this.getFieldValue(idOrUserName, 'email');
  }

  /**
   * 获取用户手机号码
   * @param idOrUserName 用户 Id 或 登录名/邮箱/手机号码
   */
  async getMobile(idOrUserName: number | string): Promise<Pick<UserModel, 'id' | 'mobile'> | undefined> {
    return this.getFieldValue(idOrUserName, 'mobile');
  }

  /**
   * 获取用户分页列表
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [ListUsers]
   * @param query 分页 Query 参数
   * @param fields 返回的字段
   * @param requestUserId 请求的用户Id
   */
  async getPaged(
    { offset, limit, ...query }: PagedUserArgs,
    fields: string[],
    requestUserId: number,
  ): Promise<PagedUserModel> {
    await this.hasCapability(UserCapability.ListUsers, requestUserId, true);

    const where: WhereOptions<Attributes<User>> = {};
    if (query.keyword) {
      // @ts-expect-error type error
      where[Op.or] = [
        {
          loginName: {
            [Op.like]: `%${query.keyword}%`,
          },
        },
        {
          displayName: {
            [Op.like]: `%${query.keyword}%`,
          },
        },
      ];
    }
    if (query.status) {
      where['status'] = query.status;
    }

    if (!isUndefined(query.capabilities)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      where[`$UserMetas.${this.field('metaValue', this.models.UserMeta)}$` as keyof UserAttributes] =
        query.capabilities === null
          ? {
              [Op.is]: null,
            }
          : query.capabilities;
    }

    // 排除登录密码
    fields = fields.filter((field) => field !== 'loginPwd');

    return this.models.Users.findAndCountAll({
      attributes: this.filterFields(fields, this.models.Users),
      include: [
        {
          model: this.models.UserMeta,
          as: 'UserMetas',
          where: {
            metaKey: `${this.tablePrefix}${UserMetaPresetKeys.Capabilities}`,
          },
          required: false,
          duplicating: false,
        },
      ],
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    }).then(({ rows, count: total }) => ({
      rows: rows.map((row) => {
        const { UserMetas, ...rest } = row.toJSON() as any as UserModel & { UserMetas: UserMetaModel[] };
        return {
          capabilities: UserMetas.length ? UserMetas[0].metaValue : null,
          ...rest,
        } as UserWithRoleModel;
      }),
      total,
    }));
  }

  /**
   * 获取用户角色权限
   * @param userId 用户 Id
   */
  getCapabilities(userId: number): Promise<UserCapability[]> {
    return this.getUserCapabilities(userId);
  }

  /**
   * 根据状态分组获取数量
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param type 类型
   */
  getCountByStatus() {
    return this.models.Users.count({
      attributes: ['status'],
      group: 'status',
    });
  }

  /**
   * 按角色分组获取数量
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   */
  getCountByRole() {
    return this.models.Users.count({
      attributes: [
        [this.sequelize.fn('ifnull', this.col('metaValue', this.models.UserMeta, 'UserMetas'), 'none'), 'userRole'],
      ],
      include: [
        {
          model: this.models.UserMeta,
          as: 'UserMetas',
          where: {
            metaKey: `${this.tablePrefix}${UserMetaPresetKeys.Capabilities}`,
          },
          required: false,
          duplicating: false,
        },
      ],
      group: 'userRole',
    });
  }

  /**
   * 判断登录名是否在在
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param loginName 登录名
   */
  isLoginNameExists(loginName: string): Promise<boolean> {
    return this.models.Users.count({
      where: {
        loginName,
      },
    }).then((count) => count > 0);
  }

  /**
   * 判断手机号码是否在在
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param mobile 手机号码
   */
  isMobileExists(mobile: string): Promise<boolean> {
    return this.models.Users.count({
      where: {
        mobile,
      },
    }).then((count) => count > 0);
  }

  /**
   * 判断电子邮箱是否在在
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param email 电子邮箱
   */
  isEmailExists(email: string): Promise<boolean> {
    return this.models.Users.count({
      where: {
        email,
      },
    }).then((count) => count > 0);
  }

  /**
   * 添加用户，loginName, mobile, emaile 要求必须是唯一，否则会抛出 ValidationError
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [CreateUsers]
   * @param model 添加实体模型
   * @param fields 返回的字段
   * @param requestUserId 请求的用户Id
   */
  async create(model: NewUserInput, requestUserId: number): Promise<UserModel> {
    await this.hasCapability(UserCapability.CreateUsers, requestUserId, true);

    if (model.loginName && (await this.isLoginNameExists(model.loginName))) {
      throw new ValidationError(
        this.translate('datasource.user.username_unique_required', 'Username is reqiured to be unique!'),
      );
    }

    if (model.email && (await this.isEmailExists(model.email))) {
      throw new ValidationError(
        this.translate('datasource.user.email_unique_required', `Email is reqiured to be unique!`),
      );
    }

    if (model.mobile && (await this.isMobileExists(model.mobile))) {
      throw new ValidationError(
        this.translate('datasource.user.mobile_unique_required', 'Mobile is reqiured to be unique!'),
      );
    }

    const t = await this.sequelize.transaction();
    try {
      const user = await this.models.Users.create(
        {
          loginName: model.loginName,
          loginPwd: model.loginPwd,
          niceName: model.loginName,
          displayName: model.loginName,
          mobile: model.mobile,
          email: model.email,
          url: model.url,
        },
        { transaction: t },
      );

      let metaCreationModels: NewUserMetaInput[] = [
        {
          userId: user.id,
          metaKey: UserMetaPresetKeys.NickName,
          metaValue: model.loginName,
        },
        {
          userId: user.id,
          metaKey: UserMetaPresetKeys.FirstName,
          metaValue: model.firstName || '',
        },
        {
          userId: user.id,
          metaKey: UserMetaPresetKeys.LastName,
          metaValue: model.lastName || '',
        },
        {
          userId: user.id,
          metaKey: UserMetaPresetKeys.Avatar,
          metaValue: model.avator || '',
        },
        {
          userId: user.id,
          metaKey: UserMetaPresetKeys.Description,
          metaValue: model.description || '',
        },
        {
          userId: user.id,
          metaKey: UserMetaPresetKeys.Locale,
          metaValue: model.locale || '',
        },
        {
          userId: user.id,
          metaKey: UserMetaPresetKeys.AdminColor,
          metaValue: model.adminColor || '',
        },
        {
          userId: user.id,
          metaKey: `${this.tablePrefix}${UserMetaPresetKeys.Capabilities}`,
          metaValue: model.capabilities,
        },
      ];
      // 添加元数据
      if (model.metas) {
        metaCreationModels = metaCreationModels.concat(
          model.metas.map((meta) => ({
            ...meta,
            userId: user.id,
          })),
        );
      }

      await this.models.UserMeta.bulkCreate(metaCreationModels, { transaction: t });

      await t.commit();

      // 排除登录密码
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { loginPwd, ...restUser } = user.toJSON();
      return restUser as UserModel;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 修改用户，mobile, email 要求必须是唯一，否则会抛出 ValidationError
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [EditUsers(修改非自己信息)]
   * @param id 用户 Id
   * @param model 修改实体模型
   * @param requestUserId 请求的用户Id
   */
  async update(id: number, model: UpdateUserInput, requestUserId: number): Promise<void> {
    // 修改非自己信息
    if (id !== requestUserId) {
      await this.hasCapability(UserCapability.EditUsers, requestUserId, true);
    }

    const user = await this.models.Users.findByPk(id);
    if (user) {
      const { nickName, firstName, lastName, avator, description, adminColor, capabilities, locale, ...updateUser } =
        model;
      const t = await this.sequelize.transaction();
      try {
        await this.models.Users.update(updateUser, {
          where: { id },
          transaction: t,
        });

        if (!isUndefined(firstName)) {
          await this.models.UserMeta.update(
            { metaValue: firstName },
            {
              where: {
                userId: id,
                metaKey: UserMetaPresetKeys.FirstName,
              },
              transaction: t,
            },
          );
        }
        if (!isUndefined(lastName)) {
          await this.models.UserMeta.update(
            { metaValue: lastName },
            {
              where: {
                userId: id,
                metaKey: UserMetaPresetKeys.LastName,
              },
              transaction: t,
            },
          );
        }

        if (!isUndefined(nickName)) {
          await this.models.UserMeta.update(
            { metaValue: nickName },
            {
              where: {
                userId: id,
                metaKey: UserMetaPresetKeys.NickName,
              },
              transaction: t,
            },
          );
        }

        if (!isUndefined(avator)) {
          await this.models.UserMeta.update(
            { metaValue: avator },
            {
              where: {
                userId: id,
                metaKey: UserMetaPresetKeys.Avatar,
              },
              transaction: t,
            },
          );
        }

        if (!isUndefined(locale)) {
          await this.models.UserMeta.update(
            { metaValue: locale === null ? '' : locale },
            {
              where: {
                userId: id,
                metaKey: UserMetaPresetKeys.Locale,
              },
              transaction: t,
            },
          );
        }

        if (!isUndefined(description)) {
          await this.models.UserMeta.update(
            { metaValue: description },
            {
              where: {
                userId: id,
                metaKey: UserMetaPresetKeys.Description,
              },
              transaction: t,
            },
          );
        }

        if (!isUndefined(adminColor)) {
          await this.models.UserMeta.update(
            { metaValue: adminColor },
            {
              where: {
                userId: id,
                metaKey: UserMetaPresetKeys.AdminColor,
              },
              transaction: t,
            },
          );
        }

        if (!isUndefined(capabilities)) {
          await this.models.UserMeta.update(
            { metaValue: capabilities === null ? undefined : capabilities },
            {
              where: {
                userId: id,
                metaKey: `${this.tablePrefix}${UserMetaPresetKeys.Capabilities}`,
              },
              transaction: t,
            },
          );
        }

        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }
    throw new ValidationError(this.translate('datasource.user.user_does_not_exist', 'User does not exist!'));
  }

  /**
   * 修改用户Email
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [EditUsers(修改非自己信息)]
   * @param id 用户 Id
   * @param email Email
   * @param requestUserId 请求的用户Id
   */
  async updateEmail(id: number, email: string, requestUserId: number): Promise<void> {
    // 修改非自己信息
    if (id !== requestUserId) {
      await this.hasCapability(UserCapability.EditUsers, requestUserId, true);
    }

    const user = await this.models.Users.findByPk(id);
    if (user) {
      if (user.status === UserStatus.Disabled) {
        throw new ValidationError(this.translate('datasource.user.user_disabled', 'User is disabled!'));
      }
      if (email === user.email) {
        throw new ValidationError(this.translate('datasource.user.email_same_with_old', 'Email is same with old!'));
      }
      if (await this.isEmailExists(email)) {
        throw new ValidationError(
          this.translate('datasource.user.email_unique_required', 'Email is reqiured to be unique!'),
        );
      }

      user.email = email;
      await user.save();
    }

    throw new ValidationError(this.translate('datasource.user.user_does_not_exist', 'User does not exist!'));
  }

  /**
   * 修改用户手机号码
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [EditUsers(修改非自己信息)]
   * @param id 用户 Id
   * @param mobile 手机号码
   * @param requestUserId 请求的用户Id
   */
  async updateMobile(id: number, mobile: string, requestUserId: number): Promise<void> {
    // 修改非自己信息
    if (id !== requestUserId) {
      await this.hasCapability(UserCapability.EditUsers, requestUserId, true);
    }

    const user = await this.models.Users.findByPk(id);
    if (user) {
      if (user.status === UserStatus.Disabled) {
        throw new ValidationError(this.translate('datasource.user.user_disabled', 'User is disabled!'));
      }
      if (mobile === user.mobile) {
        throw new ValidationError(this.translate('datasource.user.mobile_same_with_old', 'Mobile is same with old!'));
      }
      if (await this.isMobileExists(mobile)) {
        throw new ValidationError(
          this.translate('datasource.user.mobile_unique_required', 'Mobile is reqiured to be unique!'),
        );
      }

      user.mobile = mobile;
      await user.save();
    }

    throw new ValidationError(this.translate('datasource.user.user_does_not_exist', 'User does not exist!'));
  }

  /**
   * 修改用户状态
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [EditUsers]
   * @param id 用户 Id
   * @param status 状态
   * @param requestUserId 请求的用户Id
   */
  async updateStatus(id: number, status: UserStatus, requestUserId: number): Promise<void> {
    await this.hasCapability(UserCapability.EditUsers, requestUserId, true);

    await this.models.Users.update(
      { status },
      {
        where: {
          id,
        },
      },
    );
  }

  /**
   * 通过用户Id修改密码
   * @param id 用户 Id
   * @param oldPwd 旧密码
   * @param newPwd 新密码
   */
  async updateLoginPwd(id: number, oldPwd: string, newPwd: string): Promise<void>;
  /**
   * 通过用户名修改密码
   * @param username 登录名/邮箱/手机号码
   * @param oldPwd 旧密码
   * @param newPwd 新密码
   */
  async updateLoginPwd(username: string, oldPwd: string, newPwd: string): Promise<void>;
  async updateLoginPwd(idOrUsername: number | string, oldPwd: string, newPwd: string): Promise<void> {
    const id = typeof idOrUsername === 'number' ? idOrUsername : undefined,
      username = id ? undefined : (idOrUsername as string),
      region = username ? await this.getOption<CountryCode>(OptionPresetKeys.DefaultPhoneNumberRegion) : undefined;
    const user = id
      ? await this.models.Users.findOne({
          where: {
            id,
            loginPwd: oldPwd,
          },
        })
      : await this.models.Users.findOne({
          where: {
            [Op.or]: [
              { loginName: username },
              isEmail(username) && { email: username },
              isPhoneNumber(username!, region!) && { mobile: username },
            ].filter(Boolean) as any,
            loginPwd: oldPwd,
          },
        });

    // 旧密码可以找到用户
    if (user) {
      if (user.status === UserStatus.Disabled) {
        throw new ValidationError(this.translate('datasource.user.user_disabled', 'User is disabled!'));
      } else if (oldPwd === newPwd) {
        throw new ValidationError(
          this.translate('datasource.user.new_password_same_with_old', 'New password is same with old!'),
        );
      }

      user.loginPwd = newPwd;
      await user.save();
    }

    throw new ValidationError(this.translate('datasource.user.old_password_incorrect', 'Old password is incorrect!'));
  }

  /**
   * 重置密码
   * @param id 用户 Id
   * @param password 新密码
   */
  async resetLoginPwd(id: number, password: string): Promise<void> {
    const user = await this.models.Users.findByPk(id);
    if (user) {
      if (user.status === UserStatus.Disabled) {
        throw new ValidationError(this.translate('datasource.user.user_disabled', 'User is disabled!'));
      }
      user.loginPwd = password;
      user.save();
    }
    throw new ValidationError(this.translate('datasource.user.user_does_not_exist', 'User does not exist!'));
  }

  /**
   * 验证用户登录账号密码
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param username 登录名/邮箱/手机号码
   * @param password 登录密码
   */
  async verifyUser(username: string, password: string): Promise<false | UserModel> {
    const region = await this.getOption<CountryCode>(OptionPresetKeys.DefaultPhoneNumberRegion);
    const user = await this.models.Users.findOne({
      where: {
        [Op.or]: [
          { loginName: username },
          isEmail(username) && { email: username },
          isPhoneNumber(username, region) && { mobile: username },
        ].filter(Boolean) as any,
        loginPwd: password,
        status: true,
      },
    });
    if (!user) return false;

    // 排除登录密码
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { loginPwd: pwd, ...restUser } = user.toJSON();
    return restUser as UserModel;
  }

  /**
   * 删除用户
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [DeleteUsers]
   * @param id 用户 Id
   * @param requestUserId 请求的用户Id
   */
  async delete(id: number, requestUserId: number): Promise<void> {
    await this.hasCapability(UserCapability.DeleteUsers, requestUserId, true);

    if (id === requestUserId) {
      throw new ForbiddenError(this.translate('datasource.user.delete_self_forbidden', `Could not delete yourself!`));
    }

    const t = await this.sequelize.transaction();
    try {
      await this.models.UserMeta.destroy({
        where: { userId: id },
        transaction: t,
      });
      await this.models.Users.destroy({
        where: { id },
        transaction: t,
      });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 批量删除用户
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [DeleteUsers]
   * @param id 用户 Id
   * @param requestUserId 请求的用户Id
   */
  async bulkDelete(ids: number[], requestUserId: number): Promise<void> {
    await this.hasCapability(UserCapability.DeleteUsers, requestUserId, true);

    if (ids.includes(requestUserId)) {
      throw new ForbiddenError(this.translate('datasource.user.delete_self_forbidden', `Could not delete yourself!`));
    }

    const t = await this.sequelize.transaction();
    try {
      await this.models.UserMeta.destroy({
        where: { userId: ids },
        transaction: t,
      });
      await this.models.Users.destroy({
        where: { id: ids },
        transaction: t,
      });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
