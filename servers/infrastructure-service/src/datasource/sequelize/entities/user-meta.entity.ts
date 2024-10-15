import { DataTypes } from 'sequelize';
import { UserMetaAttributes, UserMetaCreationAttributes } from '../../entities/user-meta.entity';
import { Model } from '../model/model';

export class UserMeta extends Model<UserMetaAttributes, Omit<UserMetaCreationAttributes, 'id'>> {
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
        comment: 'User id',
      },
      metaKey: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Meta key',
      },
      metaValue: {
        type: new DataTypes.TEXT('long'),
        comment: 'Meta value',
      },
    },
    {
      sequelize,
      tableName: `${prefix}usermeta`,
      indexes: [{ name: 'user_meta_keys', fields: ['user_id', 'meta_key'], unique: true }],
      createdAt: false,
      updatedAt: false,
      comment: 'User metas',
    },
  );
};
