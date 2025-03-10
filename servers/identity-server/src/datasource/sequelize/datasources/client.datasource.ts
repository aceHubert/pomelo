import { Injectable } from '@nestjs/common';
import { ValidationError } from '@ace-pomelo/shared/server';
import { Includeable, Op, WhereOptions } from 'sequelize';
import {
  Clients,
  ClientCorsOrigins,
  ClientClaims,
  ClientGrantTypes,
  ClientScopes,
  ClientRedirectUris,
  ClientPostLogoutRedirectUris,
  ClientSecrets,
  ClientProperties,
} from '../entities';
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

    return Clients.findOne({
      attributes: this.filterFields(fields, Clients),
      where: {
        clientId,
      },
      include: [
        fields.includes('corsOrigins') && {
          model: ClientCorsOrigins,
          attributes: ['id', 'origin'],
          as: 'ClientCorsOrigins',
          required: false,
        },
        fields.includes('claims') && {
          model: ClientClaims,
          attributes: ['id', 'type', 'value'],
          as: 'ClientClaims',
          required: false,
        },
        fields.includes('grantTypes') && {
          model: ClientGrantTypes,
          attributes: ['id', 'grantType'],
          as: 'ClientGrantTypes',
          required: false,
        },
        fields.includes('scopes') && {
          model: ClientScopes,
          attributes: ['id', 'scope'],
          as: 'ClientScopes',
          required: false,
        },
        fields.includes('redirectUris') && {
          model: ClientRedirectUris,
          attributes: ['id', 'redirectUri'],
          as: 'ClientRedirectUris',
          required: false,
        },
        fields.includes('postLogoutRedirectUris') && {
          model: ClientPostLogoutRedirectUris,
          attributes: ['id', 'postLogoutRedirectUri'],
          as: 'ClientPostLogoutRedirectUris',
          required: false,
        },
        fields.includes('secrets') && {
          model: ClientSecrets,
          attributes: ['id', 'type', 'value', 'expiresAt'],
          as: 'ClientSecrets',
          required: false,
        },
        fields.includes('properties') && {
          model: ClientProperties,
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

    const where: WhereOptions<ClientModel> = {};

    if (query.clientName) {
      where.clientName = {
        [Op.like]: `%${query.clientName}%`,
      };
    }

    return Clients.findAndCountAll({
      attributes: this.filterFields(fields, Clients),
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    }).then(({ rows, count: total }) => ({
      rows: rows.map((client) => client.toJSON<any>()),
      total,
    }));
  }

  /**
   * Create new client
   * @param input new client input
   */
  create(input: NewClientInput): Promise<ClientModel> {
    return Clients.create(input).then((client) => client.toJSON<ClientModel>());
  }

  /**
   * Update client
   * @param clientId client id (clientId field)
   * @param input update client input
   */
  async update(clientId: string, input: UpdateClientInput): Promise<void> {
    await Clients.update(input, {
      where: {
        clientId,
      },
    });
  }

  /**
   * get client claims
   * @param clientId client id (clientId field)
   * @param fields claims return fields
   * @param sorter sorter
   */
  getClaims(
    clientId: string,
    fields: string[],
    { field: orderField = 'id', order = 'ASC' }: { field?: string; order?: 'ASC' | 'DESC' } = {},
  ): Promise<ClientClaimsModel | undefined> {
    return Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: ClientClaims,
          attributes: this.filterFields(fields, ClientClaims),
          as: 'ClientClaims',
        },
      ],
      order: [[{ model: ClientClaims, as: 'ClientClaims' }, orderField, order]],
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
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return;

      const exists = await ClientClaims.count({
        where: {
          clientId: client.id,
          type: input.type,
        },
      }).then((count) => count > 0);

      if (exists)
        throw new ValidationError(
          this.translate('identity-server.datasource.client.claim_has_existed', 'Client claim has already existed!'),
        );

      return ClientClaims.create({
        ...input,
        clientId: client.id,
      }).then((claim) => claim.toJSON<ClientClaimModel>());
    });
  }

  /**
   * create new client claims, skip if claim type already exists
   * @param clientId client id (clientId field)
   * @param inputs new client claims input
   */
  createClaims(clientId: string, inputs: NewClientClaimInput[]): Promise<ClientClaimModel[]> {
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return [];

      const claims = await ClientClaims.findAll({
        attributes: ['type'],
        where: {
          clientId: client.id,
          type: {
            [Op.in]: inputs.map((input) => input.type),
          },
        },
      });

      const existsType = claims.map((claim) => claim.type);

      return ClientClaims.bulkCreate(
        inputs
          .filter((input) => !existsType.includes(input.type))
          .map((input) => ({
            ...input,
            clientId: client.id,
          })),
      ).then((claims) => claims.map((claim) => claim.toJSON<ClientClaimModel>()));
    });
  }

  /**
   * Delete client claim
   * @param id client claim id
   */
  async deleteClaim(id: number): Promise<void> {
    await ClientClaims.destroy({
      where: {
        id,
      },
    });
  }

  /**
   * get client cors origins
   * @param clientId client id (clientId field)
   * @param fields corsOrigins return fields
   * @param sorter sorter
   */
  getCorsOrigins(
    clientId: string,
    fields: string[],
    { field: orderField = 'id', order = 'ASC' }: { field?: string; order?: 'ASC' | 'DESC' } = {},
  ): Promise<ClientCorsOriginsModel | undefined> {
    return Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: ClientCorsOrigins,
          attributes: this.filterFields(fields, ClientCorsOrigins),
          as: 'ClientCorsOrigins',
        },
      ],
      order: [[{ model: ClientCorsOrigins, as: 'ClientCorsOrigins' }, orderField, order]],
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
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return;

      const exists = await ClientCorsOrigins.count({
        where: {
          clientId: client.id,
          origin: input.origin,
        },
      }).then((count) => count > 0);

      if (exists)
        throw new ValidationError(
          this.translate(
            'identity-server.datasource.client.cors_origin_has_existed',
            'Client cors origin has already existed!',
          ),
        );

      return ClientCorsOrigins.create({
        ...input,
        clientId: client.id,
      }).then((corsOrigin) => corsOrigin.toJSON<ClientCorsOriginModel>());
    });
  }

  /**
   * Create new client cors origins, skip if origin already exists
   * @param clientId client id (clientId field)
   * @param inputs new client cors origins input
   */
  createCorsOrigins(clientId: string, inputs: NewClientCorsOriginInput[]): Promise<ClientCorsOriginModel[]> {
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return [];

      const corsOrigins = await ClientCorsOrigins.findAll({
        attributes: ['origin'],
        where: {
          clientId: client.id,
          origin: {
            [Op.in]: inputs.map((input) => input.origin),
          },
        },
      });

      const existsOrigin = corsOrigins.map((corsOrigin) => corsOrigin.origin);

      return ClientCorsOrigins.bulkCreate(
        inputs
          .filter((input) => !existsOrigin.includes(input.origin))
          .map((input) => ({
            ...input,
            clientId: client.id,
          })),
      ).then((corsOrigins) => corsOrigins.map((corsOrigin) => corsOrigin.toJSON<ClientCorsOriginModel>()));
    });
  }

  /**
   * Delete client cors origin
   * @param id client cors origin id
   */
  async deleteCorsOrigin(id: number): Promise<void> {
    await ClientCorsOrigins.destroy({
      where: {
        id,
      },
    });
  }

  /**
   * get client scopes
   * @param clientId client id (clientId field)
   * @param fields scopes return fields
   * @param sorter sorter
   */
  getScopes(
    clientId: string,
    fields: string[],
    { field: orderField = 'id', order = 'ASC' }: { field?: string; order?: 'ASC' | 'DESC' } = {},
  ): Promise<ClientScopesModel | undefined> {
    return Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: ClientScopes,
          attributes: this.filterFields(fields, ClientScopes),
          as: 'ClientScopes',
        },
      ],
      order: [[{ model: ClientScopes, as: 'ClientScopes' }, orderField, order]],
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
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return;

      const exists = await ClientScopes.count({
        where: {
          clientId: client.id,
          scope: input.scope,
        },
      }).then((count) => count > 0);

      if (exists)
        throw new ValidationError(
          this.translate('identity-server.datasource.client.scope_has_existed', 'Client scope has already existed!'),
        );

      return ClientScopes.create({
        ...input,
        clientId: client.id,
      }).then((scope) => scope.toJSON<ClientScopeModel>());
    });
  }

  /**
   * Create new client scopes, skip if scope already exists
   * @param clientId client id (clientId field)
   * @param inputs new client scopes input
   */
  createScopes(clientId: string, inputs: NewClientScopeInput[]): Promise<ClientScopeModel[]> {
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return [];

      const scopes = await ClientScopes.findAll({
        attributes: ['scope'],
        where: {
          clientId: client.id,
          scope: {
            [Op.in]: inputs.map((input) => input.scope),
          },
        },
      });

      const existsScope = scopes.map((scope) => scope.scope);

      return ClientScopes.bulkCreate(
        inputs
          .filter((input) => !existsScope.includes(input.scope))
          .map((input) => ({
            ...input,
            clientId: client.id,
          })),
      ).then((scopes) => scopes.map((scope) => scope.toJSON<ClientScopeModel>()));
    });
  }

  /**
   * Delete client scope
   * @param id client scope id
   */
  async deleteScope(id: number): Promise<void> {
    await ClientScopes.destroy({
      where: {
        id,
      },
    });
  }

  /**
   * get client grant types
   * @param clientId client id (clientId field)
   * @param fields grantTypes return fields
   * @param sorter sorter
   */
  getGrantTypes(
    clientId: string,
    fields: string[],
    { field: orderField = 'id', order = 'ASC' }: { field?: string; order?: 'ASC' | 'DESC' } = {},
  ): Promise<ClientGrantTypesModel | undefined> {
    return Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: ClientGrantTypes,
          attributes: this.filterFields(fields, ClientGrantTypes),
          as: 'ClientGrantTypes',
        },
      ],
      order: [[{ model: ClientGrantTypes, as: 'ClientGrantTypes' }, orderField, order]],
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
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return;

      const exists = await ClientGrantTypes.count({
        where: {
          clientId: client.id,
          grantType: input.grantType,
        },
      }).then((count) => count > 0);

      if (exists)
        throw new ValidationError(
          this.translate(
            'identity-server.datasource.client.grant_type_has_existed',
            'Client grant type has already existed!',
          ),
        );

      return ClientGrantTypes.create({
        ...input,
        clientId: client.id,
      }).then((grantType) => grantType.toJSON<ClientGrantTypeModel>());
    });
  }

  /**
   * Create new client grant types, skip if grant type already exists
   * @param clientId client id (clientId field)
   * @param inputs new client grant types input
   */
  createGrantTypes(clientId: string, inputs: NewClientGrantTypeInput[]): Promise<ClientGrantTypeModel[]> {
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return [];

      const grantTypes = await ClientGrantTypes.findAll({
        attributes: ['grantType'],
        where: {
          clientId: client.id,
          grantType: {
            [Op.in]: inputs.map((input) => input.grantType),
          },
        },
      });

      const existsGrantType = grantTypes.map((grantType) => grantType.grantType);

      return ClientGrantTypes.bulkCreate(
        inputs
          .filter((input) => !existsGrantType.includes(input.grantType))
          .map((input) => ({
            ...input,
            clientId: client.id,
          })),
      ).then((grantTypes) => grantTypes.map((grantType) => grantType.toJSON<ClientGrantTypeModel>()));
    });
  }

  /**
   * Delete client grant type
   * @param id client grant type id
   */
  async deleteGrantType(id: number): Promise<void> {
    await ClientGrantTypes.destroy({
      where: {
        id,
      },
    });
  }

  /**
   * get client redirect uris
   * @param clientId client id (clientId field)
   * @param fields redirectUris return fields
   * @param sorter sorter
   */
  getRedirectUris(
    clientId: string,
    fields: string[],
    { field: orderField = 'id', order = 'ASC' }: { field?: string; order?: 'ASC' | 'DESC' } = {},
  ): Promise<ClientRedirectUrisModel | undefined> {
    return Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: ClientRedirectUris,
          attributes: this.filterFields(fields, ClientRedirectUris),
          as: 'ClientRedirectUris',
        },
      ],
      order: [[{ model: ClientRedirectUris, as: 'ClientRedirectUris' }, orderField, order]],
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
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return;

      const exists = await ClientRedirectUris.count({
        where: {
          clientId: client.id,
          redirectUri: input.redirectUri,
        },
      }).then((count) => count > 0);

      if (exists)
        throw new ValidationError(
          this.translate(
            'identity-server.datasource.client.redirect_uri_has_existed',
            'Client redirect uri has already existed!',
          ),
        );

      return ClientRedirectUris.create({
        ...input,
        clientId: client.id,
      }).then((redirectUri) => redirectUri.toJSON<ClientRedirectUriModel>());
    });
  }

  /**
   * Create new client redirect uris, skip if redirect uri already exists
   * @param clientId client id (clientId field)
   * @param inputs new client redirect uris input
   */
  createRedirectUris(clientId: string, inputs: NewClientRedirectUriInput[]): Promise<ClientRedirectUriModel[]> {
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return [];

      const redirectUris = await ClientRedirectUris.findAll({
        attributes: ['redirectUri'],
        where: {
          clientId: client.id,
          redirectUri: {
            [Op.in]: inputs.map((input) => input.redirectUri),
          },
        },
      });

      const existsRedirectUri = redirectUris.map((redirectUri) => redirectUri.redirectUri);

      return ClientRedirectUris.bulkCreate(
        inputs
          .filter((input) => !existsRedirectUri.includes(input.redirectUri))
          .map((input) => ({
            ...input,
            clientId: client.id,
          })),
      ).then((redirectUris) => redirectUris.map((redirectUri) => redirectUri.toJSON<ClientRedirectUriModel>()));
    });
  }

  /**
   * Delete client redirect uri
   * @param id client redirect uri id
   */
  async deleteRedirectUri(id: number): Promise<void> {
    await ClientRedirectUris.destroy({
      where: {
        id,
      },
    });
  }

  /**
   * get client post logout redirect uris
   * @param clientId client id (clientId field)
   * @param fields postLogoutRedirectUris return fields
   * @param sorter sorter
   */
  getPostLogoutRedirectUris(
    clientId: string,
    fields: string[],
    { field: orderField = 'id', order = 'ASC' }: { field?: string; order?: 'ASC' | 'DESC' } = {},
  ): Promise<ClientPostLogoutRedirectUrisModel | undefined> {
    return Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: ClientPostLogoutRedirectUris,
          attributes: this.filterFields(fields, ClientPostLogoutRedirectUris),
          as: 'ClientPostLogoutRedirectUris',
        },
      ],
      order: [[{ model: ClientPostLogoutRedirectUris, as: 'ClientPostLogoutRedirectUris' }, orderField, order]],
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
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return;

      const exists = await ClientPostLogoutRedirectUris.count({
        where: {
          clientId: client.id,
          postLogoutRedirectUri: input.postLogoutRedirectUri,
        },
      }).then((count) => count > 0);

      if (exists)
        throw new ValidationError(
          this.translate(
            'identity-server.datasource.client.post_logout_redirect_uri_has_existed',
            'Client post logout redirect uri has already existed!',
          ),
        );

      return ClientPostLogoutRedirectUris.create({
        ...input,
        clientId: client.id,
      }).then((postLogoutRedirectUri) => postLogoutRedirectUri.toJSON<ClientPostLogoutRedirectUriModel>());
    });
  }

  /**
   * Create new client post logout redirect uris, skip if post logout redirect uri already exists
   * @param clientId client id (clientId field)
   * @param inputs new client post logout redirect uris input
   */
  createPostLogoutRedirectUris(
    clientId: string,
    inputs: NewClientPostLogoutRedirectUriInput[],
  ): Promise<ClientPostLogoutRedirectUriModel[]> {
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return [];

      const postLogoutRedirectUris = await ClientPostLogoutRedirectUris.findAll({
        attributes: ['postLogoutRedirectUri'],
        where: {
          clientId: client.id,
          postLogoutRedirectUri: {
            [Op.in]: inputs.map((input) => input.postLogoutRedirectUri),
          },
        },
      });

      const existsPostLogoutRedirectUri = postLogoutRedirectUris.map(
        (postLogoutRedirectUri) => postLogoutRedirectUri.postLogoutRedirectUri,
      );

      return ClientPostLogoutRedirectUris.bulkCreate(
        inputs
          .filter((input) => !existsPostLogoutRedirectUri.includes(input.postLogoutRedirectUri))
          .map((input) => ({
            ...input,
            clientId: client.id,
          })),
      ).then((postLogoutRedirectUris) =>
        postLogoutRedirectUris.map((postLogoutRedirectUri) =>
          postLogoutRedirectUri.toJSON<ClientPostLogoutRedirectUriModel>(),
        ),
      );
    });
  }

  /**
   * Delete client post logout redirect uri
   * @param id client post logout redirect uri id
   */
  async deletePostLogoutRedirectUri(id: number): Promise<void> {
    await ClientPostLogoutRedirectUris.destroy({
      where: {
        id,
      },
    });
  }

  /**
   * get client secrets
   * @param clientId client id (clientId field)
   * @param fields secrets return fields
   * @param sorter sorter
   */
  getSecrets(
    clientId: string,
    fields: string[],
    { field: orderField = 'id', order = 'DESC' }: { field?: string; order?: 'ASC' | 'DESC' } = {},
  ): Promise<ClientSecretsModel | undefined> {
    return Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: ClientSecrets,
          attributes: this.filterFields(fields, ClientSecrets),
          as: 'ClientSecrets',
        },
      ],
      order: [[{ model: ClientSecrets, as: 'ClientSecrets' }, orderField, order]],
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
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then((client) => {
      if (!client) return;

      return ClientSecrets.create({
        ...input,
        clientId: client.id,
      }).then((secret) => secret.toJSON<ClientSecretModel>());
    });
  }

  /**
   * Delete client secret
   * @param id client secret id
   */
  async deleteSecret(id: number): Promise<void> {
    await ClientSecrets.destroy({
      where: {
        id,
      },
    });
  }

  /**
   * get client properties
   * @param clientId client id (clientId field)
   * @param fields properties return fields
   * @param sorter sorter
   */
  getProperties(
    clientId: string,
    fields: string[],
    { field: orderField = 'id', order = 'DESC' }: { field?: string; order?: 'ASC' | 'DESC' } = {},
  ): Promise<ClientPropertiesModel | undefined> {
    return Clients.findOne({
      attributes: ['clientId', 'clientName'],
      where: {
        clientId,
      },
      include: [
        {
          model: ClientProperties,
          attributes: this.filterFields(fields, ClientProperties),
          as: 'ClientProperties',
        },
      ],
      order: [[{ model: ClientProperties, as: 'ClientProperties' }, orderField, order]],
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
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return;

      const exists = await ClientProperties.count({
        where: {
          clientId: client.id,
          key: input.key,
        },
      }).then((count) => count > 0);

      if (exists)
        throw new ValidationError(
          this.translate(
            'identity-server.datasource.client.property_has_existed',
            'Client property has already existed.',
          ),
        );

      return ClientProperties.create({
        ...input,
        clientId: client.id,
      }).then((property) => property.toJSON<ClientPropertyModel>());
    });
  }

  /**
   * Create new client properties, skip if property key already exists
   * @param clientId client id (clientId field)
   * @param inputs new client properties input
   */
  createProperties(clientId: string, inputs: NewClientPropertyInput[]): Promise<ClientPropertyModel[]> {
    return Clients.findOne({
      attributes: ['id'],
      where: {
        clientId,
      },
    }).then(async (client) => {
      if (!client) return [];

      const properties = await ClientProperties.findAll({
        attributes: ['key'],
        where: {
          clientId: client.id,
          key: {
            [Op.in]: inputs.map((input) => input.key),
          },
        },
      });

      const existsKey = properties.map((property) => property.key);

      return ClientProperties.bulkCreate(
        inputs
          .filter((input) => !existsKey.includes(input.key))
          .map((input) => ({
            ...input,
            clientId: client.id,
          })),
      ).then((properties) => properties.map((property) => property.toJSON<ClientPropertyModel>()));
    });
  }

  /**
   * Delete client property
   * @param id client property id
   */
  async deleteProperty(id: number): Promise<void> {
    await ClientProperties.destroy({
      where: {
        id,
      },
    });
  }
}
