import { Model, DataTypes } from 'sequelize';
import {
  ClientPropertiesAttributes,
  ClientPropertiesCreationAttributes,
} from '../../entities/client-properties.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class ClientProperties extends Model<
  ClientPropertiesAttributes,
  Omit<ClientPropertiesCreationAttributes, 'id'>
> {
  public id!: number;
  public clientId!: number;
  public key!: string;
  public value!: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  ClientProperties.init(
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
      key: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Property key',
      },
      value: {
        type: DataTypes.STRING(2000),
        allowNull: false,
        comment: 'Property value',
      },
    },
    {
      sequelize,
      tableName: `${prefix}client_properties`,
      indexes: [
        { name: 'client_id', fields: ['client_id'] },
        { name: 'client_property_key', fields: ['client_id', 'key'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'ClientProperties',
    },
  );
};
