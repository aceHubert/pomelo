import { Model, Optional, DataTypes } from 'sequelize';
import {
  TermRelationshipAttributes,
  TermRelationshipCreationAttributes,
} from '../../entities/term-relationships.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class TermRelationships extends Model<
  TermRelationshipAttributes,
  Optional<TermRelationshipCreationAttributes, 'order'>
> {
  public objectId!: number;
  public termTaxonomyId!: number;
  public order!: number;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  TermRelationships.init(
    {
      objectId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        primaryKey: true,
        comment: 'Object id (Post, Link, ect...)',
      },
      termTaxonomyId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        primaryKey: true,
        comment: 'Taxonomy id',
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Sort (default: 0)',
      },
    },
    {
      sequelize,
      tableName: `${prefix}term_relationships`,
      indexes: [{ name: 'object_id_vs_term_taxonomy_id', fields: ['object_id', 'term_taxonomy_id'], unique: true }],
      createdAt: false,
      updatedAt: false,
      comment: 'Term relationships',
    },
  );
};
