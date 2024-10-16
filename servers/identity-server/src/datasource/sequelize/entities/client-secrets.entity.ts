import { DataTypes } from 'sequelize';
import { ClientSecretsAttributes, ClientSecretsCreationAttributes } from '../../entities/client-secrets.entity';
import { Model } from '../model/model';

export class ClientSecrets extends Model<
  Omit<ClientSecretsAttributes, 'createdAt'>,
  Omit<ClientSecretsCreationAttributes, 'id' | 'createdAt'>
> {
  public id!: number;
  public clientId!: number;
  public description?: string;
  public expiresAt?: number;
  public type!: string;
  public value!: string;

  // timestamps!
  public readonly createdAt!: Date;
}

ClientSecrets.initialize = function initialize(sequelize, { prefix }) {
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
      description: {
        type: DataTypes.STRING(2000),
        comment: 'Description',
      },
      expiresAt: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        comment: 'Expires at (Seconds)',
      },
      type: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Secret type',
      },
      value: {
        type: DataTypes.STRING(4000),
        allowNull: false,
        comment: 'Secret value',
      },
    },
    {
      sequelize,
      tableName: `${prefix}client_secrets`,
      indexes: [{ name: 'client_id', fields: ['client_id'] }],
      updatedAt: false,
      comment: 'ClientSecrets',
    },
  );
};
