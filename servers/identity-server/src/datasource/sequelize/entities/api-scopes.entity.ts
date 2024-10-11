import { DataTypes, Optional } from 'sequelize';
import { ApiScopesAttributes, ApiScopesCreationAttributes } from '../../entities/api-scopes.entity';
import { Model } from '../model/model';
import { ApiScopeClaims } from './api-scope-claims.entity';

export class ApiScopes extends Model<
  ApiScopesAttributes,
  Optional<Omit<ApiScopesCreationAttributes, 'id'>, 'emphasize' | 'required' | 'showInDiscoveryDocument'>
> {
  public id!: number;
  public apiResourceId!: number;
  public name!: string;
  public displayName?: string;
  public description?: string;
  public emphasize!: boolean;
  public required!: boolean;
  public showInDiscoveryDocument!: boolean;
}

ApiScopes.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      apiResourceId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        comment: 'ApiResources Id',
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
      emphasize: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Emphasize',
      },
      required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Required',
      },
      showInDiscoveryDocument: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Show in discovery document',
      },
    },
    {
      sequelize,
      tableName: `${prefix}api_scopes`,
      indexes: [
        { name: 'api_resource_id', fields: ['api_resource_id'] },
        { name: 'api_scope_name', fields: ['api_resource_id', 'name'], unique: true },
      ],
      updatedAt: false,
      createdAt: false,
      comment: 'ApiScopes',
    },
  );
};

// 关联
ApiScopes.associate = function associate() {
  // ApiScopes.id <--> ApiScopeClaims.apiScopeId
  ApiScopes.hasMany(ApiScopeClaims, {
    foreignKey: 'apiScopeId',
    sourceKey: 'id',
    as: 'ApiScopeClaims',
    constraints: false,
  });
  ApiScopeClaims.belongsTo(ApiScopes, { foreignKey: 'apiScopeId', targetKey: 'id', constraints: false });
};
