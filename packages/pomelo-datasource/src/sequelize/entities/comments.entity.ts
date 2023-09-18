import { Model, DataTypes } from 'sequelize';
import { CommentAttributes, CommentCreationAttributes, CommentType } from '../../entities/comments.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';
import { TableAssociateFunc } from '../interfaces/table-associate-func.interface';

export default class Comments extends Model<
  Omit<CommentAttributes, 'updatedAt' | 'createdAt'>,
  Omit<CommentCreationAttributes, 'updatedAt' | 'createdAt'>
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
  public userId!: string;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  Comments.init(
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
        defaultValue: 'comment',
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
export const associate: TableAssociateFunc = function associate(models) {
  // Users.id <--> UserMeta.userId
  models.Comments.hasMany(models.CommentMeta, {
    foreignKey: 'commentId',
    sourceKey: 'id',
    as: 'CommentMetas',
    constraints: false,
  });
  models.CommentMeta.belongsTo(models.Comments, { foreignKey: 'commentId', targetKey: 'id', constraints: false });
};
