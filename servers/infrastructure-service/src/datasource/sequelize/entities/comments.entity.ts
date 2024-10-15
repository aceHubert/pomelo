import { Optional, DataTypes } from 'sequelize';
import { CommentType } from '@ace-pomelo/shared/server';
import { CommentAttributes, CommentCreationAttributes } from '../../entities/comments.entity';
import { Model } from '../model/model';
import { CommentMeta } from './comment-meta.entity';

export class Comments extends Model<
  Omit<CommentAttributes, 'updatedAt' | 'createdAt'>,
  Optional<
    Omit<CommentCreationAttributes, 'id' | 'updatedAt' | 'createdAt'>,
    'approved' | 'edited' | 'type' | 'parentId' | 'userId'
  >
> {
  public id!: number;
  public templateId!: number;
  public author!: string;
  public authorEmail?: string;
  public authorUrl?: string;
  public authorIp?: string;
  public content!: string;
  public approved!: boolean;
  public edited!: boolean;
  public type!: CommentType;
  public agent?: string;
  public parentId!: number;
  public userId!: number;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Comments.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      templateId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        comment: 'Tempate(Post) id',
      },
      author: {
        type: DataTypes.TEXT('tiny'),
        allowNull: false,
        comment: 'Author name',
      },
      authorEmail: {
        type: DataTypes.STRING(100),
        comment: "Author's email",
      },
      authorUrl: {
        type: DataTypes.STRING(200),
        field: 'author_URL',
        comment: "Author's client URL address",
      },
      authorIp: {
        type: DataTypes.STRING(100),
        field: 'author_IP',
        comment: "Author's client IP address",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Comment content',
      },
      approved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Is approved',
      },
      edited: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Is edited',
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: CommentType.Comment,
        comment: 'Type (for future, default: "comment")',
      },
      agent: {
        type: DataTypes.STRING,
        comment: 'Client UserAgent',
      },
      parentId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
        comment: 'Parent id',
      },
      userId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
        comment: 'User id',
      },
    },
    {
      sequelize,
      tableName: `${prefix}comments`,
      indexes: [
        { name: 'template_id', fields: ['template_id'] },
        { name: 'approved', fields: ['approved'] },
        { name: 'parent_id', fields: ['parent_id'] },
        { name: 'user_id', fields: ['user_id'] },
      ],
      comment: 'Comments',
    },
  );
};

// 关联
Comments.associate = function associate() {
  // Users.id <--> UserMeta.userId
  Comments.hasMany(CommentMeta, {
    foreignKey: 'commentId',
    sourceKey: 'id',
    as: 'CommentMetas',
    constraints: false,
  });
  CommentMeta.belongsTo(Comments, { foreignKey: 'commentId', targetKey: 'id', constraints: false });
};
