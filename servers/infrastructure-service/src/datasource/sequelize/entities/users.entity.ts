import { Optional, DataTypes } from 'sequelize';
import { UserStatus } from '@ace-pomelo/shared/server';
import { UserAttributes, UserCreationAttributes } from '../../entities/users.entity';
import { Model } from '../model/model';
import { UserMeta } from './user-meta.entity';

export class Users
  extends Model<
    Omit<UserAttributes, 'updatedAt' | 'createdAt'>,
    Optional<Omit<UserCreationAttributes, 'id' | 'updatedAt' | 'createdAt'>, 'status'>
  >
  implements UserAttributes
{
  public id!: number;
  public loginName!: string;
  public loginPwd!: string;
  public niceName!: string;
  public displayName!: string;
  public mobile?: string;
  public email?: string;
  public url!: string;
  public status!: UserStatus;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化
Users.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  Users.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      loginName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Login name',
      },
      loginPwd: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Login password',
      },
      niceName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Nice name (display at the URL address, must be unique)',
      },
      displayName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Display name (display at the front-end apps)',
      },
      mobile: {
        type: DataTypes.STRING(50),
        unique: true,
        comment: 'Phone number',
      },
      email: {
        type: DataTypes.STRING(100),
        unique: true,
        comment: 'Email address',
      },
      url: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Home URL address',
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: UserStatus.Disabled,
        comment: 'User status (0 for disabled or 1 for enabled, default: disabled)',
      },
    },
    {
      sequelize,
      tableName: `${prefix}users`,
      comment: 'Users',
    },
  );
};

// 关联
Users.associate = function associate() {
  // Users.id <--> UserMeta.userId
  Users.hasMany(UserMeta, {
    foreignKey: 'userId',
    sourceKey: 'id',
    as: 'UserMetas',
    constraints: false,
  });
  UserMeta.belongsTo(Users, { foreignKey: 'userId', targetKey: 'id', constraints: false });
};
