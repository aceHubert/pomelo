import { DataTypes } from 'sequelize';
import {
  ClientPostLogoutRedirectUrisAttributes,
  ClientPostLogoutRedirectUrisCreationAttributes,
} from '../../entities/client-post-logout-redirect-uris.entity';
import { Model } from '../model/model';

export class ClientPostLogoutRedirectUris extends Model<
  ClientPostLogoutRedirectUrisAttributes,
  Omit<ClientPostLogoutRedirectUrisCreationAttributes, 'id'>
> {
  public id!: number;
  public clientId!: number;
  public postLogoutRedirectUri!: string;
}

ClientPostLogoutRedirectUris.initialize = function initialize(sequelize, { prefix }) {
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
      postLogoutRedirectUri: {
        type: DataTypes.STRING(2000),
        allowNull: false,
        comment: 'Post logout redirect uri',
      },
    },
    {
      sequelize,
      tableName: `${prefix}client_post_logout_redirect_uris`,
      indexes: [{ name: 'client_id', fields: ['client_id'] }],
      createdAt: false,
      updatedAt: false,
      comment: 'ClientPostLogoutRedirectUris',
    },
  );
};
