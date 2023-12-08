import { Model, DataTypes } from 'sequelize';
import {
  ClientGrantTypesAttributes,
  ClientGrantTypesCreationAttributes,
} from '../../entities/client-grant-types.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class ClientGrantTypes extends Model<ClientGrantTypesAttributes, ClientGrantTypesCreationAttributes> {
  public id!: number;
  public clientId!: number;
  public grantType!: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  ClientGrantTypes.init(
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
