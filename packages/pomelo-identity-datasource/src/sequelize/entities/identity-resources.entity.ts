import { Model, DataTypes, Optional } from 'sequelize';
import {
  IdentityResourcesAttributes,
  IdentityResourcesCreationAttributes,
} from '../../entities/identity-resources.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';
import { TableAssociateFunc } from '../interfaces/table-associate-func.interface';

export default class IdentityResources extends Model<
  Omit<IdentityResourcesAttributes, 'updatedAt' | 'createdAt'>,
  Optional<
    Omit<IdentityResourcesCreationAttributes, 'updatedAt' | 'createdAt'>,
    'emphasize' | 'required' | 'showInDiscoveryDocument' | 'nonEditable' | 'enabled'
  >
> {
  public id!: number;
  public name!: string;
  public displayName?: string;
  public description?: string;
  public emphasize!: boolean;
  public required!: boolean;
  public showInDiscoveryDocument!: boolean;
  public nonEditable!: boolean;
  public enabled!: boolean;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  IdentityResources.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Name',
      },
      displayName: {
        type: DataTypes.STRING(250),
        comment: 'Display name',
      },
      description: {
        type: DataTypes.STRING(2000),
        comment: 'Description',
      },
      emphasize: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Emphasize',
      },
      required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Required',
      },
      showInDiscoveryDocument: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Show in discovery document',
      },
      nonEditable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Non editable',
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Enabled',
      },
    },
    {
      sequelize,
      tableName: `${prefix}identity_resources`,
      indexes: [{ name: 'identity_resources_name', fields: ['name'], unique: true }],
      comment: 'IdentityResources',
    },
  );
};

// 关联
export const associate: TableAssociateFunc = function associate(models) {
  // IdentityResources.id <--> IdentityClaims.identityResourceId
  models.IdentityResources.hasMany(models.IdentityClaims, {
    foreignKey: 'identityResourceId',
    sourceKey: 'id',
    as: 'IdentityClaims',
    constraints: false,
  });
  models.IdentityClaims.belongsTo(models.IdentityResources, {
    foreignKey: 'identityResourceId',
    targetKey: 'id',
    constraints: false,
  });

  // IdentityResources.id <--> IdentityProperties.identityResourceId
  models.IdentityResources.hasMany(models.IdentityProperties, {
    foreignKey: 'identityResourceId',
    sourceKey: 'id',
    as: 'IdentityProperties',
    constraints: false,
  });
  models.IdentityProperties.belongsTo(models.IdentityResources, {
    foreignKey: 'identityResourceId',
    targetKey: 'id',
    constraints: false,
  });
};
