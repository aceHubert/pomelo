import { Model, DataTypes } from 'sequelize';
import {
  IdentityPropertiesAttributes,
  IdentityPropertiesCreationAttributes,
} from '../../entities/identity-properties.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';

export default class IdentityProperties extends Model<
  IdentityPropertiesAttributes,
  IdentityPropertiesCreationAttributes
> {
  public id!: number;
  public identityResourceId!: number;
  public key!: string;
  public value!: string;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  IdentityProperties.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      identityResourceId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        comment: 'IdentityResources Id',
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
      tableName: `${prefix}identity_properties`,
      indexes: [
        { name: 'identity_resource_id', fields: ['identity_resource_id'] },
        { name: 'identity_property_key', fields: ['identity_resource_id', 'key'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'IdentityProperties',
    },
  );
};
