import { DataTypes } from 'sequelize';
import { Model } from '../../datasource/sequelize/model/model';

export interface UserMetaAttributes {
  id: number;
  userId: number;
  metaKey: string;
  metaValue?: string;
}

export class UserMeta extends Model<UserMetaAttributes, Omit<UserMetaAttributes, 'id'>> {
  public id!: number;
  public userId!: number;
  public metaKey!: string;
  public metaValue?: string;
}

UserMeta.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  UserMeta.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
      },
      metaKey: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metaValue: {
        type: new DataTypes.TEXT('long'),
      },
    },
    {
      sequelize,
      tableName: `${prefix}usermeta`,
      indexes: [{ name: 'user_meta_keys', fields: ['user_id', 'meta_key'], unique: true }],
      createdAt: false,
      updatedAt: false,
    },
  );
};
