import { DataTypes, Optional } from 'sequelize';
import { ClientsAttributes, ClientsCreationAttributes } from '../../entities/clients.entity';
import { Model } from '../model/model';
import { ClientCorsOrigins } from './client-cors-origins.entity';
import { ClientClaims } from './client-claims.entity';
import { ClientScopes } from './client-scopes.entity';
import { ClientGrantTypes } from './client-grant-types.entity';
import { ClientRedirectUris } from './client-redirect-uris.entity';
import { ClientPostLogoutRedirectUris } from './client-post-logout-redirect-uris.entity';
import { ClientSecrets } from './client-secrets.entity';
import { ClientProperties } from './client-properties.entity';

export class Clients extends Model<
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

Clients.initialize = function initialize(sequelize, { prefix }) {
  const isMysql = sequelize.getDialect() === 'mysql';
  this.init(
    {
      id: {
        type: isMysql ? DataTypes.BIGINT({ unsigned: true }) : DataTypes.BIGINT(),
        autoIncrement: true,
        primaryKey: true,
      },
      applicationType: {
        type: DataTypes.STRING(50),
        defaultValue: 'web',
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
        allowNull: false,
        defaultValue: 'RS256',
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
        comment: 'Require auth time (default: false)',
      },
      sectorIdentifierUri: {
        type: DataTypes.STRING(2000),
        comment: 'Sector identifier uri',
      },
      subjectType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'public',
        comment: 'Subject type ("public" or "pairwise", default: "public")',
      },
      tokenEndpointAuthMethod: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'client_secret_basic',
        comment: 'Token endpoint auth method (default: "client_secret_basic")',
      },
      idTokenLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        allowNull: false,
        defaultValue: 3600,
        comment: 'Id token lifetime (Seconds, default: 3600)',
      },
      accessTokenFormat: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'jwt',
        comment: 'Access token format ("jwt" or "opaque", default: "jwt")',
      },
      accessTokenLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        allowNull: false,
        defaultValue: 3600,
        comment: 'Access token lifetime (Seconds, default: 3600)',
      },
      refreshTokenExpiration: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'absolute',
        comment: 'Refresh token expiration ("absolute" or "sliding", default: "absolute")',
      },
      refreshTokenAbsoluteLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        allowNull: false,
        defaultValue: 2592000,
        comment: 'Refresh token absolute lifetime (Seconds, default: 2592000)',
      },
      refreshTokenSlidingLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        allowNull: false,
        defaultValue: 1296000,
        comment: 'Refresh token sliding lifetime (Seconds, default: 1209600)',
      },
      authorizationCodeLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        allowNull: false,
        defaultValue: 300,
        comment: 'Authorization code lifetime (Seconds, default: 300)',
      },
      deviceCodeLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        allowNull: false,
        defaultValue: 300,
        comment: 'Device code lifetime (Seconds, default: 300)',
      },
      backchannelAuthenticationRequestLifetime: {
        type: isMysql ? DataTypes.MEDIUMINT({ unsigned: true }) : DataTypes.MEDIUMINT(),
        allowNull: false,
        defaultValue: 300,
        comment: 'Backchannel authentication request lifetime (Seconds, default: 300)',
      },
      requireConsent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Require consent (default: false)',
      },
      requirePkce: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Require pkce (default: true)',
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
Clients.associate = function associate() {
  // Clients.id <--> ClientCorsOrigins.clientId
  Clients.hasMany(ClientCorsOrigins, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientCorsOrigins',
    constraints: false,
  });
  ClientCorsOrigins.belongsTo(Clients, { foreignKey: 'clientId', targetKey: 'id', constraints: false });

  // Clients.id <--> ClientClaims.clientId
  Clients.hasMany(ClientClaims, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientClaims',
    constraints: false,
  });
  ClientClaims.belongsTo(Clients, { foreignKey: 'clientId', targetKey: 'id', constraints: false });

  // Clients.id <--> ClientScopes.clientId
  Clients.hasMany(ClientScopes, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientScopes',
    constraints: false,
  });
  ClientScopes.belongsTo(Clients, {
    foreignKey: 'clientId',
    targetKey: 'id',
    constraints: false,
  });

  // Clients.id <--> ClientGrantTypes.clientId
  Clients.hasMany(ClientGrantTypes, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientGrantTypes',
    constraints: false,
  });
  ClientGrantTypes.belongsTo(Clients, { foreignKey: 'clientId', targetKey: 'id', constraints: false });

  // Clients.id <--> ClientRedirectUris.clientId
  Clients.hasMany(ClientRedirectUris, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientRedirectUris',
    constraints: false,
  });
  ClientRedirectUris.belongsTo(Clients, {
    foreignKey: 'clientId',
    targetKey: 'id',
    constraints: false,
  });

  // Clients.id <--> ClientPostLogoutRedirectUris.clientId
  Clients.hasMany(ClientPostLogoutRedirectUris, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientPostLogoutRedirectUris',
    constraints: false,
  });
  ClientPostLogoutRedirectUris.belongsTo(Clients, {
    foreignKey: 'clientId',
    targetKey: 'id',
    constraints: false,
  });

  // Clients.id <--> ClientSecrets.clientId
  Clients.hasMany(ClientSecrets, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientSecrets',
    constraints: false,
  });
  ClientSecrets.belongsTo(Clients, {
    foreignKey: 'clientId',
    targetKey: 'id',
    constraints: false,
  });

  // Clients.id <--> ClientProperties.clientId
  Clients.hasMany(ClientProperties, {
    foreignKey: 'clientId',
    sourceKey: 'id',
    as: 'ClientProperties',
    constraints: false,
  });
  ClientProperties.belongsTo(Clients, {
    foreignKey: 'clientId',
    targetKey: 'id',
    constraints: false,
  });
};
