import { Model, DataTypes } from 'sequelize';
import {
  ClientPostLogoutRedirectUrisAttributes,
  ClientPostLogoutRedirectUrisCreationAttributes,
} from '../../entities/client-post-logout-redirect-uris.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class ClientPostLogoutRedirectUris extends Model<
  ClientPostLogoutRedirectUrisAttributes,
  Omit<ClientPostLogoutRedirectUrisCreationAttributes, 'id'>
> {
  public id!: number;
  public clientId!: number;
  public postLogoutRedirectUri!: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  ClientPostLogoutRedirectUris.init(
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
