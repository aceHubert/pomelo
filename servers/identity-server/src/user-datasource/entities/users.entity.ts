import { Optional, DataTypes } from 'sequelize';
import { UserStatus } from '@ace-pomelo/shared/server';
import { Model } from '../../datasource/sequelize/model/model';
import { UserMeta } from './user-meta.entity';

export interface UserAttributes {
  id: number;
  loginName: string;
  loginPwd: string;
  niceName: string;
  displayName: string;
  mobile?: string;
  email?: string;
  url: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Users
  extends Model<
    Omit<UserAttributes, 'createdAt' | 'updatedAt'>,
    Optional<Omit<UserAttributes, 'id' | 'createdAt' | 'updatedAt'>, 'status'>
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
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

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
      },
      loginPwd: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      niceName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      displayName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      mobile: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      email: {
        type: DataTypes.STRING(100),
        unique: true,
      },
      url: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: UserStatus.Disabled,
      },
    },
    {
      sequelize,
      tableName: `${prefix}users`,
    },
  );
};

Users.associate = function associate() {
  Users.hasMany(UserMeta, {
    foreignKey: 'userId',
    sourceKey: 'id',
    as: 'UserMetas',
    constraints: false,
  });
  UserMeta.belongsTo(Users, { foreignKey: 'userId', targetKey: 'id', constraints: false });
};
