import { Optional, DataTypes } from 'sequelize';
import { TermTaxonomyAttributes, TermTaxonomyCreationAttributes } from '../../entities/term-taxonomy.entity';
import { Model } from '../model/model';
import { TermRelationships } from './term-relationships.entity';

export class TermTaxonomy extends Model<
  TermTaxonomyAttributes,
  Optional<Omit<TermTaxonomyCreationAttributes, 'id'>, 'parentId' | 'group' | 'count'>
> {
  public id!: number;
  public name!: string;
  public slug!: string;
  public taxonomy!: string;
  public description!: string;
  public parentId!: number;
  public group!: number;
  public count!: number;
}

TermTaxonomy.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Term name',
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Term slug',
      },

      taxonomy: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Taxonomy name',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Description',
      },
      parentId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        defaultValue: 0,
        comment: 'Parent id (default: 0)',
      },
      group: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Group (default: 0)',
      },
      count: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Count',
      },
    },
    {
      sequelize,
      tableName: `${prefix}term_taxonomy`,
      indexes: [
        { name: 'name_vs _taxonomy', fields: ['name', 'taxonomy'] },
        { name: 'parent_id', fields: ['parent_id'] },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'Term taxonomies',
    },
  );
};

// 关联
TermTaxonomy.associate = function associate() {
  // TermTaxonomy.id <--> TermRelationships.termTaxonomyId
  TermTaxonomy.hasMany(TermRelationships, {
    foreignKey: 'termTaxonomyId',
    sourceKey: 'id',
    as: 'TermRelationships',
    constraints: false,
  });
  TermRelationships.belongsTo(TermTaxonomy, {
    foreignKey: 'termTaxonomyId',
    targetKey: 'id',
    constraints: false,
  });
};
