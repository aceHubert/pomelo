import { Model, DataTypes } from 'sequelize';
import { TermTaxonomyAttributes, TermTaxonomyCreationAttributes } from '../../entities/term-taxonomy.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';
import { TableAssociateFunc } from '../interfaces/table-associate-func.interface';

export default class TermTaxonomy extends Model<TermTaxonomyAttributes, TermTaxonomyCreationAttributes> {
  public id!: number;
  public name!: string;
  public slug!: string;
  public taxonomy!: string;
  public description!: string;
  public parentId!: number;
  public group!: number;
  public count!: number;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  TermTaxonomy.init(
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
export const associate: TableAssociateFunc = function associate(models) {
  // TermTaxonomy.id <--> TermRelationships.termTaxonomyId
  models.TermTaxonomy.hasMany(models.TermRelationships, {
    foreignKey: 'termTaxonomyId',
    sourceKey: 'id',
    as: 'TermRelationships',
    constraints: false,
  });
  models.TermRelationships.belongsTo(models.TermTaxonomy, {
    foreignKey: 'termTaxonomyId',
    targetKey: 'id',
    constraints: false,
  });
};
