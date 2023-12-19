import { Model, DataTypes } from 'sequelize';
import {
  ClientCorsOriginsAttributes,
  ClientCorsOriginsCreationAttributes,
} from '../../entities/client-cors-origins.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class ClientCorsOrigins extends Model<
  ClientCorsOriginsAttributes,
  Omit<ClientCorsOriginsCreationAttributes, 'id'>
> {
  public id!: number;
  public clientId!: number;
  public origin!: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  ClientCorsOrigins.init(
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
      origin: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Origin',
      },
    },
    {
      sequelize,
      tableName: `${prefix}client_cors_origins`,
      indexes: [
        { name: 'client_id', fields: ['client_id'] },
        { name: 'client_cors_origin', fields: ['client_id', 'origin'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'ClientCorsOrigins',
    },
  );
};
