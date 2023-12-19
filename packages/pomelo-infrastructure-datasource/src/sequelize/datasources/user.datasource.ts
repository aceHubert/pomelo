import md5 from 'md5';
import { isUndefined } from 'lodash';
import { CountryCode } from 'libphonenumber-js';
import { isEmail, isPhoneNumber } from 'class-validator';
import { WhereOptions, Attributes, Op } from 'sequelize';
import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { ForbiddenError, ValidationError, RequestUser } from '@ace-pomelo/shared-server';
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
   * 根据 Id 获取用户（不包含登录密码）
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [EditUsers(optional)]
   * @param id 用户 Id（null 则查询请求用户，否则 id 不是自己时需要 EditUsers 权限）
   * @param fields 返回的字段
   */
  async get(id: number | null, fields: string[], requestUser: RequestUser): Promise<UserModel | undefined> {
    // 查询非自己时，需要权限验证
    if (id && id !== Number(requestUser.sub)) {
      await this.hasCapability(UserCapability.EditUsers, requestUser, true);
    } else {
      id = Number(requestUser.sub);
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

  /**
   * 获取用户分页列表
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [ListUsers]
   * @param query 分页 Query 参数
   * @param fields 返回的字段
   */
  async getPaged(
    { offset, limit, ...query }: PagedUserArgs,
    fields: string[],
    requestUser: RequestUser,
  ): Promise<PagedUserModel> {
    await this.hasCapability(UserCapability.ListUsers, requestUser, true);

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
  async isLoginNameExists(loginName: string): Promise<boolean> {
    return (
      (await this.models.Users.count({
        where: {
          loginName,
        },
      })) > 0
    );
  }

  /**
   * 判断手机号码是否在在
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param mobile 手机号码
   */
  async isMobileExists(mobile: string): Promise<boolean> {
    return (
      (await this.models.Users.count({
        where: {
          mobile,
        },
      })) > 0
    );
  }

  /**
   * 判断电子邮箱是否在在
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param email 电子邮箱
   */
  async isEmailExists(email: string): Promise<boolean> {
    return (
      (await this.models.Users.count({
        where: {
          email,
        },
      })) > 0
    );
  }

  /**
   * 添加用户
   * loginName, mobile, emaile 要求必须是唯一，否则会抛出 ValidationError
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [CreateUsers]
   * @param model 添加实体模型
   * @param fields 返回的字段
   */
  async create(model: NewUserInput, requestUser: RequestUser): Promise<UserModel> {
    await this.hasCapability(UserCapability.CreateUsers, requestUser, true);

    if (model.loginName && (await this.isLoginNameExists(model.loginName))) {
      throw new ValidationError(
        await this.translate('datasource.user.username_unique_required', 'Username is reqiured to be unique!', {
          lang: requestUser.lang,
        }),
      );
    }

    if (model.email && (await this.isEmailExists(model.email))) {
      throw new ValidationError(
        await this.translate('datasource.user.email_unique_required', `Email is reqiured to be unique!`, {
          lang: requestUser.lang,
        }),
      );
    }

    if (model.mobile && (await this.isMobileExists(model.mobile))) {
      throw new ValidationError(
        await this.translate('datasource.user.mobile_unique_required', 'Mobile is reqiured to be unique!', {
          lang: requestUser.lang,
        }),
      );
    }

    const t = await this.sequelize.transaction();
    try {
      const user = await this.models.Users.create(
        {
          loginName: model.loginName,
          loginPwd: md5(model.loginPwd),
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
      const { loginPwd: pwd, ...restUser } = user.toJSON();
      return restUser as UserModel;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 修改用户
   * mobile, email 要求必须是唯一，否则会抛出 ValidationError
   * todo: 修改了角色后要重置 access_token
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [EditUsers(修改非自己信息)]
   * @param id 用户 Id
   * @param model 修改实体模型
   * @param requestUser 请求的用户
   */
  async update(id: number, model: UpdateUserInput, requestUser: RequestUser): Promise<boolean> {
    // 修改非自己信息
    if (id !== Number(requestUser.sub)) {
      await this.hasCapability(UserCapability.EditUsers, requestUser, true);
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
        return true;
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }
    return false;
  }

  /**
   * 修改用户Email
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [EditUsers(修改非自己信息)]
   * @param id 用户 Id
   * @param email Email
   * @param requestUser 请求的用户
   */
  async updateEmail(id: number, email: string, requestUser: RequestUser): Promise<boolean> {
    // 修改非自己信息
    if (id !== Number(requestUser.sub)) {
      await this.hasCapability(UserCapability.EditUsers, requestUser, true);
    }

    const user = await this.models.Users.findByPk(id);
    if (user) {
      // 相同不需要修改
      if (email === user.email) {
        return true;
      }
      if (await this.isEmailExists(email)) {
        throw new ValidationError(
          await this.translate('datasource.user.email_unique_required', 'Email is reqiured to be unique!', {
            lang: requestUser.lang,
          }),
        );
      }

      user.email = email;
      await user.save();
      return true;
    }
    return false;
  }

  /**
   * 修改用户手机号码
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [EditUsers(修改非自己信息)]
   * @param id 用户 Id
   * @param mobile 手机号码
   * @param requestUser 请求的用户
   */
  async updateMobile(id: number, mobile: string, requestUser: RequestUser): Promise<boolean> {
    // 修改非自己信息
    if (id !== Number(requestUser.sub)) {
      await this.hasCapability(UserCapability.EditUsers, requestUser, true);
    }

    const user = await this.models.Users.findByPk(id);
    if (user) {
      // 相同不需要修改
      if (mobile === user.mobile) {
        return true;
      }
      if (await this.isMobileExists(mobile)) {
        throw new ValidationError(
          await this.translate('datasource.user.mobile_unique_required', 'Mobile is reqiured to be unique!', {
            lang: requestUser.lang,
          }),
        );
      }

      user.mobile = mobile;
      await user.save();
      return true;
    }
    return false;
  }

  /**
   * 修改用户状态
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [EditUsers]
   * @param id 用户 Id
   * @param status 状态
   */
  async updateStatus(id: number, status: UserStatus, requestUser: RequestUser): Promise<boolean> {
    await this.hasCapability(UserCapability.EditUsers, requestUser, true);

    return await this.models.Users.update(
      { status },
      {
        where: {
          id,
        },
      },
    ).then(([count]) => count > 0);
  }

  /**
   * 修改密码
   * 旧密码不正确返回 false
   * @param userId 用户 Id
   * @param oldPwd 旧密码
   * @param newPwd 新密码
   * @returns
   */
  async updateLoginPwd(userId: number, oldPwd: string, newPwd: string): Promise<boolean> {
    const user = await this.models.Users.findOne({
      where: {
        id: userId,
        loginPwd: md5(oldPwd),
      },
    });

    // 旧密码可以找到用户
    if (user) {
      user.loginPwd = newPwd;
      await user.save();
      return true;
    }
    return false;
  }

  /**
   * 删除用户
   * Super Admin 无法删除，抛出 ForbiddenError 错误
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [DeleteUsers]
   * @param id 用户 Id
   */
  async delete(id: number, requestUser: RequestUser): Promise<true> {
    await this.hasCapability(UserCapability.DeleteUsers, requestUser, true);

    if (id === Number(requestUser.sub)) {
      throw new ForbiddenError(
        await this.translate('datasource.user.delete_self_forbidden', `Could not delete yourself!`, {
          lang: requestUser.lang,
        }),
      );
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
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 批量删除用户
   * Super Admin 无法删除，抛出 ForbiddenError 错误
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [DeleteUsers]
   * @param id 用户 Id
   */
  async bulkDelete(ids: number[], requestUser: RequestUser): Promise<true> {
    await this.hasCapability(UserCapability.DeleteUsers, requestUser, true);

    if (ids.includes(Number(requestUser.sub))) {
      throw new ForbiddenError(
        await this.translate('datasource.user.delete_self_forbidden', `Could not delete yourself!`, {
          lang: requestUser.lang,
        }),
      );
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
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 验证用户登录账号密码
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param loginName 登录名/邮箱/手机号码
   * @param loginPwd 登录密码
   */
  async verifyUser(loginName: string, loginPwd: string): Promise<false | UserModel> {
    const region = await this.getOption<CountryCode>(OptionPresetKeys.DefaultPhoneNumberRegion);
    const user = await this.models.Users.findOne({
      where: {
        [Op.or]: [
          { loginName },
          isEmail(loginName) && { email: loginName },
          isPhoneNumber(loginName, region) && { mobile: loginName },
        ].filter(Boolean) as any,
        loginPwd: md5(loginPwd),
        status: true,
      },
    });
    if (!user) return false;

    // 排除登录密码
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { loginPwd: pwd, ...restUser } = user.toJSON();
    return restUser as UserModel;
  }
}
