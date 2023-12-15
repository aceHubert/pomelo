import { isUndefined } from 'lodash';
import { WhereOptions, Model, Attributes, Transaction, Op } from 'sequelize';
import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { ValidationError, RequestUser } from '@ace-pomelo/shared-server';
import { default as TermTaxonomy } from '../entities/term-taxonomy.entity';
import {
  TermTaxonomyMetaModel,
  NewTermTaxonomyMetaInput,
  TermTaxonomyArgs,
  TermTaxonomyByObjectIdArgs,
  TermTaxonomyModel,
  TermRelationshipModel,
  NewTermRelationshipInput,
  NewTermTaxonomyInput,
  UpdateTermTaxonomyInput,
} from '../interfaces/term-taxonomy.interface';
import { MetaDataSource } from './meta.datasource';

@Injectable()
export class TermTaxonomyDataSource extends MetaDataSource<TermTaxonomyMetaModel, NewTermTaxonomyMetaInput> {
  constructor(protected readonly moduleRef: ModuleRef) {
    super(moduleRef);
  }

  /**
   * 获取协议
   * @param id Term Id
   * @param fields 返回的字段
   */
  get(id: number, fields: string[]): Promise<TermTaxonomyModel | undefined> {
    if (!fields.includes('id')) {
      // 主键(meta 查询)
      fields.unshift('id');
    }

    return this.models.TermTaxonomy.findOne({
      attributes: this.filterFields(fields, this.models.TermTaxonomy),
      where: {
        id,
      },
    }).then((term) => {
      if (term) {
        return term.toJSON<TermTaxonomyModel>();
      }
      return;
    });
  }

  /**
   * 获取协议列表
   * @param query 过滤的字段
   * @param fields 返回的字段
   */
  getList(parentIds: number[], fields: string[]): Promise<Record<number, TermTaxonomyModel[]>>;
  getList(query: TermTaxonomyArgs, fields: string[]): Promise<TermTaxonomyModel[]>;
  getList(
    parentIdsOrQuery: number[] | TermTaxonomyArgs,
    fields: string[],
  ): Promise<Record<number, TermTaxonomyModel[]> | TermTaxonomyModel[]> {
    let _query = parentIdsOrQuery as Omit<TermTaxonomyArgs, 'parentId' | 'taxonomy'> & {
      taxonomy?: string;
      parentId?: number | number[];
    };
    if (Array.isArray(parentIdsOrQuery)) {
      _query = {
        parentId: parentIdsOrQuery,
      };
      fields.push('parentId');
    }
    if (!fields.includes('id')) {
      // 主键(meta/children 查询)
      fields.unshift('id');
    }

    const where: WhereOptions<Attributes<TermTaxonomy>> = {};
    if (_query.keyword) {
      where['name'] = {
        [Op.like]: `%${_query.keyword}%`,
      };
    }
    if (_query.taxonomy) {
      where['taxonomy'] = _query.taxonomy;
    }
    if (!isUndefined(_query.parentId)) {
      where['parentId'] = _query.parentId;
    }
    if (!isUndefined(_query.group)) {
      where['group'] = _query.group;
    }
    if (_query.excludes) {
      where['id'] = {
        [Op.notIn]: _query.excludes,
      };
    }

    return this.models.TermTaxonomy.findAll({
      attributes: this.filterFields(fields, this.models.TermTaxonomy),
      where,
    }).then((terms) => {
      const format = (term: Model<TermTaxonomyModel>) => {
        return term.toJSON<TermTaxonomyModel>();
      };
      // Array is parentIds
      if (Array.isArray(parentIdsOrQuery)) {
        return (terms as any[]).reduce((prev, curr) => {
          const key = (curr as any)['parentId'] as number;
          if (!prev[key]) {
            prev[key] = [];
          }
          prev[key].push(format(curr));
          return prev;
        }, {} as Record<number, TermTaxonomyModel[]>);
      } else {
        return (terms as any[]).map(format);
      }
    });
  }

  /**
   * 获取协议关系列表
   * @param objectId 对象ID
   * @param fields 返回的字段
   */
  getListByObjectId(
    objectIds: number[],
    taxonomy: string,
    fields: string[],
  ): Promise<Record<number, TermTaxonomyModel[]>>;
  getListByObjectId(query: TermTaxonomyByObjectIdArgs, fields: string[]): Promise<TermTaxonomyModel[]>;
  getListByObjectId(
    objectIdsOrQuery: number[] | TermTaxonomyByObjectIdArgs,
    taxonomyOrFields: string | string[],
    fields?: string[],
  ): Promise<Record<number, TermTaxonomyModel[]> | TermTaxonomyModel[]> {
    const query = Array.isArray(objectIdsOrQuery)
      ? ({
          objectId: objectIdsOrQuery,
          taxonomy: taxonomyOrFields as string,
        } as Omit<TermTaxonomyByObjectIdArgs, 'objectId'> & { objectId: number | number[] })
      : objectIdsOrQuery;

    fields = Array.isArray(objectIdsOrQuery) ? fields! : (taxonomyOrFields as string[]);
    if (!fields.includes('id')) {
      // 主键(meta/children 查询)
      fields.unshift('id');
    }

    return this.models.TermTaxonomy.findAll({
      attributes: this.filterFields(fields, this.models.TermTaxonomy),
      include: [
        {
          model: this.models.TermRelationships,
          attributes: ['objectId'],
          as: 'TermRelationships',
          where: {
            objectId: query.objectId,
          },
        },
      ],
      where: {
        ...(!isUndefined(query.parentId) ? { parentId: query.parentId } : {}),
        taxonomy: query.taxonomy,
      },
      order: [[this.models.TermRelationships, 'order', query.desc ? 'DESC' : 'ASC']],
    }).then((terms) => {
      const format = (term: Model<TermTaxonomyModel>) => {
        return term.toJSON<TermTaxonomyModel>();
      };

      if (Array.isArray(objectIdsOrQuery)) {
        return (terms as any[]).reduce((prev, curr) => {
          const { TermRelationships } = curr;
          TermRelationships.forEach(({ objectId }: any) => {
            if (!prev[objectId]) {
              prev[objectId] = [];
            }
            prev[objectId].push(format(curr));
          });

          return prev;
        }, {} as Record<number, TermTaxonomyModel[]>);
      } else {
        return (terms as any[]).map(format);
      }
    });
  }

  /**
   * 新建协议
   * @param model 新建协议实体
   */
  async create(model: NewTermTaxonomyInput, requestUser: RequestUser): Promise<TermTaxonomyModel> {
    const t = await this.sequelize.transaction();
    const { name, slug, group, taxonomy, description, parentId } = model;
    try {
      // 添加类别
      const termTaxonomy = await this.models.TermTaxonomy.create(
        {
          name,
          slug: slug || name,
          taxonomy,
          description,
          group,
          parentId,
        },
        { transaction: t },
      );

      // 如提供，则会自动绑定关系
      if (model.objectId) {
        await this.createRelationship(
          {
            objectId: model.objectId,
            termTaxonomyId: termTaxonomy.id,
          },
          requestUser,
          t,
        );
      }

      await t.commit();

      return termTaxonomy.toJSON<TermTaxonomyModel>();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 新建协议关系
   * 如果关系存在则不允许创建（返回 ForbiddenError）
   * @param model 新建协议关系实体
   */
  async createRelationship(
    model: NewTermRelationshipInput,
    requestUser: RequestUser,
    transaction?: Transaction,
  ): Promise<TermRelationshipModel> {
    const isExists =
      (await this.models.TermRelationships.count({
        where: {
          objectId: model.objectId,
          termTaxonomyId: model.termTaxonomyId,
        },
      })) > 0;

    if (isExists) {
      throw new ValidationError(
        await this.translate(
          'datasource.termrelationship_duplicate_definition',
          'Term taxonomy relationship has been defined!',
          { lang: requestUser.lang },
        ),
      );
    }

    // 数量 +1
    await this.models.TermTaxonomy.increment('count', {
      where: {
        id: model.termTaxonomyId,
      },
      transaction,
    });
    const termRelationship = await this.models.TermRelationships.create(model, { transaction });
    return termRelationship.toJSON<TermRelationshipModel>();
  }

  /**
   * 修改协议
   * @param id term Id
   * @param model 修改协议实体
   */
  async update(id: number, model: UpdateTermTaxonomyInput): Promise<true> {
    try {
      await this.models.TermTaxonomy.update(model, {
        where: {
          id,
        },
      });

      return true;
    } catch (err) {
      throw err;
    }
  }

  /**
   * 删除协议关系
   * @param objectId
   * @param termTaxonomyId
   */
  async deleteRelationship(objectId: number, termTaxonomyId: number): Promise<true> {
    const t = await this.sequelize.transaction();
    try {
      const count = await this.models.TermRelationships.destroy({
        where: {
          objectId,
          termTaxonomyId,
        },
        transaction: t,
      });

      if (count > 0) {
        // 数量 -1
        await this.models.TermTaxonomy.increment('count', {
          where: {
            id: termTaxonomyId,
          },
          by: 0 - count,
          transaction: t,
        });
      }

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 删除协议（包括类别，关系，元数据）
   * @param id term Id
   */
  async delete(id: number): Promise<true> {
    const t = await this.sequelize.transaction();
    try {
      await this.models.TermRelationships.destroy({
        where: {
          termTaxonomyId: id,
        },
        transaction: t,
      });

      const termTaxonomy = await this.models.TermTaxonomy.findOne({
        where: {
          id,
        },
      });

      if (termTaxonomy) {
        await termTaxonomy.destroy({
          transaction: t,
        });

        // 子项层级提升
        await this.models.TermTaxonomy.update(
          { parentId: termTaxonomy.parentId },
          {
            where: {
              parentId: termTaxonomy.id,
            },
            transaction: t,
          },
        );
      }

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // 批量删除时子项提升查找parentId
  private getParentId(
    deleteTermTaxonomies: Array<{ id: number; parentId: number }>,
    itemModel: { id: number; parentId: number },
  ): number {
    const item = deleteTermTaxonomies.find((term) => term.id === itemModel.parentId);
    if (item) {
      return this.getParentId(deleteTermTaxonomies, item);
    }
    return itemModel.parentId;
  }

  /**
   * 批量删除协议（包括类别，关系，元数据）
   * @param id term Id
   */
  async bulkDelete(ids: number[]): Promise<true> {
    const t = await this.sequelize.transaction();
    try {
      await this.models.TermRelationships.destroy({
        where: {
          termTaxonomyId: ids,
        },
        transaction: t,
      });

      const termTaxonomies = await this.models.TermTaxonomy.findAll({
        where: {
          id: ids,
        },
      });

      if (termTaxonomies.length) {
        await this.models.TermTaxonomy.destroy({
          where: {
            id: termTaxonomies.map(({ id }) => id),
          },
          transaction: t,
        });

        // 子项层级提升
        await Promise.all(
          termTaxonomies.map((termTaxonomy) =>
            this.models.TermTaxonomy.update(
              { parentId: this.getParentId(termTaxonomies, termTaxonomy) },
              {
                where: {
                  parentId: termTaxonomy.id,
                },
                transaction: t,
              },
            ),
          ),
        );
      }

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
