import { Model, DataTypes } from 'sequelize';
import { ClientScopesAttributes, ClientScopesCreationAttributes } from '../../entities/client-scopes.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class ClientScopes extends Model<ClientScopesAttributes, Omit<ClientScopesCreationAttributes, 'id'>> {
  public id!: number;
  public clientId!: number;
  public scope!: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  ClientScopes.init(
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
      scope: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Scope',
      },
    },
    {
      sequelize,
      tableName: `${prefix}client_scopes`,
      indexes: [
        { name: 'client_id', fields: ['client_id'] },
        { name: 'client_scope', fields: ['client_id', 'scope'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'ClientScopes',
    },
  );
};
