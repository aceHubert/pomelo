import { DataTypes, Optional } from 'sequelize';
import { ApiResourcesAttributes, ApiResourcesCreationAttributes } from '../../entities/api-resources.entity';
import { Model } from '../model/model';
import { ApiClaims } from './api-claims.entity';
import { ApiScopes } from './api-scopes.entity';
import { ApiSecrets } from './api-secrets.entity';
import { ApiProperties } from './api-properties.entity';

export class ApiResources extends Model<
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

ApiResources.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
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
ApiResources.associate = function associate() {
  // ApiResourcesrs.id <--> ApiClaims.apiResourceId
  ApiResources.hasMany(ApiClaims, {
    foreignKey: 'apiResourceId',
    sourceKey: 'id',
    as: 'ApiClaims',
    constraints: false,
  });
  ApiClaims.belongsTo(ApiResources, {
    foreignKey: 'apiResourceId',
    targetKey: 'id',
    constraints: false,
  });

  // ApiResourcesrs.id <--> ApiProperties.apiResourceId
  ApiResources.hasMany(ApiProperties, {
    foreignKey: 'apiResourceId',
    sourceKey: 'id',
    as: 'ApiProperties',
    constraints: false,
  });
  ApiProperties.belongsTo(ApiResources, {
    foreignKey: 'apiResourceId',
    targetKey: 'id',
    constraints: false,
  });

  // ApiResourcesrs.id <--> ApiScopes.apiResourceId
  ApiResources.hasMany(ApiScopes, {
    foreignKey: 'apiResourceId',
    sourceKey: 'id',
    as: 'ApiScopes',
    constraints: false,
  });
  ApiScopes.belongsTo(ApiResources, {
    foreignKey: 'apiResourceId',
    targetKey: 'id',
    constraints: false,
  });

  // ApiResourcesrs.id <--> ApiSecrets.apiResourceId
  ApiResources.hasMany(ApiSecrets, {
    foreignKey: 'apiResourceId',
    sourceKey: 'id',
    as: 'ApiSecrets',
    constraints: false,
  });
  ApiSecrets.belongsTo(ApiResources, {
    foreignKey: 'apiResourceId',
    targetKey: 'id',
    constraints: false,
  });
};
