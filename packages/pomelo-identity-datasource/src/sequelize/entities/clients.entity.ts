import { Model, DataTypes, Optional } from 'sequelize';
import { ClientsAttributes, ClientsCreationAttributes } from '../../entities/clients.entity';
import { TableInitFunc } from '../interfaces/table-init-func.interface';
import { TableAssociateFunc } from '../interfaces/table-associate-func.interface';

export default class Clients extends Model<
  Omit<ClientsAttributes, 'updatedAt' | 'createdAt'>,
  Optional<Omit<ClientsCreationAttributes, 'id' | 'updatedAt' | 'createdAt'>, 'enabled'>
> {
  public id!: number;

  // oidc-provider
  public applicationType?: string;
  public clientId!: string;
  public clientName!: string;
  public clientUri?: string;
  public defaultMaxAge?: number;
  public idTokenSignedResponseAlg?: string;
  public initiateLoginUri?: string;
  public jwksUri?: string;
  public logoUri?: string;
  public policyUri?: string;
  public requireAuthTime?: boolean;
  public sectorIdentifierUri?: string;
  public subjectType?: string;
  public tokenEndpointAuthMethod?: string;

  // customize extend
  public idTokenLifetime?: number;
  public accessTokenFormat?: string;
  public accessTokenLifetime?: number;
  public refreshTokenExpiration?: string;
  public refreshTokenAbsoluteLifetime?: number;
  public refreshTokenSlidingLifetime?: number;
  public authorizationCodeLifetime?: number;
  public deviceCodeLifetime?: number;
  public backchannelAuthenticationRequestLifetime?: number;
  public requireConsent?: boolean;
  public requirePkce?: boolean;

  public enabled!: boolean;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const init: TableInitFunc = function init(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect();
  Clients.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      applicationType: {
        type: DataTypes.STRING(50),
        comment: 'Application type ("native" or "web", default: "web")',
      },
      clientId: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Client id',
      },
      clientName: {
        type: DataTypes.STRING(250),
        allowNull: false,
        comment: 'Client name',
      },
      clientUri: {
        type: DataTypes.STRING(2000),
        comment: 'Client uri',
      },
      defaultMaxAge: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        comment: 'Default max age (Seconds)',
      },
      idTokenSignedResponseAlg: {
        type: DataTypes.STRING(250),
        comment: 'Id token signed response alg (default: RSA256)',
      },
      initiateLoginUri: {
        type: DataTypes.STRING(2000),
        comment: 'Initiate login uri',
      },
      jwksUri: {
        type: DataTypes.STRING(2000),
        comment: 'Jwks uri',
      },
      logoUri: {
        type: DataTypes.STRING(2000),
        comment: 'Logo uri',
      },
      policyUri: {
        type: DataTypes.STRING(2000),
        comment: 'Policy uri',
      },
      requireAuthTime: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Require auth time',
      },
      sectorIdentifierUri: {
        type: DataTypes.STRING(2000),
        comment: 'Sector identifier uri',
      },
      subjectType: {
        type: DataTypes.STRING(50),
        comment: 'Subject type ("public" or "pairwise", default: "public")',
      },
      tokenEndpointAuthMethod: {
        type: DataTypes.STRING(50),
        comment: 'Token endpoint auth method (default: "client_secret_basic")',
      },
      idTokenLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        comment: 'Id token lifetime (Seconds, default: 600)',
      },
      accessTokenFormat: {
        type: DataTypes.STRING(50),
        comment: 'Access token format ("jwt" or "opaque", default: "opaque")',
      },
      accessTokenLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        comment: 'Access token lifetime (Seconds, default: 3600)',
      },
      refreshTokenExpiration: {
        type: DataTypes.STRING(50),
        comment: 'Refresh token expiration ("absolute" or "sliding", default: "absolute")',
      },
      refreshTokenAbsoluteLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        comment: 'Refresh token absolute lifetime (Seconds, default: 2592000)',
      },
      refreshTokenSlidingLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        comment: 'Refresh token sliding lifetime (Seconds, default: 1209600)',
      },
      authorizationCodeLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        comment: 'Authorization code lifetime (Seconds, default: 300)',
      },
      deviceCodeLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        comment: 'Device code lifetime (Seconds, default: 300)',
      },
      backchannelAuthenticationRequestLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        comment: 'Backchannel authentication request lifetime (Seconds, default: 300)',
      },
      requireConsent: {
        type: DataTypes.BOOLEAN,
        comment: 'Require consent (default: false)',
      },
      requirePkce: {
        type: DataTypes.BOOLEAN,
        comment: 'Require pkce (default: false)',
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
      tableName: `${prefix}clients`,
      indexes: [{ name: 'client_id', fields: ['client_id'], unique: true }],
      comment: 'Clients',
    },
  );
};

// 关联
export const associate: TableAssociateFunc = function associate(models) {
  // Clients.id <--> ClientCorsOrigins.clientId
  models.Clients.hasMany(models.ClientCorsOrigins, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientCorsOrigins',
    constraints: false,
  });
  models.ClientCorsOrigins.belongsTo(models.Clients, { foreignKey: 'clientId', targetKey: 'id', constraints: false });

  // Clients.id <--> ClientClaims.clientId
  models.Clients.hasMany(models.ClientClaims, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientClaims',
    constraints: false,
  });
  models.ClientClaims.belongsTo(models.Clients, { foreignKey: 'clientId', targetKey: 'id', constraints: false });

  // Clients.id <--> ClientScopes.clientId
  models.Clients.hasMany(models.ClientScopes, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientScopes',
    constraints: false,
  });
  models.ClientScopes.belongsTo(models.Clients, {
    foreignKey: 'clientId',
    targetKey: 'id',
    constraints: false,
  });

  // Clients.id <--> ClientGrantTypes.clientId
  models.Clients.hasMany(models.ClientGrantTypes, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientGrantTypes',
    constraints: false,
  });
  models.ClientGrantTypes.belongsTo(models.Clients, { foreignKey: 'clientId', targetKey: 'id', constraints: false });

  // Clients.id <--> ClientRedirectUris.clientId
  models.Clients.hasMany(models.ClientRedirectUris, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientRedirectUris',
    constraints: false,
  });
  models.ClientRedirectUris.belongsTo(models.Clients, {
    foreignKey: 'clientId',
    targetKey: 'id',
    constraints: false,
  });

  // Clients.id <--> ClientPostLogoutRedirectUris.clientId
  models.Clients.hasMany(models.ClientPostLogoutRedirectUris, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientPostLogoutRedirectUris',
    constraints: false,
  });
  models.ClientPostLogoutRedirectUris.belongsTo(models.Clients, {
    foreignKey: 'clientId',
    targetKey: 'id',
    constraints: false,
  });

  // Clients.id <--> ClientSecrets.clientId
  models.Clients.hasMany(models.ClientSecrets, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientSecrets',
    constraints: false,
  });
  models.ClientSecrets.belongsTo(models.Clients, {
    foreignKey: 'clientId',
    targetKey: 'id',
    constraints: false,
  });

  // Clients.id <--> ClientProperties.clientId
  models.Clients.hasMany(models.ClientProperties, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientProperties',
    constraints: false,
  });
  models.ClientProperties.belongsTo(models.Clients, {
    foreignKey: 'clientId',
    targetKey: 'id',
    constraints: false,
  });
};
