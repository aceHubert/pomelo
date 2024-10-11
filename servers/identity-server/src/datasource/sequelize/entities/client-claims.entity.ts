import { DataTypes } from 'sequelize';
import { ClientClaimsAttributes, ClientClaimsCreationAttributes } from '../../entities/client-claims.entity';
import { Model } from '../model/model';

export class ClientClaims extends Model<ClientClaimsAttributes, Omit<ClientClaimsCreationAttributes, 'id'>> {
  public id!: number;
  public clientId!: number;
  public type!: string;
  public value!: string;
}

ClientClaims.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      clientId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        comment: 'Client Id',
      },
      type: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Claim type',
      },
      value: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Claim value',
      },
    },
    {
      sequelize,
      tableName: `${prefix}client_claims`,
      indexes: [
        { name: 'client_id', fields: ['client_id'] },
        { name: 'client_claim_type', fields: ['client_id', 'type'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'ClientClaims',
    },
  );
};
