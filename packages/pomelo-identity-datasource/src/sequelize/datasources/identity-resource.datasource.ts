import { Injectable } from '@nestjs/common';
import { WhereOptions, Order, Attributes, Op, Includeable } from 'sequelize';
import { default as IdentityResources } from '../entities/identity-resources.entity';
import {
  IdentityResourceModel,
  PagedIdentityResourceArgs,
  PagedIdentityResource,
  NewIdentityResourceInput,
  IdentityClaimModel,
  IdentityClaimsModel,
  NewIdentityClaimInput,
  IdentityPropertyModel,
  IdentityPropertiesModel,
  NewIdentityPropertyInput,
  UpdateIdentityResourceInput,
} from '../interfaces/identity-resource.interface';
import { IdentityService } from '../../identity.service';
import { BaseDataSource } from './base.datasource';

@Injectable()
export class IdentityResourceDataSource extends BaseDataSource {
  constructor(protected readonly identityService: IdentityService) {
    super();
  }

  /**
   * Get identity resource
   * @param id identity resource id
   * @param fields return fields, "claims" or "properties" will be included if fields includes
   */
  get(
    id: number,
    fields: string[],
  ): Promise<
    (IdentityResourceModel & { claims?: IdentityClaimModel[]; properties?: IdentityPropertyModel[] }) | undefined
  > {
    // 主键(meta 查询)
    if (!fields.includes('id')) {
      fields.unshift('id');
    }

    return this.models.IdentityResources.findByPk(id, {
      attributes: this.filterFields(fields, this.models.IdentityResources),
      include: [
        fields.includes('claims') && {
          model: this.models.IdentityClaims,
          attributes: ['id', 'type'],
          as: 'IdentityClaims',
          required: false,
        },
        fields.includes('properties') && {
          model: this.models.IdentityProperties,
          attributes: ['id', 'key', 'value'],
          as: 'IdentityProperties',
          required: false,
        },
      ].filter(Boolean) as Includeable,
    }).then((resource) => {
      if (!resource) return;

      const {
        IdentityClaims: claims,
        IdentityProperties: properties,
        ...restForResource
      } = resource.toJSON<
        IdentityResourceModel & {
          IdentityClaims?: IdentityClaimModel[];
          IdentityProperties?: IdentityPropertyModel[];
        }
      >();
      return {
        ...restForResource,
        claims,
        properties,
      };
    });
  }

  /**
   * get paginated identity resources
   * @param param paged identity resource args
   * @param fields return fields
   */
  getPaged(
    { offset = 0, limit = 20, ...query }: PagedIdentityResourceArgs,
    fields: string[],
  ): Promise<PagedIdentityResource> {
    // 主键
    if (!fields?.includes('id')) {
      fields.unshift('id');
    }

    const where: WhereOptions<Attributes<IdentityResources>> = {};
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

    return this.models.IdentityResources.findAndCountAll({
      attributes: this.filterFields(fields, this.models.IdentityResources),
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
   * Get all enabled identity resources
   * @param fields return fields, "claims" or "properties" will be included if fields includes
   */
  getList(
    fields: string[],
  ): Promise<Array<IdentityResourceModel & { claims?: IdentityClaimModel[]; properties?: IdentityPropertyModel[] }>> {
    return this.models.IdentityResources.findAll({
      attributes: this.filterFields(fields!, this.models.IdentityResources),
      include: [
        fields.includes('claims') && {
          model: this.models.IdentityClaims,
          attributes: ['id', 'type'],
          as: 'IdentityClaims',
          required: false,
        },
        fields.includes('properties') && {
          model: this.models.IdentityProperties,
          attributes: ['id', 'key', 'value'],
          as: 'IdentityProperties',
          required: false,
        },
      ].filter(Boolean) as Includeable,
      where: {
        enabled: true,
      },
    }).then((resources) => {
      return resources.map((resource) => {
        const {
          IdentityClaims: claims,
          IdentityProperties: properties,
          ...restForResource
        } = resource.toJSON<
          IdentityResourceModel & {
            IdentityClaims?: IdentityClaimModel[];
            IdentityProperties?: IdentityPropertyModel[];
          }
        >();
        return {
          ...restForResource,
          claims,
          properties,
        };
      });
    });
  }

  /**
   * Create identity resource
   * @param input resource input
   */
  async create(input: NewIdentityResourceInput): Promise<IdentityResourceModel> {
    const exists = await this.models.IdentityResources.count({
      where: {
        name: input.name,
      },
    }).then((count) => count > 0);

    if (exists) throw new Error('Identity resource has already exists');

    return this.models.IdentityResources.create(input).then((resource) => {
      return resource.toJSON<IdentityResourceModel>();
    });
  }

  /**
   * Update identity resource (return false if resource is non-editable)
   * @param id resource id
   * @param input resource input
   */
  async update(id: number, input: UpdateIdentityResourceInput): Promise<boolean> {
    const nonEditable = await this.models.IdentityResources.count({
      where: {
        id,
        nonEditable: true,
      },
    }).then((count) => count > 0);

    if (nonEditable) return false;

    return this.models.IdentityResources.update(input, {
      where: {
        id,
      },
    }).then(([count]) => count > 0);
  }

  /**
   * Delete identity resource (return false if resource is non-editable)
   * @param id resource id
   * @returns
   */
  async delete(id: number): Promise<boolean> {
    const resource = await this.models.IdentityResources.findByPk(id, {
      attributes: ['id', 'nonEditable'],
    });
    if (!resource) return true;

    if (resource.nonEditable) return false;

    await resource.destroy();

    return true;
  }

  /**
   * Get identity resource claims
   * @param identityResourceId identity resource id
   * @param fields return fields
   * @param sorter sorter
   */
  getClaims(
    identityResourceId: number,
    fields: string[],
    { field: orderField = 'id', order = 'ASC' }: { field?: string; order?: 'ASC' | 'DESC' } = {},
  ): Promise<IdentityClaimsModel | undefined> {
    return this.models.IdentityResources.findByPk(identityResourceId, {
      attributes: ['id', 'name', 'displayName', 'nonEditable'],
      include: [
        {
          model: this.models.IdentityClaims,
          attributes: this.filterFields(fields, this.models.IdentityClaims),
          as: 'IdentityClaims',
        },
      ],
      order: [[{ model: this.models.IdentityClaims, as: 'IdentityClaims' }, orderField, order]],
    }).then((resource) => {
      if (!resource) return;

      const { IdentityClaims: claims, ...item } = resource.toJSON<
        IdentityResourceModel & { IdentityClaims: IdentityClaimModel[] }
      >();
      return {
        ...item,
        claims,
      };
    });
  }

  /**
   * Create identity resource claim
   * @param identityResourceId identity resource id
   * @param input claim input
   */
  createClaim(identityResourceId: number, input: NewIdentityClaimInput): Promise<IdentityClaimModel | undefined> {
    return this.models.IdentityResources.count({
      where: {
        id: identityResourceId,
      },
    }).then(async (count) => {
      if (count === 0) return;

      const exists = await this.models.IdentityClaims.count({
        where: {
          identityResourceId,
          type: input.type,
        },
      }).then((count) => count > 0);

      if (exists) throw new Error('Claim has already exists');

      return this.models.IdentityClaims.create({
        ...input,
        identityResourceId,
      }).then((claim) => {
        return claim.toJSON<IdentityClaimModel>();
      });
    });
  }

  /**
   * create new identity resource claims, skip if claim type already exists
   * @param identityResourceId identity resource id
   * @param inputs new identity resource claims input
   */
  createClaims(identityResourceId: number, inputs: NewIdentityClaimInput[]): Promise<IdentityClaimModel[]> {
    return this.models.IdentityResources.count({
      where: {
        id: identityResourceId,
      },
    }).then(async (count) => {
      if (count === 0) return [];

      const claims = await this.models.IdentityClaims.findAll({
        attributes: ['type'],
        where: {
          identityResourceId,
          type: {
            [Op.in]: inputs.map((input) => input.type),
          },
        },
      });

      const existsType = claims.map((claim) => claim.type);

      return this.models.IdentityClaims.bulkCreate(
        inputs
          .filter((input) => !existsType.includes(input.type))
          .map((input) => ({
            ...input,
            identityResourceId,
          })),
      ).then((claims) => claims.map((claim) => claim.toJSON<IdentityClaimModel>()));
    });
  }

  /**
   * Delete identity resource claim
   * @param id identity claim id
   */
  deleteClaim(id: number): Promise<boolean> {
    return this.models.IdentityClaims.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }

  /**
   * Get identity resource properties
   * @param identityResourceId identity resource id
   * @param fields return fields
   * @param sorter sorter
   */
  getProperties(
    identityResourceId: number,
    fields: string[],
    { field: orderField = 'id', order = 'DESC' }: { field?: string; order?: 'ASC' | 'DESC' } = {},
  ): Promise<IdentityPropertiesModel | undefined> {
    return this.models.IdentityResources.findByPk(identityResourceId, {
      attributes: ['id', 'name', 'displayName', 'nonEditable'],
      include: [
        {
          model: this.models.IdentityProperties,
          attributes: this.filterFields(fields, this.models.IdentityProperties),
          as: 'IdentityProperties',
        },
      ],
      order: [[{ model: this.models.IdentityProperties, as: 'IdentityProperties' }, orderField, order]],
    }).then((resource) => {
      if (!resource) return;

      const { IdentityProperties: properties, ...item } = resource.toJSON<
        IdentityResourceModel & { IdentityProperties: IdentityPropertyModel[] }
      >();
      return {
        ...item,
        properties,
      };
    });
  }

  /**
   * Create identity resource property
   * @param identityResourceId identity resource id
   * @param input property input
   */
  createProperty(
    identityResourceId: number,
    input: NewIdentityPropertyInput,
  ): Promise<IdentityPropertyModel | undefined> {
    return this.models.IdentityResources.count({
      where: {
        id: identityResourceId,
      },
    }).then(async (count) => {
      if (count === 0) return;

      const exists = await this.models.IdentityProperties.count({
        where: {
          identityResourceId,
          key: input.key,
        },
      }).then((count) => count > 0);

      if (exists) throw new Error('Property has already exists.');

      return this.models.IdentityProperties.create({
        ...input,
        identityResourceId,
      }).then((property) => {
        return property.toJSON<IdentityPropertyModel>();
      });
    });
  }

  /**
   * Create new identity resource properties, skip if property key already exists
   * @param identityResourceId identity resource id
   * @param inputs new identity resource properties input
   */
  createProperties(identityResourceId: number, inputs: NewIdentityPropertyInput[]): Promise<IdentityPropertyModel[]> {
    return this.models.IdentityResources.count({
      where: {
        id: identityResourceId,
      },
    }).then(async (count) => {
      if (count === 0) return [];

      const properties = await this.models.IdentityProperties.findAll({
        attributes: ['key'],
        where: {
          identityResourceId,
          key: {
            [Op.in]: inputs.map((input) => input.key),
          },
        },
      });

      const existsKey = properties.map((property) => property.key);

      return this.models.IdentityProperties.bulkCreate(
        inputs
          .filter((input) => !existsKey.includes(input.key))
          .map((input) => ({
            ...input,
            identityResourceId,
          })),
      ).then((properties) => properties.map((property) => property.toJSON<IdentityPropertyModel>()));
    });
  }

  /**
   * Delete identity resource property
   * @param id property id
   */
  deleteProperty(id: number): Promise<boolean> {
    return this.models.IdentityProperties.destroy({
      where: {
        id,
      },
    }).then((count) => count > 0);
  }
}
