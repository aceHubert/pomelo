import { DataTypes } from 'sequelize';
import {
  ClientRedirectUrisAttributes,
  ClientRedirectUrisCreationAttributes,
} from '../../entities/client-redirect-uris.entity';
import { Model } from '../model/model';

export class ClientRedirectUris extends Model<
  ClientRedirectUrisAttributes,
  Omit<ClientRedirectUrisCreationAttributes, 'id'>
> {
  public id!: number;
  public clientId!: number;
  public redirectUri!: string;
}

ClientRedirectUris.initialize = function initialize(sequelize, { prefix }) {
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
      redirectUri: {
        type: DataTypes.STRING(2000),
        allowNull: false,
        comment: 'Redirect uri',
      },
    },
    {
      sequelize,
      tableName: `${prefix}client_redirect_uris`,
      indexes: [{ name: 'client_id', fields: ['client_id'] }],
      createdAt: false,
      updatedAt: false,
      comment: 'ClientRedirectUris',
    },
  );
};
