import { DataTypes } from 'sequelize';
import { ApiClaimsAttributes, ApiClaimsCreationAttributes } from '../../entities/api-claims.entity';
import { Model } from '../model/model';

export class ApiClaims extends Model<ApiClaimsAttributes, Omit<ApiClaimsCreationAttributes, 'id'>> {
  public id!: number;
  public apiResourceId!: number;
  public type!: string;
}

ApiClaims.initialize = function initialize(sequelize, { prefix }) {
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
      type: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Claim type',
      },
    },
    {
      sequelize,
      tableName: `${prefix}api_claims`,
      indexes: [
        { name: 'api_resource_id', fields: ['api_resource_id'] },
        { name: 'api_claim', fields: ['api_resource_id', 'type'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'ApiClaims',
    },
  );
};
