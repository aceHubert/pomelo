import { Model, DataTypes } from 'sequelize';
import {
  TemplateMetaAttributes,
  TemplateMetaMetaCreationAttributes,
  TemplatePlatform,
} from '../../entities/template-meta.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class TemplateMeta extends Model<TemplateMetaAttributes, TemplateMetaMetaCreationAttributes> {
  public id!: number;
  public templateId!: number;
  public metaKey!: string;
  public metaValue?: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  TemplateMeta.init(
    {
      id: {
        // type: DataTypes.BIGINT({ unsigned: true }),
        type: DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      templateId: {
        // type: DataTypes.BIGINT({ unsigned: true }),
        type: DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
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
      indexes: [{ name: 'template_id_vs_meta_key', fields: ['template_id', 'meta_key'], unique: true }],
      createdAt: false,
      updatedAt: false,
      comment: 'Template metas',
    },
  );

  // mobile meta scope
  TemplateMeta.addScope(TemplatePlatform.Mobile, {
    where: {
      metaKey: TemplatePlatform.Mobile,
    },
  });

  // desktop meta scope
  TemplateMeta.addScope(TemplatePlatform.Desktop, {
    where: {
      metaKey: TemplatePlatform.Desktop,
    },
  });
};
