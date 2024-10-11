import { Optional, DataTypes } from 'sequelize';
import { TemplateStatus, TemplatePresetType, TemplateCommentStatus } from '@ace-pomelo/shared/server';
import { TemplateAttributes, TemplateCreationAttributes } from '../../entities/template.entity';
import { Model } from '../model/model';
import { TemplateMeta } from './template-meta.entity';
import { TermRelationships } from './term-relationships.entity';

export class Templates extends Model<
  Omit<TemplateAttributes, 'updatedAt' | 'createdAt'>,
  Optional<
    Omit<TemplateCreationAttributes, 'id' | 'updatedAt' | 'createdAt'>,
    'type' | 'status' | 'order' | 'parentId' | 'commentStatus' | 'commentCount'
  >
> {
  public id!: number;
  public title!: string;
  public name!: string;
  public author!: number;
  public content!: string;
  public excerpt!: string;
  public type!: string;
  public status!: TemplateStatus;
  public order!: number;
  public parent?: number;
  public commentStatus!: TemplateCommentStatus;
  public commentCount!: number;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Templates.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
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
        defaultValue: TemplatePresetType.Post,
        comment: 'Type ("post", "page", ect...)',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: TemplateStatus.Publish,
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
        defaultValue: TemplateCommentStatus.Closed,
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
Templates.associate = function associate() {
  // Template.id <--> TemplateMeta.templateId
  Templates.hasMany(TemplateMeta, {
    foreignKey: 'templateId',
    sourceKey: 'id',
    as: 'TemplateMetas',
    constraints: false,
  });
  TemplateMeta.belongsTo(Templates, { foreignKey: 'templateId', targetKey: 'id', constraints: false });

  // Template.id --> TermRelationships.objectId
  Templates.hasMany(TermRelationships, {
    foreignKey: 'objectId',
    sourceKey: 'id',
    as: 'TemplateTermRelationships',
    constraints: false,
  });
};
