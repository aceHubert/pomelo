import { Model, DataTypes } from 'sequelize';
import {
  ClientIdPRestrictionsAttributes,
  ClientIdPRestrictionsCreationAttributes,
} from '../../entities/client-id-prestrictions.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class ClientIdPRestrictions extends Model<
  ClientIdPRestrictionsAttributes,
  Omit<ClientIdPRestrictionsCreationAttributes, 'id'>
> {
  public id!: number;
  public clientId!: number;
  public grantType!: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  ClientIdPRestrictions.init(
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
