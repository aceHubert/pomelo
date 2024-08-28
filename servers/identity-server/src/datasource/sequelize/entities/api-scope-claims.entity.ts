import { Model, DataTypes } from 'sequelize';
import { ApiScopeClaimsAttributes, ApiScopeClaimsCreationAttributes } from '../../entities/api-scope-claims.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class ApiScopeClaims extends Model<
  ApiScopeClaimsAttributes,
  Omit<ApiScopeClaimsCreationAttributes, 'id'>
> {
  public id!: number;
  public apiScopeId!: number;
  public type!: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  ApiScopeClaims.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      apiScopeId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        comment: 'ApiScopes Id',
      },
      type: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Scope claim type',
      },
    },
    {
      sequelize,
      tableName: `${prefix}api_scope_claims`,
      indexes: [
        { name: 'api_scope_id', fields: ['api_scope_id'] },
        { name: 'api_scope_claim', fields: ['api_scope_id', 'type'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'ApiScopeClaims',
    },
  );
};
