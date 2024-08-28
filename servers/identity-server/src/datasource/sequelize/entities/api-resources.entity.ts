import { Model, DataTypes, Optional } from 'sequelize';
import { ApiResourcesAttributes, ApiResourcesCreationAttributes } from '../../entities/api-resources.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';
import { TableAssociateFunc } from '../interfaces/table-associate-func.interface';

export default class ApiResources extends Model<
  Omit<ApiResourcesAttributes, 'updatedAt' | 'createdAt'>,
  Optional<Omit<ApiResourcesCreationAttributes, 'id' | 'updatedAt' | 'createdAt'>, 'nonEditable' | 'enabled'>
> {
  public id!: number;
  public name!: string;
  public displayName?: string;
  public description?: string;
  public lastAccessed?: Date;
  public nonEditable!: boolean;
  public enabled!: boolean;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  ApiResources.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Name',
      },
      displayName: {
        type: DataTypes.STRING(250),
        comment: 'Display name',
      },
      description: {
        type: DataTypes.STRING(2000),
        comment: 'Description',
      },
      lastAccessed: {
        type: DataTypes.DATE(),
        comment: 'Last accessed',
      },
      nonEditable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Non editable',
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Enabled',
      },
    },
    {
      sequelize,
      tableName: `${prefix}api_resources`,
      indexes: [{ name: 'api_resources_name', fields: ['name'], unique: true }],
      comment: 'ApiResources',
    },
  );
};

// 关联
export const associate: TableAssociateFunc = function associate(models) {
  // ApiResourcesrs.id <--> ApiClaims.apiResourceId
  models.ApiResources.hasMany(models.ApiClaims, {
    foreignKey: 'apiResourceId',
    sourceKey: 'id',
    as: 'ApiClaims',
    constraints: false,
  });
  models.ApiClaims.belongsTo(models.ApiResources, {
    foreignKey: 'apiResourceId',
    targetKey: 'id',
    constraints: false,
  });

  // ApiResourcesrs.id <--> ApiProperties.apiResourceId
  models.ApiResources.hasMany(models.ApiProperties, {
    foreignKey: 'apiResourceId',
    sourceKey: 'id',
    as: 'ApiProperties',
    constraints: false,
  });
  models.ApiProperties.belongsTo(models.ApiResources, {
    foreignKey: 'apiResourceId',
    targetKey: 'id',
    constraints: false,
  });

  // ApiResourcesrs.id <--> ApiScopes.apiResourceId
  models.ApiResources.hasMany(models.ApiScopes, {
    foreignKey: 'apiResourceId',
    sourceKey: 'id',
    as: 'ApiScopes',
    constraints: false,
  });
  models.ApiScopes.belongsTo(models.ApiResources, {
    foreignKey: 'apiResourceId',
    targetKey: 'id',
    constraints: false,
  });

  // ApiResourcesrs.id <--> ApiSecrets.apiResourceId
  models.ApiResources.hasMany(models.ApiSecrets, {
    foreignKey: 'apiResourceId',
    sourceKey: 'id',
    as: 'ApiSecrets',
    constraints: false,
  });
  models.ApiSecrets.belongsTo(models.ApiResources, {
    foreignKey: 'apiResourceId',
    targetKey: 'id',
    constraints: false,
  });
};
