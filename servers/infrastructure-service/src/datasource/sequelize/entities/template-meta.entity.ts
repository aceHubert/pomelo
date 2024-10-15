import { DataTypes } from 'sequelize';
import { TemplateMetaAttributes, TemplateMetaMetaCreationAttributes } from '../../entities/template-meta.entity';
import { Model } from '../model/model';

export class TemplateMeta extends Model<TemplateMetaAttributes, Omit<TemplateMetaMetaCreationAttributes, 'id'>> {
  public id!: number;
  public templateId!: number;
  public metaKey!: string;
  public metaValue?: string;
}

TemplateMeta.initialize = function initialize(sequelize, { prefix }) {
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
        comment: 'Template id',
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
      tableName: `${prefix}templatemeta`,
      indexes: [{ name: 'template_meta_keys', fields: ['template_id', 'meta_key'], unique: true }],
      createdAt: false,
      updatedAt: false,
      comment: 'Template metas',
    },
  );
};
