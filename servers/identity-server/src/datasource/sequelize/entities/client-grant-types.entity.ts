import { DataTypes } from 'sequelize';
import {
  ClientGrantTypesAttributes,
  ClientGrantTypesCreationAttributes,
} from '../../entities/client-grant-types.entity';
import { Model } from '../model/model';

export class ClientGrantTypes extends Model<
  ClientGrantTypesAttributes,
  Omit<ClientGrantTypesCreationAttributes, 'id'>
> {
  public id!: number;
  public clientId!: number;
  public grantType!: string;
}

ClientGrantTypes.initialize = function initialize(sequelize, { prefix }) {
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
      grantType: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Origin',
      },
    },
    {
      sequelize,
      tableName: `${prefix}client_grant_types`,
      indexes: [
        { name: 'client_id', fields: ['client_id'] },
        { name: 'client_grant_type', fields: ['client_id', 'grant_type'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'ClientGrantTypes',
    },
  );
};
