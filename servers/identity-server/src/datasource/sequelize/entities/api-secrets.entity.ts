import { DataTypes } from 'sequelize';
import { ApiSecretsAttributes, ApiSecretsCreationAttributes } from '../../entities/api-secrets.entity';
import { Model } from '../model/model';

export class ApiSecrets extends Model<
  Omit<ApiSecretsAttributes, 'createdAt'>,
  Omit<ApiSecretsCreationAttributes, 'id' | 'createdAt'>
> {
  public id!: number;
  public apiResourceId!: number;
  public description?: string;
  public expiresAt?: number;
  public type!: string;
  public value!: string;

  // timestamps!
  public readonly createdAt!: Date;
}

ApiSecrets.initialize = function initialize(sequelize, { prefix }) {
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
      tableName: `${prefix}api_secrets`,
      indexes: [{ name: 'api_resource_id', fields: ['api_resource_id'] }],
      updatedAt: false,
      comment: 'ApiSecrets',
    },
  );
};
