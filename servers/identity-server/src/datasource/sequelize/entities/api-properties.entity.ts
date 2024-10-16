import { DataTypes } from 'sequelize';
import { ApiPropertiesAttributes, ApiPropertiesCreationAttributes } from '../../entities/api-properties.entity';
import { Model } from '../model/model';

export class ApiProperties extends Model<ApiPropertiesAttributes, Omit<ApiPropertiesCreationAttributes, 'id'>> {
  public id!: number;
  public apiResourceId!: number;
  public key!: string;
  public value!: string;
}

ApiProperties.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      apiResourceId: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        allowNull: false,
        comment: 'ApiResources Id',
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
      tableName: `${prefix}api_properties`,
      indexes: [
        { name: 'api_resource_id', fields: ['api_resource_id'] },
        { name: 'api_property_key', fields: ['api_resource_id', 'key'], unique: true },
      ],
      createdAt: false,
      updatedAt: false,
      comment: 'ApiProperties',
    },
  );
};
