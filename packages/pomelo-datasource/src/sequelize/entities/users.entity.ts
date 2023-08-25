import { Model, DataTypes } from 'sequelize';
import { UserStatus, UserAttributes, UserCreationAttributes } from '../../entities/users.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';
import { TableAssociateFunc } from '../interfaces/table-associate-func.interface';

export default class Users
  extends Model<
    Omit<UserAttributes, 'updatedAt' | 'createdAt'>,
    Omit<UserCreationAttributes, 'updatedAt' | 'createdAt'>
  >
  implements UserAttributes
{
  public static readonly associations = {};

  public id!: number;
  public loginName!: string;
  /**
   *  set 时密码会自动处理md5加密
   */
  public loginPwd!: string;
  public niceName!: string;
  public displayName!: string;
  public mobile!: string | null;
  public email!: string;
  public url!: string | null;
  public status!: UserStatus;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 初始化
export const init: TableInitFunc = function init(sequelize, { prefix }) {
  Users.init(
    {
      id: {
        // type: DataTypes.BIGINT({ unsigned: true }),
        type: DataTypes.BIGINT(),
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
        comment: 'Mobile number',
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Email address',
      },
      url: {
        type: DataTypes.STRING(200),
        comment: 'Home URL address',
      },
      status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: UserStatus.Enable,
        comment: 'User status (0 for disabled or 1 for enable, default: 1)',
      },
    },
    {
      sequelize,
      tableName: `${prefix}users`,
      indexes: [{ name: 'nice_name', fields: ['nice_name'] }],
      comment: 'Users',
    },
  );
};

// 关联
export const associate: TableAssociateFunc = function associate(models) {
  // Users.id <--> UserMeta.userId
  models.Users.hasMany(models.UserMeta, {
    foreignKey: 'userId',
    sourceKey: 'id',
    as: 'UserMetas',
    constraints: false,
  });
  models.UserMeta.belongsTo(models.Users, { foreignKey: 'userId', targetKey: 'id', constraints: false });
};
