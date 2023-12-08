import { Injectable } from '@nestjs/common';
import { WhereOptions, Order, Attributes, Op, Includeable } from 'sequelize';
import { default as ApiResources } from '../entities/api-resources.entity';
import { default as ApiScopes } from '../entities/api-scopes.entity';
import {
  ApiResourceModel,
  PagedApiResourceArgs,
  PagedApiResource,
  NewApiResourceInput,
  UpdateApiResourceInput,
  ApiClaimModel,
  ApiClaimsModel,
  NewApiClaimInput,
  ApiScopeModel,
  PagedApiScopeArgs,
  PagedApiScope,
  NewApiScopeInput,
  UpdateApiScopeInput,
  ApiScopeClaimsModel,
  ApiScopeClaimModel,
  NewApiScopeClaimInput,
  ApiSecretModel,
  ApiSecretsModel,
  NewApiSecretInput,
  ApiPropertyModel,
  ApiPropertiesModel,
  NewApiPropertyInput,
} from '../interfaces/api-resource.interface';
import { IdentityService } from '../../identity.service';
import { BaseDataSource } from './base.datasource';

@Injectable()
export class ApiResourceDataSource extends BaseDataSource {
  constructor(protected readonly identityService: IdentityService) {
    super();
  }

  /**
   * Get api resource
   * @param id api resource id
   * @param fields return fields,  "claims", "scopes", "secrets" or "properties" will be included if fields includes
   */
  get(
    id: number,
    fields: string[],
  ): Promise<
    | (ApiResourceModel & {
        claims?: ApiClaimModel[];
        scopes?: ApiScopeModel[];
        secrets?: ApiSecretModel[];
        properties?: ApiPropertyModel[];
      })
    | undefined
  > {
    // 主键(meta 查询)
    if (!fields.includes('id')) {
      fields.unshift('id');
    }

    return this.models.ApiResources.findByPk(id, {
      attributes: this.filterFields(fields, this.models.ApiResources),
      include: [
        fields.includes('claims') && {
          model: this.models.ApiClaims,
          attributes: ['id', 'type'],
          as: 'ApiClaims',
          required: false,
        },
        fields.includes('scopes') && {
          model: this.models.ApiScopes,
          attributes: ['id', 'name', 'emphasize', 'required', 'showInDiscoveryDocument'],
          as: 'ApiScopes',
          required: false,
        },
        fields.includes('secrets') && {
          model: this.models.ApiSecrets,
          attributes: ['id', 'type', 'value', 'expiresAt'],
          as: 'ApiSecrets',
          required: false,
        },
        fields.includes('properties') && {
          model: this.models.ApiProperties,
          attributes: ['id', 'key', 'value'],
          as: 'ApiProperties',
          required: false,
        },
      ].filter(Boolean) as Includeable,
    }).then((api) => {
      if (!api) return;

      const {
        ApiClaims: claims,
        ApiScopes: scopes,
        ApiSecrets: secrets,
        ApiProperties: properties,
        ...restForResource
      } = api.toJSON<
        ApiResourceModel & {
          ApiClaims?: ApiClaimModel[];
          ApiScopes?: ApiScopeModel[];
          ApiSecrets?: ApiSecretModel[];
          ApiProperties?: ApiPropertyModel[];
        }
      >();
      return {
        ...restForResource,
        claims,
        scopes,
        secrets,
        properties,
      };
    });
  }

  /**
   * Get paginated api resources
   * @param param paged api resource args
   * @param fields return fields
   */
  getPaged({ offset = 0, limit = 20, ...query }: PagedApiResourceArgs, fields: string[]): Promise<PagedApiResource> {
    // 主键
    if (!fields?.includes('id')) {
      fields.unshift('id');
    }

    const where: WhereOptions<Attributes<ApiResources>> = {};
    const { keywordField = 'name' } = query;
    if (query.keyword) {
      where[keywordField] = {
        [Op.like]: `%${query.keyword}%`,
      };
    }

    if (query.nonEditable !== undefined) {
      where.nonEditable = query.nonEditable;
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled;
    }

    return this.models.ApiResources.findAndCountAll({
      attributes: this.filterFields(fields, this.models.ApiResources),
      where,
      offset,
      limit,
      order: [
        // 根据 keyword 匹配程度排序
        !!query.keyword && [
          this.sequelize.literal(`CASE WHEN ${keywordField} = '${query.keyword}' THEN 0
        WHEN ${keywordField} LIKE '${query.keyword}%' THEN 1
        WHEN ${keywordField} LIKE '%${query.keyword}%' THEN 2
        WHEN ${keywordField} LIKE '%${query.keyword}' THEN 3
        ELSE 4 END`),
          'ASC',
        ],
        ['createdAt', 'DESC'],
      ].filter(Boolean) as Order,
    }).then(({ rows, count: total }) => ({
      rows: rows.map((row) => row.toJSON()),
      total,
    }));
  }

  /**
   * Create api resource
   * @param input new resource input
   */
  create(input: NewApiResourceInput): Promise<ApiResourceModel> {
    return this.models.ApiResources.create(input).then((api) => api.toJSON<ApiResourceModel>());
  }

  /**
   * Update api resource (return false if resource is non-editable)
   * @param id api resource id
   * @param input update resource input
   */
  async update(id: number, input: UpdateApiResourceInput): Promise<boolean> {
    const nonEditable = await this.models.ApiResources.count({
      where: {
        id,
        nonEditable: true,
      },
    }).then((count) => count > 0);

    if (nonEditable) return false;

    return this.models.ApiResources.update(input, {
      where: {
        id,
      },
    }).then(([count]) => count > 0);
  }

  /**
   * Update api resource last accessed time
   * @param id api resource id
   */
  updateLastAccessed(id: number): Promise<boolean> {
    return this.models.ApiResources.update(
      {
        lastAccessed: new Date(),
      },
      {
        where: {
          id,
        },
      },
    ).then(([count]) => count > 0);
  }

  /**
   * Delete api resource (return false if resource is non-editable)
   * @param id api resource id
   */
  async delete(id: number): Promise<boolean> {
    const resource = await this.models.ApiResources.findByPk(id);
    if (!resource) return true;

    if (resource.nonEditable) return false;

    await resource.destroy();

    return true;
  }

  /**
   * Get api resource claims
   * @param id api resource id
   * @param fields claims return fields
   */
  getClaims(id: number, fields: string[]): Promise<ApiClaimsModel | undefined> {
    return this.models.ApiResources.findByPk(id, {
      attributes: ['id', 'name', 'displayName'],
      include: [
        {
          model: this.models.ApiClaims,
          attributes: this.filterFields(fields, this.models.ApiClaims),
          as: 'ApiClaims',
        },
      ],
    }).then((api) => {
      if (!api) return;

      const { ApiClaims: claims, ...item } = api.toJSON<ApiResourceModel & { ApiClaims: ApiClaimModel[] }>();
      return {
        ...item,
        claims,
      };
    });
  }

  /**
   * Create api claim
   * @param apiResourceId api resource id
   * @param input new api claim input
   */
  createClaim(apiResourceId: number, input: NewApiClaimInput): Promise<ApiClaimModel | undefined> {
    return this.models.ApiResources.count({
      where: {
        id: apiResourceId,
      },
    }).then((count) => {
      if (count === 0) return;

      return this.models.ApiClaims.create({
        ...input,
        apiResourceId,
      }).then((claim) => claim.toJSON<ApiClaimModel>());
    });
  }

  /**
   * Delete api claim
   * @param id api claim id
   */
  deleteClaim(id: number): Promise<boolean> {
    return this.models.ApiClaims.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }

  /**
   * Get api scope
   * @param id api scope id
   * @param fields return fields, "claims" will be included if fields includes
   */
  getScope(
    id: number,
    fields: string[],
  ): Promise<
    | (ApiScopeModel & {
        claims?: ApiScopeClaimModel[];
      })
    | undefined
  > {
    return this.models.ApiScopes.findByPk(id, {
      attributes: this.filterFields(fields, this.models.ApiScopes),
      include: [
        fields.includes('claims') && {
          model: this.models.ApiScopeClaims,
          attributes: ['id', 'type'],
          as: 'ApiScopeClaims',
          required: false,
        },
      ].filter(Boolean) as Includeable,
    }).then((scope) => {
      if (!scope) return;

      const { ApiScopeClaims: claims, ...restForScope } = scope.toJSON<
        ApiScopeModel & { ApiScopeClaims: ApiScopeClaimModel[] }
      >();
      return {
        ...restForScope,
        claims,
      };
    });
  }

  /**
   * Get paginated api scopes
   * @param param paged api scop args
   * @param fields scopes return fields
   */
  getPagedScope({ offset = 0, limit = 20, ...query }: PagedApiScopeArgs, fields: string[]): Promise<PagedApiScope> {
    // 主键
    if (!fields?.includes('id')) {
      fields.unshift('id');
    }

    const where: WhereOptions<Attributes<ApiScopes>> = {};
    const { keywordField = 'name' } = query;
    if (query.keyword) {
      where[keywordField] = {
        [Op.like]: `%${query.keyword}%`,
      };
    }

    return this.models.ApiScopes.findAndCountAll({
      attributes: this.filterFields(fields, this.models.ApiScopes),
      where,
      offset,
      limit,
      order: [
        // 根据 keyword 匹配程度排序
        !!query.keyword && [
          this.sequelize.literal(`CASE WHEN ${keywordField} = '${query.keyword}' THEN 0
        WHEN ${keywordField} LIKE '${query.keyword}%' THEN 1
        WHEN ${keywordField} LIKE '%${query.keyword}%' THEN 2
        WHEN ${keywordField} LIKE '%${query.keyword}' THEN 3
        ELSE 4 END`),
          'ASC',
        ],
        ['createdAt', 'DESC'],
      ].filter(Boolean) as Order,
    }).then(({ rows, count: total }) => ({
      rows: rows.map((row) => row.toJSON()),
      total,
    }));
  }

  /**
   * get all api scopes
   * @param resourceId api resource id
   * @param fields return fields, "claims" will be included if fields includes
   */
  getScopeList(
    apiResourceId: number,
    fields: string[],
  ): Promise<
    Array<
      ApiScopeModel & {
        claims?: ApiScopeClaimModel[];
      }
    >
  > {
    return this.models.ApiScopes.findAll({
      attributes: this.filterFields(fields, this.models.ApiScopes),
      include: [
        fields.includes('claims') && {
          model: this.models.ApiScopeClaims,
          attributes: ['id', 'type'],
          as: 'ApiScopeClaims',
          required: false,
        },
      ].filter(Boolean) as Includeable,
      where: {
        apiResourceId,
      },
    }).then((scopes) => {
      return scopes.map((scope) => {
        const { ApiScopeClaims: claims, ...restForScope } = scope.toJSON<
          ApiScopeModel & { ApiScopeClaims: ApiScopeClaimModel[] }
        >();
        return {
          ...restForScope,
          claims,
        };
      });
    });
  }

  /**
   * Create api scope
   * @param apiResourceId api resource id
   * @param input new api scope input
   * @returns
   */
  createScope(apiResourceId: number, input: NewApiScopeInput): Promise<ApiScopeModel | undefined> {
    return this.models.ApiResources.count({
      where: {
        id: apiResourceId,
      },
    }).then((count) => {
      if (count === 0) return;

      return this.models.ApiScopes.create({
        ...input,
        apiResourceId,
      }).then((scope) => scope.toJSON<ApiScopeModel>());
    });
  }

  /**
   * update api scope (return false if api resource is non-editable)
   * @param id api scope id
   * @param input api scope input
   */
  async updateScope(id: number, input: UpdateApiScopeInput): Promise<boolean> {
    const nonEditable = await this.models.IdentityResources.count({
      include: [
        {
          model: this.models.ApiScopes,
          as: 'ApiScopes',
          where: {
            id,
            nonEditable: true,
          },
        },
      ],
      where: {
        nonEditable: true,
      },
    }).then((count) => count > 0);

    if (nonEditable) return false;

    return this.models.ApiScopes.update(input, {
      where: {
        id,
      },
    }).then(([count]) => count > 0);
  }

  /**
   * Delete api scope (return false if api resource is non-editable)
   * @param id api scope id
   */
  async deleteScope(id: number): Promise<boolean> {
    const nonEditable = await this.models.IdentityResources.count({
      include: [
        {
          model: this.models.ApiScopes,
          as: 'ApiScopes',
          where: {
            id,
            nonEditable: true,
          },
        },
      ],
      where: {
        nonEditable: true,
      },
    }).then((count) => count > 0);

    if (nonEditable) return false;

    return this.models.ApiScopes.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }

  /**
   * get api scope claims
   * @param apiScopeId api scope id
   * @param fields scopeClamis return fields
   */
  getScopeClaims(apiScopeId: number, fields: string[]): Promise<ApiScopeClaimsModel | undefined> {
    return this.models.ApiScopes.findByPk(apiScopeId, {
      attributes: ['id', 'name', 'displayName'],
      include: [
        {
          model: this.models.ApiScopeClaims,
          attributes: this.filterFields(fields, this.models.ApiScopeClaims),
          as: 'ApiScopeClaims',
        },
      ],
    }).then((api) => {
      if (!api) return;

      const { ApiScopeClaims: scopeClaims, ...item } = api.toJSON<
        ApiScopeModel & { ApiScopeClaims: ApiScopeClaimModel[] }
      >();
      return {
        ...item,
        scopeClaims,
      };
    });
  }

  /**
   * Create api scope claim
   * @param apiScopeId api scope id
   * @param input new api scope claim input
   */
  createScopeClaim(apiScopeId: number, input: NewApiScopeClaimInput): Promise<ApiScopeClaimModel | undefined> {
    return this.models.ApiScopes.count({
      where: {
        id: apiScopeId,
      },
    }).then((count) => {
      if (count === 0) return;

      return this.models.ApiScopeClaims.create({
        ...input,
        apiScopeId,
      }).then((claim) => claim.toJSON<ApiScopeClaimModel>());
    });
  }

  /**
   * Delete api scope claim
   * @param id api scope claim id
   */
  deleteScopeClaim(id: number): Promise<boolean> {
    return this.models.ApiScopeClaims.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }

  /**
   * get api secrets
   * @param apiScopeId api resource id
   * @param fields secrets return fields
   */
  getSecrets(apiResourceId: number, fields: string[]): Promise<ApiSecretsModel | undefined> {
    return this.models.ApiResources.findByPk(apiResourceId, {
      attributes: ['id', 'name', 'displayName'],
      include: [
        {
          model: this.models.ApiSecrets,
          attributes: this.filterFields(fields, this.models.ApiSecrets),
          as: 'ApiSecrets',
        },
      ],
    }).then((api) => {
      if (!api) return;

      const { ApiSecrets: secrets, ...item } = api.toJSON<ApiResourceModel & { ApiSecrets: ApiSecretModel[] }>();
      return {
        ...item,
        secrets,
      };
    });
  }

  /**
   * Create api secret
   * @param apiResourceId api resource id
   * @param input new api secret input
   */
  createSecret(apiResourceId: number, input: NewApiSecretInput): Promise<ApiSecretModel | undefined> {
    return this.models.ApiResources.count({
      where: {
        id: apiResourceId,
      },
    }).then((count) => {
      if (count === 0) return;

      return this.models.ApiSecrets.create({
        ...input,
        apiResourceId,
      }).then((secret) => secret.toJSON<ApiSecretModel>());
    });
  }

  /**
   * Mark api secret as expired
   * @param id api secret id
   */
  expireSecret(id: number): Promise<boolean> {
    return this.models.ApiSecrets.update(
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
   * Get api resource properties
   * @param id api resource id
   * @param fields properties return fields
   */
  getProperties(id: number, fields: string[]): Promise<ApiPropertiesModel | undefined> {
    return this.models.ApiResources.findByPk(id, {
      attributes: ['id', 'name', 'displayName'],
      include: [
        {
          model: this.models.ApiProperties,
          attributes: this.filterFields(fields, this.models.ApiProperties),
          as: 'ApiProperties',
        },
      ],
    }).then((api) => {
      if (!api) return;

      const { ApiProperties: properties, ...item } = api.toJSON<
        ApiResourceModel & { ApiProperties: ApiPropertyModel[] }
      >();
      return {
        ...item,
        properties,
      };
    });
  }

  /**
   * Create api property
   * @param apiResourceId api resource id
   * @param input api property input
   */
  createProperty(apiResourceId: number, input: NewApiPropertyInput): Promise<ApiPropertyModel | undefined> {
    return this.models.ApiResources.count({
      where: {
        id: apiResourceId,
      },
    }).then((count) => {
      if (count === 0) return;

      return this.models.ApiProperties.create({
        ...input,
        apiResourceId,
      }).then((property) => property.toJSON<ApiPropertyModel>());
    });
  }

  /**
   * Delete api property
   * @param id api property id
   */
  deleteProperty(id: number): Promise<boolean> {
    return this.models.ApiProperties.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }
}
