import { DataTypes } from 'sequelize';
import {
  TermTaxonomyMetaAttributes,
  TermTaxonomyMetaCreationAttributes,
} from '../../entities/term-taxonomy-meta.entity';
import { Model } from '../model/model';

export class TermTaxonomyMeta extends Model<
  TermTaxonomyMetaAttributes,
  Omit<TermTaxonomyMetaCreationAttributes, 'id'>
> {
  public id!: number;
  public termTaxonomyId!: number;
  public metaKey!: string;
  public metaValue!: string;
}

TermTaxonomyMeta.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      termTaxonomyId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
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
      indexes: [{ name: 'term_taxonomy_meta_keys', fields: ['term_taxonomy_id', 'meta_key'], unique: true }],
      createdAt: false,
      updatedAt: false,
      comment: 'Term taxonomy metas',
    },
  );
};
