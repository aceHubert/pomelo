import { Model, DataTypes } from 'sequelize';
import { UserMetaAttributes, UserMetaCreationAttributes } from '@/orm-entities/interfaces';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class UserMeta extends Model<UserMetaAttributes, UserMetaCreationAttributes> {
  public id!: number;
  public userId!: number;
  public metaKey!: string;
  public metaValue?: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  UserMeta.init(
    {
      id: {
        // type: DataTypes.BIGINT({ unsigned: true }),
        type: DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        // type: DataTypes.BIGINT({ unsigned: true }),
        type: DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
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
      indexes: [
        { name: 'user_id', fields: ['user_id'] },
        { name: 'meta_key', fields: ['meta_key'] },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'User metas',
    },
  );
};
