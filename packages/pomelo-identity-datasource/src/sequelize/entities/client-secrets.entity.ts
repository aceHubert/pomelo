import { Model, DataTypes } from 'sequelize';
import { ClientSecretsAttributes, ClientSecretsCreationAttributes } from '../../entities/client-secrets.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class ClientSecrets extends Model<
  Omit<ClientSecretsAttributes, 'createdAt'>,
  Omit<ClientSecretsCreationAttributes, 'createdAt'>
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

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  ClientSecrets.init(
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
