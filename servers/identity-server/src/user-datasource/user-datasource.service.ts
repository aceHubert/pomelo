import { Inject, Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { CountryCode } from 'libphonenumber-js';
import { isEmail, isPhoneNumber } from 'class-validator';
import { Op, WhereOptions } from 'sequelize';
import { OptionPresetKeys, UserStatus, ValidationError } from '@ace-pomelo/shared/server';
import { Sequelize, SequelizeOptions } from '../datasource/sequelize/sequelize';
import { USER_DATASOURCE_OPTIONS } from './constants';
import { UserDatasourceOptions } from './interfaces/user-datasource-options.interface';
import { Options, UserAttributes, UserMeta, UserMetaAttributes, Users } from './entities';

@Injectable()
export class UserDatasourceService implements OnApplicationShutdown {
  private readonly logger = new Logger(UserDatasourceService.name, { timestamp: true });
  readonly sequelize: Readonly<Sequelize>;

  constructor(@Inject(USER_DATASOURCE_OPTIONS) private readonly options: UserDatasourceOptions) {
    const sequelizeOptions: SequelizeOptions = {
      models: [Options, Users, UserMeta],
      tablePrefix: options.tablePrefix,
      logging: false,
      define: {
        freezeTableName: true,
        underscored: true,
        timestamps: true,
        createdAt: true,
        updatedAt: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_520_ci',
      },
    };

    this.sequelize =
      typeof options.connection === 'string'
        ? new Sequelize(options.connection, sequelizeOptions)
        : new Sequelize({
            ...sequelizeOptions,
            ...options.connection,
            define: {
              ...sequelizeOptions.define,
              ...options.connection.define,
            },
          });
  }

  get tablePrefix() {
    return this.options.tablePrefix || '';
  }

  async getUser(options: XOR<{ id: number }, { username: string }>) {
    if (this.hasUserId(options)) {
      return Users.findByPk(options.id).then((user) => user?.toJSON() as UserAttributes | undefined);
    }

    return this.findUserByUsername((options as { username: string }).username);
  }

  async getUserMetas(userId: number, metaKeys: string[]) {
    return UserMeta.findAll({
      attributes: ['metaKey', 'metaValue'],
      where: {
        userId,
        metaKey: this.withTablePrefixedKeys(metaKeys),
      },
    }).then((metas) => metas.map((meta) => meta.toJSON() as UserMetaAttributes));
  }

  async getOption<T = string>(optionName: string): Promise<T | undefined> {
    const names = this.withTablePrefixedKeys([optionName]);
    const options = await Options.findAll({
      attributes: ['optionName', 'optionValue'],
      where: {
        optionName: names,
      },
    });

    const prefixedName = `${this.tablePrefix}${optionName}`;
    const option =
      options.find((option) => option.optionName === prefixedName) ||
      options.find((option) => option.optionName === optionName);
    return option?.optionValue as T | undefined;
  }

  async verifyUser(username: string, password: string) {
    const region = (await this.getPhoneRegionCode()) || 'CN';
    const user = await Users.findOne({
      where: {
        ...this.getUsernameWhere(username, region),
        loginPwd: password,
        status: UserStatus.Enabled,
      },
    });

    return user?.toJSON() as UserAttributes | undefined;
  }

  async updatePassword(options: XOR<{ id: number }, { username: string }> & { oldPwd: string; newPwd: string }) {
    const where = await this.getAccountWhere(options);
    const user = await Users.findOne({
      where: {
        ...where,
        loginPwd: options.oldPwd,
      },
    });

    if (!user) {
      throw new ValidationError('Old password is incorrect!');
    }
    if (user.status === UserStatus.Disabled) {
      throw new ValidationError('User is disabled!');
    }
    if (options.oldPwd === options.newPwd) {
      throw new ValidationError('New password is same with old!');
    }

    user.loginPwd = options.newPwd;
    await user.save();
  }

  async resetPassword(id: number, password: string) {
    const user = await Users.findByPk(id);
    if (!user) {
      throw new ValidationError('User does not exist!');
    }
    if (user.status === UserStatus.Disabled) {
      throw new ValidationError('User is disabled!');
    }

    user.loginPwd = password;
    await user.save();
  }

  async getPhoneRegionCode() {
    return this.getOption<CountryCode>(OptionPresetKeys.DefaultPhoneNumberRegion);
  }

  private async findUserByUsername(username: string) {
    const region = (await this.getPhoneRegionCode()) || 'CN';
    return Users.findOne({
      where: this.getUsernameWhere(username, region),
    }).then((user) => user?.toJSON() as UserAttributes | undefined);
  }

  private async getAccountWhere(
    options: XOR<{ id: number }, { username: string }>,
  ): Promise<WhereOptions<UserAttributes>> {
    if (this.hasUserId(options)) {
      return { id: options.id };
    }
    const region = (await this.getPhoneRegionCode()) || 'CN';
    return this.getUsernameWhere((options as { username: string }).username, region);
  }

  private hasUserId(options: XOR<{ id: number }, { username: string }>): options is { id: number } {
    return typeof (options as { id?: number }).id === 'number';
  }

  private getUsernameWhere(username: string, region: CountryCode): WhereOptions<UserAttributes> {
    return {
      [Op.or]: [
        { loginName: username },
        isEmail(username) && { email: username },
        isPhoneNumber(username, region) && { mobile: username },
      ].filter(Boolean) as any,
    };
  }

  private withTablePrefixedKeys(keys: string[]) {
    return Array.from(new Set(keys.flatMap((key) => [key, `${this.tablePrefix}${key}`])));
  }

  onApplicationShutdown() {
    this.sequelize?.close().catch((err) => this.logger.error(`Unable to close user datasource, Error: ${err.message}`));
  }
}
