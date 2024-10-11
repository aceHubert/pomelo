import { DataTypes } from 'sequelize';
import { CommentMetaAttributes, CommentMetaCreationAttributes } from '../../entities/comment-meta.entity';
import { Model } from '../model/model';

export class CommentMeta extends Model<CommentMetaAttributes, Omit<CommentMetaCreationAttributes, 'id'>> {
  public id!: number;
  public commentId!: number;
  public metaKey!: string;
  public metaValue?: string;
}

CommentMeta.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  CommentMeta.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      commentId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
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
      indexes: [{ name: 'comment_meta_keys', fields: ['comment_id', 'meta_key'], unique: true }],
      createdAt: false,
      updatedAt: false,
      comment: 'Comment metas',
    },
  );
};
