import { Model, DataTypes } from 'sequelize';
import {
  TermTaxonomyMetaAttributes,
  TermTaxonomyMetaCreationAttributes,
} from '../../entities/term-taxonomy-meta.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class TermTaxonomyMeta extends Model<TermTaxonomyMetaAttributes, TermTaxonomyMetaCreationAttributes> {
  public id!: number;
  public termTaxonomyId!: number;
  public metaKey!: string;
  public metaValue?: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  TermTaxonomyMeta.init(
    {
      id: {
        // type: DataTypes.BIGINT({ unsigned: true }),
        type: DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      termTaxonomyId: {
        // type: DataTypes.BIGINT({ unsigned: true }),
        type: DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
        comment: 'Term taxonomy id',
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
      tableName: `${prefix}term_taxonomymeta`,
      indexes: [{ name: 'term_taxonomy_id_vs_meta_key', fields: ['term_taxonomy_id', 'meta_key'], unique: true }],
      createdAt: false,
      updatedAt: false,
      comment: 'Term taxonomy metas',
    },
  );
};
