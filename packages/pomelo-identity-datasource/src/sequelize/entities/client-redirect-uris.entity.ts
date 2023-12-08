import { Model, DataTypes } from 'sequelize';
import {
  ClientRedirectUrisAttributes,
  ClientRedirectUrisCreationAttributes,
} from '../../entities/client-redirect-uris.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class ClientRedirectUris extends Model<
  ClientRedirectUrisAttributes,
  ClientRedirectUrisCreationAttributes
> {
  public id!: number;
  public clientId!: number;
  public redirectUri!: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  ClientRedirectUris.init(
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
