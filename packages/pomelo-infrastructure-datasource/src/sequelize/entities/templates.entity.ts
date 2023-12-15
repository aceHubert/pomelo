import { Model, DataTypes } from 'sequelize';
import {
  TemplateAttributes,
  TemplateCreationAttributes,
  TemplateStatus,
  TemplateType,
  TemplateCommentStatus,
} from '../../entities/template.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';
import { TableAssociateFunc } from '../interfaces/table-associate-func.interface';

export default class Templates extends Model<
  Omit<TemplateAttributes, 'updatedAt' | 'createdAt'>,
  Omit<TemplateCreationAttributes, 'updatedAt' | 'createdAt'>
> {
  public id!: number;
  public title!: string;
  public name!: string;
  public author!: number;
  public content!: string;
  public excerpt!: string;
  public type!: TemplateType;
  public status!: TemplateStatus;
  public order!: number;
  public parent?: number;
  public commentStatus!: TemplateCommentStatus;
  public commentCount!: number;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  Templates.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Name (display at the URL address, must be unique)',
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Title',
      },
      author: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        comment: 'Author id',
      },
      content: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
        comment: 'Content',
      },
      excerpt: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Excerpt',
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'post',
        comment: 'Type ("post", "page", ect...)',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'publish',
        comment: 'Post status ("draft", "publish", ect.... default: "publish")',
      },
      order: {
        type: DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
        comment: 'Sort (default: 0)',
      },
      parentId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
        comment: 'Parent id',
      },
      commentStatus: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'closed',
        comment: 'Comment status ("open", "closed", default: "closed")',
      },
      commentCount: {
        type: DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
        comment: 'Comment count (default: 0)',
      },
    },
    {
      sequelize,
      tableName: `${prefix}templates`,
      indexes: [
        { name: 'author', fields: ['author'] },
        { name: 'type', fields: ['type'] },
        { name: 'status', fields: ['status'] },
      ],
      comment: 'Template',
    },
  );
};

// 关联
export const associate: TableAssociateFunc = function associate(models) {
  // Template.id <--> TemplateMeta.templateId
  models.Templates.hasMany(models.TemplateMeta, {
    foreignKey: 'templateId',
    sourceKey: 'id',
    as: 'TemplateMetas',
    constraints: false,
  });
  models.TemplateMeta.belongsTo(models.Templates, { foreignKey: 'templateId', targetKey: 'id', constraints: false });

  // Template.id --> TermRelationships.objectId
  models.Templates.hasMany(models.TermRelationships, {
    foreignKey: 'objectId',
    sourceKey: 'id',
    as: 'TemplateTermRelationships',
    constraints: false,
  });
};
