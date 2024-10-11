import { DataTypes } from 'sequelize';
import {
  ClientIdPRestrictionsAttributes,
  ClientIdPRestrictionsCreationAttributes,
} from '../../entities/client-id-prestrictions.entity';
import { Model } from '../model/model';

export class ClientIdPRestrictions extends Model<
  ClientIdPRestrictionsAttributes,
  Omit<ClientIdPRestrictionsCreationAttributes, 'id'>
> {
  public id!: number;
  public clientId!: number;
  public grantType!: string;
}

ClientIdPRestrictions.initialize = function initialize(sequelize, { prefix }) {
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
      provider: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Provider',
      },
    },
    {
      sequelize,
      tableName: `${prefix}client_id_prestrictions`,
      indexes: [
        { name: 'client_id', fields: ['client_id'] },
        { name: 'client_id_provider', fields: ['client_id', 'provider'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'ClientIdPRestrictions',
    },
  );
};
