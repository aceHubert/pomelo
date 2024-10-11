import { DataTypes } from 'sequelize';
import { IdentityClaimsAttributes, IdentityClaimsCreationAttributes } from '../../entities/identity-claims.entity';
import { Model } from '../model/model';

export class IdentityClaims extends Model<IdentityClaimsAttributes, Omit<IdentityClaimsCreationAttributes, 'id'>> {
  public id!: number;
  public identityResourceId!: number;
  public type!: string;
}

IdentityClaims.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      identityResourceId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        comment: 'IdentityResources Id',
      },
      type: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Claim type',
      },
    },
    {
      sequelize,
      tableName: `${prefix}identity_claims`,
      indexes: [
        { name: 'identity_resource_id', fields: ['identity_resource_id'] },
        { name: 'identity_claim_type', fields: ['identity_resource_id', 'type'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'IdentityClaims',
    },
  );
};
