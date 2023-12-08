import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { Includeable, Op } from 'sequelize';
import {
  ClientModel,
  PagedClientArgs,
  PagedClient,
  NewClientInput,
  UpdateClientInput,
  ClientClaimModel,
  ClientClaimsModel,
  NewClientClaimInput,
  ClientCorsOriginModel,
  ClientCorsOriginsModel,
  NewClientCorsOriginInput,
  ClientGrantTypeModel,
  ClientGrantTypesModel,
  NewClientGrantTypeInput,
  ClientScopeModel,
  ClientScopesModel,
  NewClientScopeInput,
  ClientRedirectUriModel,
  ClientRedirectUrisModel,
  NewClientRedirectUriInput,
  ClientPostLogoutRedirectUriModel,
  ClientPostLogoutRedirectUrisModel,
  NewClientPostLogoutRedirectUriInput,
  ClientSecretModel,
  ClientSecretsModel,
  NewClientSecretInput,
  ClientPropertyModel,
  ClientPropertiesModel,
  NewClientPropertyInput,
} from '../interfaces/client.interface';
import { BaseDataSource } from './base.datasource';

@Injectable()
export class ClientDataSource extends BaseDataSource {
  constructor(protected readonly moduleRef: ModuleRef) {
    super();
  }

  /**
   * get client
   * @param clientId client id (clientId field)
   * @param fields return fields, "corsOrigins", "claims", "grantTypes", "scopes", "redirectUris", "postLogoutRedirectUris", "secrets" or "properties" will be included if fields includes
   */
  get(
    clientId: string,
    fields: string[],
  ): Promise<
    | (ClientModel & {
        claims?: ClientClaimModel[];
        corsOrigins?: ClientCorsOriginModel[];
        grantTypes?: ClientGrantTypeModel[];
        scopes?: ClientScopeModel[];
        redirectUris?: ClientRedirectUriModel[];
        postLogoutRedirectUris?: ClientPostLogoutRedirectUriModel[];
        secrets?: ClientSecretModel[];
        properties?: ClientPropertyModel[];
      })
    | undefined
  > {
    // 主键(meta 查询)
    if (!fields.includes('id')) {
      fields.unshift('id');
    }

    return this.models.Clients.findOne({
      attributes: this.filterFields(fields, this.models.Clients),
      where: {
        clientId,
      },
      include: [
        fields.includes('corsOrigins') && {
          model: this.models.ClientCorsOrigins,
          attributes: ['id', 'origin'],
          as: 'ClientCorsOrigins',
          required: false,
        },
        fields.includes('claims') && {
          model: this.models.ClientClaims,
          attributes: ['id', 'type', 'value'],
          as: 'ClientClaims',
          required: false,
        },
        fields.includes('grantTypes') && {
          model: this.models.ClientGrantTypes,
          attributes: ['id', 'grantType'],
          as: 'ClientGrantTypes',
          required: false,
        },
        fields.includes('scopes') && {
          model: this.models.ClientScopes,
          attributes: ['id', 'scope'],
          as: 'ClientScopes',
          required: false,
        },
        fields.includes('redirectUris') && {
          model: this.models.ClientRedirectUris,
          attributes: ['id', 'redirectUri'],
          as: 'ClientRedirectUris',
          required: false,
        },
        fields.includes('postLogoutRedirectUris') && {
          model: this.models.ClientPostLogoutRedirectUris,
          attributes: ['id', 'postLogoutRedirectUri'],
          as: 'ClientPostLogoutRedirectUris',
          required: false,
        },
        fields.includes('secrets') && {
          model: this.models.ClientSecrets,
          attributes: ['id', 'type', 'value', 'expiresAt'],
          as: 'ClientSecrets',
          required: false,
        },
        fields.includes('properties') && {
          model: this.models.ClientProperties,
          attributes: ['id', 'key', 'value'],
          as: 'ClientProperties',
          required: false,
        },
      ].filter(Boolean) as Includeable,
    }).then((client) => {
      if (!client) return;

      const {
        ClientCorsOrigins: corsOrigins,
        ClientClaims: claims,
        ClientGrantTypes: grantTypes,
        ClientScopes: scopes,
        ClientRedirectUris: redirectUris,
        ClientPostLogoutRedirectUris: postLogoutRedirectUris,
        ClientSecrets: secrets,
        ClientProperties: properties,
        ...restForClient
      } = client.toJSON<
        ClientModel & {
          ClientCorsOrigins?: ClientCorsOriginModel[];
          ClientClaims?: ClientClaimModel[];
          ClientGrantTypes?: ClientGrantTypeModel[];
          ClientScopes?: ClientScopeModel[];
          ClientRedirectUris?: ClientRedirectUriModel[];
          ClientPostLogoutRedirectUris?: ClientPostLogoutRedirectUriModel[];
          ClientSecrets?: ClientSecretModel[];
          ClientProperties?: ClientPropertyModel[];
        }
      >();

      return {
        ...restForClient,
        corsOrigins,
        claims,
        grantTypes,
        scopes,
        redirectUris,
        postLogoutRedirectUris,
        secrets,
        properties,
      };
    });
  }

  /**
   * Get paginated clients
   * @param param paged client args
   * @param fields return fields
   */
  getPaged({ offset = 0, limit = 20, ...query }: PagedClientArgs, fields: string[]): Promise<PagedClient> {
    // 只允许查询的字段
    fields = fields.filter((field) =>
      ['applicationType', 'clientId', 'clientName', 'enabled', 'updatedAt', 'createdAt'].includes(field),
    );

    // 主键
    if (!fields?.includes('id')) {
      fields.unshift('id');
    }

    return this.models.Clients.findAndCountAll({
      attributes: this.filterFields(fields, this.models.Clients),
      where: {
        clientName: {
          [Op.like]: `%${query.clientName}%`,
        },
      },
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    }).then(({ rows, count: total }) => ({
      rows: rows.map((client) => client.toJSON()),
      total,
    }));
  }

  /**
   * Create new client
   * @param input new client input
   */
  create(input: NewClientInput): Promise<ClientModel> {
    return this.models.Clients.create(input).then((client) => client.toJSON<ClientModel>());
  }

  /**
   * Update client
   * @param clientId client id (clientId field)
   * @param input update client input
   */
  update(clientId: string, input: UpdateClientInput): Promise<boolean> {
    return this.models.Clients.update(input, {
      where: {
        clientId,
      },
    }).then(([count]) => count > 0);
  }

  /**
   * get client claims
   * @param clientId client id (clientId field)
   * @param fields claims return fields
   */
  getClaims(clientId: string, fields: string[]): Promise<ClientClaimsModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: this.models.ClientClaims,
          attributes: this.filterFields(fields, this.models.ClientClaims),
          as: 'ClientClaims',
        },
      ],
    }).then((client) => {
      if (!client) return;

      const { ClientClaims: claims, ...item } = client.toJSON<ClientModel & { ClientClaims: ClientClaimModel[] }>();
      return {
        ...item,
        claims,
      };
    });
  }

  /**
   * Create new client claim
   * @param clientId client id (clientId field)
   * @param input new client claim input
   */
  createClaim(clientId: string, input: NewClientClaimInput): Promise<ClientClaimModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then((client) => {
      if (!client) return;

      return this.models.ClientClaims.create({
        ...input,
        clientId: client.id,
      }).then((claim) => claim.toJSON<ClientClaimModel>());
    });
  }

  /**
   * Delete client claim
   * @param id client claim id
   */
  deleteClaim(id: number): Promise<boolean> {
    return this.models.ClientClaims.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }

  /**
   * get client cors origins
   * @param clientId client id (clientId field)
   * @param fields corsOrigins return fields
   */
  getCorsOrigins(clientId: string, fields: string[]): Promise<ClientCorsOriginsModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: this.models.ClientCorsOrigins,
          attributes: this.filterFields(fields, this.models.ClientCorsOrigins),
          as: 'ClientCorsOrigins',
        },
      ],
    }).then((client) => {
      if (!client) return;

      const { ClientCorsOrigins: corsOrigins, ...item } = client.toJSON<
        ClientModel & { ClientCorsOrigins: ClientCorsOriginModel[] }
      >();
      return {
        ...item,
        corsOrigins,
      };
    });
  }

  /**
   * Create new client cors origin
   * @param clientId client id (clientId field)
   * @param input new client cors origin input
   */
  createCorsOrigin(clientId: string, input: NewClientCorsOriginInput): Promise<ClientCorsOriginModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then((client) => {
      if (!client) return;

      return this.models.ClientCorsOrigins.create({
        ...input,
        clientId: client.id,
      }).then((corsOrigin) => corsOrigin.toJSON<ClientCorsOriginModel>());
    });
  }

  /**
   * Delete client cors origin
   * @param id client cors origin id
   */
  deleteCorsOrigin(id: number): Promise<boolean> {
    return this.models.ClientCorsOrigins.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }

  /**
   * get client scopes
   * @param clientId client id (clientId field)
   * @param fields scopes return fields
   */
  getScopes(clientId: string, fields: string[]): Promise<ClientScopesModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: this.models.ClientScopes,
          attributes: this.filterFields(fields, this.models.ClientScopes),
          as: 'ClientScopes',
        },
      ],
    }).then((client) => {
      if (!client) return;

      const { ClientScopes: scopes, ...item } = client.toJSON<ClientModel & { ClientScopes: ClientScopeModel[] }>();
      return {
        ...item,
        scopes,
      };
    });
  }

  /**
   * Create new client scope
   * @param clientId client id (clientId field)
   * @param input new client scope input
   */
  createScope(clientId: string, input: NewClientScopeInput): Promise<ClientScopeModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then((client) => {
      if (!client) return;

      return this.models.ClientScopes.create({
        ...input,
        clientId: client.id,
      }).then((scope) => scope.toJSON<ClientScopeModel>());
    });
  }

  /**
   * Delete client scope
   * @param id client scope id
   */
  deleteScope(id: number): Promise<boolean> {
    return this.models.ClientScopes.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }

  /**
   * get client grant types
   * @param clientId client id (clientId field)
   * @param fields grantTypes return fields
   */
  getGrantTypes(clientId: string, fields: string[]): Promise<ClientGrantTypesModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: this.models.ClientGrantTypes,
          attributes: this.filterFields(fields, this.models.ClientGrantTypes),
          as: 'ClientGrantTypes',
        },
      ],
    }).then((client) => {
      if (!client) return;

      const { ClientGrantTypes: grantTypes, ...item } = client.toJSON<
        ClientModel & { ClientGrantTypes: ClientGrantTypeModel[] }
      >();
      return {
        ...item,
        grantTypes,
      };
    });
  }

  /**
   * Create new client grant type
   * @param clientId client id (clientId field)
   * @param input new client grant type input
   */
  createGrantType(clientId: string, input: NewClientGrantTypeInput): Promise<ClientGrantTypeModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then((client) => {
      if (!client) return;

      return this.models.ClientGrantTypes.create({
        ...input,
        clientId: client.id,
      }).then((grantType) => grantType.toJSON<ClientGrantTypeModel>());
    });
  }

  /**
   * Delete client grant type
   * @param id client grant type id
   */
  deleteGrantType(id: number): Promise<boolean> {
    return this.models.ClientGrantTypes.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }

  /**
   * get client redirect uris
   * @param clientId client id (clientId field)
   * @param fields redirectUris return fields
   */
  getRedirectUris(clientId: string, fields: string[]): Promise<ClientRedirectUrisModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: this.models.ClientRedirectUris,
          attributes: this.filterFields(fields, this.models.ClientRedirectUris),
          as: 'ClientRedirectUris',
        },
      ],
    }).then((client) => {
      if (!client) return;

      const { ClientRedirectUris: redirectUris, ...item } = client.toJSON<
        ClientModel & { ClientRedirectUris: ClientRedirectUriModel[] }
      >();
      return {
        ...item,
        redirectUris,
      };
    });
  }

  /**
   * Create new client redirect uri
   * @param clientId client id (clientId field)
   * @param input new client redirect uri input
   */
  createRedirectUri(clientId: string, input: NewClientRedirectUriInput): Promise<ClientRedirectUriModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then((client) => {
      if (!client) return;

      return this.models.ClientRedirectUris.create({
        ...input,
        clientId: client.id,
      }).then((redirectUri) => redirectUri.toJSON<ClientRedirectUriModel>());
    });
  }

  /**
   * Delete client redirect uri
   * @param id client redirect uri id
   */
  deleteRedirectUri(id: number): Promise<boolean> {
    return this.models.ClientRedirectUris.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }

  /**
   * get client post logout redirect uris
   * @param clientId client id (clientId field)
   * @param fields postLogoutRedirectUris return fields
   */
  getPostLogoutRedirectUris(
    clientId: string,
    fields: string[],
  ): Promise<ClientPostLogoutRedirectUrisModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: this.models.ClientPostLogoutRedirectUris,
          attributes: this.filterFields(fields, this.models.ClientPostLogoutRedirectUris),
          as: 'ClientPostLogoutRedirectUris',
        },
      ],
    }).then((client) => {
      if (!client) return;

      const { ClientPostLogoutRedirectUris: postLogoutRedirectUris, ...item } = client.toJSON<
        ClientModel & { ClientPostLogoutRedirectUris: ClientPostLogoutRedirectUriModel[] }
      >();
      return {
        ...item,
        postLogoutRedirectUris,
      };
    });
  }

  /**
   * Create new client post logout redirect uri
   * @param clientId client id (clientId field)
   * @param input new client post logout redirect uri input
   */
  createPostLogoutRedirectUri(
    clientId: string,
    input: NewClientPostLogoutRedirectUriInput,
  ): Promise<ClientPostLogoutRedirectUriModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then((client) => {
      if (!client) return;

      return this.models.ClientPostLogoutRedirectUris.create({
        ...input,
        clientId: client.id,
      }).then((postLogoutRedirectUri) => postLogoutRedirectUri.toJSON<ClientPostLogoutRedirectUriModel>());
    });
  }

  /**
   * Delete client post logout redirect uri
   * @param id client post logout redirect uri id
   */
  deletePostLogoutRedirectUri(id: number): Promise<boolean> {
    return this.models.ClientPostLogoutRedirectUris.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }

  /**
   * get client secrets (secret value will not return)
   * @param clientId client id (clientId field)
   * @param fields secrets return fields
   */
  getSecrets(clientId: string, fields: string[]): Promise<ClientSecretsModel | undefined> {
    // value 字段不返回
    // if (fields.includes('value')) {
    //   fields.splice(fields.indexOf('value'), 1);
    // }

    return this.models.Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: this.models.ClientSecrets,
          attributes: this.filterFields(fields, this.models.ClientSecrets),
          as: 'ClientSecrets',
        },
      ],
    }).then((client) => {
      if (!client) return;

      const { ClientSecrets: secrets, ...item } = client.toJSON<ClientModel & { ClientSecrets: ClientSecretModel[] }>();
      return {
        ...item,
        secrets,
      };
    });
  }

  /**
   * Create new client secret (value will not return)
   * @param clientId client id (clientId field)
   * @param input new client secret input
   */
  createSecret(clientId: string, input: NewClientSecretInput): Promise<ClientSecretModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then((client) => {
      if (!client) return;

      return this.models.ClientSecrets.create({
        ...input,
        clientId: client.id,
      }).then((secret) => secret.toJSON<ClientSecretModel>());
    });
  }

  /**
   * Make client secret expired
   * @param id client secret id
   */
  expireSecret(id: number): Promise<boolean> {
    return this.models.ClientSecrets.update(
      {
        expiresAt: new Date().getMilliseconds() / 1000,
      },
      {
        where: {
          id,
        },
      },
    ).then(([count]) => count > 0);
  }

  /**
   * get client properties
   * @param clientId client id (clientId field)
   * @param fields properties return fields
   */
  getProperties(clientId: string, fields: string[]): Promise<ClientPropertiesModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: this.models.ClientProperties,
          attributes: this.filterFields(fields, this.models.ClientProperties),
          as: 'ClientProperties',
        },
      ],
    }).then((client) => {
      if (!client) return;

      const { ClientProperties: properties, ...item } = client.toJSON<
        ClientModel & { ClientProperties: ClientPropertyModel[] }
      >();
      return {
        ...item,
        properties,
      };
    });
  }

  /**
   * Create new client property
   * @param clientId client id (clientId field)
   * @param input new client property input
   */
  createProperty(clientId: string, input: NewClientPropertyInput): Promise<ClientPropertyModel | undefined> {
    return this.models.Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then((client) => {
      if (!client) return;

      return this.models.ClientProperties.create({
        ...input,
        clientId: client.id,
      }).then((property) => property.toJSON<ClientPropertyModel>());
    });
  }

  /**
   * Delete client property
   * @param id client property id
   */
  deleteProperty(id: number): Promise<boolean> {
    return this.models.ClientProperties.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }
}
