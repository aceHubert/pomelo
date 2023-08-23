import { Model, DataTypes } from 'sequelize';
import { CommentMetaAttributes, CommentMetaCreationAttributes } from '@/orm-entities/interfaces/comment-meta.interface';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class CommentMeta extends Model<CommentMetaAttributes, CommentMetaCreationAttributes> {
  public id!: number;
  public commentId!: number;
  public metaKey!: string;
  public metaValue?: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  CommentMeta.init(
    {
      id: {
        // type: DataTypes.BIGINT({ unsigned: true }),
        type: DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      commentId: {
        // type: DataTypes.BIGINT({ unsigned: true }),
        type: DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
        comment: 'Comment id',
      },
      metaKey: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Meta key',
      },
      metaValue: {
        type: DataTypes.TEXT('long'),
        comment: 'Meta value',
      },
    },
    {
      sequelize,
      tableName: `${prefix}commentmeta`,
      indexes: [
        { name: 'comment_id', fields: ['comment_id'] },
        { name: 'meta_key', fields: ['meta_key'] },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'Comment metas',
    },
  );
};
