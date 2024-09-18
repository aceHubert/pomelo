import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { WhereOptions, Attributes, Includeable, Transaction, Op, Order } from 'sequelize';
import {
  UserInputError,
  ForbiddenError,
  ValidationError,
  UserCapability,
  OptionPresetKeys,
  TermPresetTaxonomy,
  TemplateStatus,
  TemplatePresetType,
} from '@ace-pomelo/shared/server';
import { default as Templates } from '../entities/templates.entity';
import {
  TemplateInnerStatus,
  TemplateInnerType,
  TemplateModel,
  TemplateOptionArgs,
  TemplateOptionModel,
  PagedTemplateArgs,
  PagedTemplateModel,
  TemplateMetaModel,
  NewTemplateMetaInput,
  NewTemplateInput,
  UpdateTemplateInput,
  // form
  NewFormTemplateInput,
  UpdateFormTemplateInput,
  // page
  NewPageTemplateInput,
  UpdatePageTemplateInput,
  // post
  NewPostTemplateInput,
  UpdatePostTemplateInput,
} from '../interfaces/template.interface';
import { MetaDataSource } from './meta.datasource';

/**
 * 操作状态（仅内部使用）
 */
const TemplateOperateStatus = Object.freeze(Object.values(TemplateInnerStatus));

/**
 * 操作类型（仅内部使用）
 */
// const TemplateOperateType = Object.freeze(Object.values(TemplateInnerType));

/**
 * 元数据key (仅内部使用)
 */
enum TemplateMetaPresetKeys {
  /** 在移入垃圾箱之前的状态 */
  TrashStatus = '$trash_status',
  /** 在移入垃圾箱的时间 */
  TrashTime = '$trash_time',
}

@Injectable()
export class TemplateDataSource extends MetaDataSource<TemplateMetaModel, NewTemplateMetaInput> {
  constructor(moduleRef: ModuleRef) {
    super(moduleRef);
  }

  /**
   * 修正唯一名称，在末尾添加数字
   * @param name 唯一名称，用于URL地址
   */
  private async fixName(name: string, type: string) {
    name = escape(name).trim();
    if (!name) return '';

    const count = await this.models.Templates.count({
      where: {
        name: {
          [Op.or]: {
            [Op.like]: `${name}-%`,
            [Op.eq]: name,
          },
        },
        type,
      },
    });

    if (count === 0) {
      return name;
    } else {
      return `${name}-${count}`;
    }
  }

  /**
   * 是否有修改权限，没有则会直接抛出异常
   * @param template Tempate
   * @param requestUserId 登录用户ID
   */
  private async hasEditCapability(template: Pick<Attributes<Templates>, 'status' | 'author'>, requestUserId: number) {
    // 是否有编辑模版权限
    await this.hasCapability(UserCapability.EditTemplates, requestUserId);

    // 是否有编辑已发布模版权限
    if (template.status === TemplateStatus.Publish || template.status === TemplateStatus.Future) {
      await this.hasCapability(UserCapability.EditPublishedTemplates, requestUserId);
    }

    if (template.author !== requestUserId) {
      // 是否有编辑别人模版权限
      await this.hasCapability(UserCapability.EditOthersTemplates, requestUserId);

      // 是否有编辑私有的(别人)模版权限
      if (template.status === TemplateStatus.Private) {
        await this.hasCapability(UserCapability.EditPrivateTemplates, requestUserId);
      }
    }
  }

  /**
   * 是否有删除权限，没有则会直接抛出异常
   * @param template Tempate
   * @param requestUserId 登录用户ID
   */
  private async hasDeleteCapability(template: Pick<Attributes<Templates>, 'status' | 'author'>, requestUserId: number) {
    // 是否有删除模版权限
    await this.hasCapability(UserCapability.DeleteTemplates, requestUserId);

    // 是否有删除已发布模版权限
    if (template.status === TemplateStatus.Publish || template.status === TemplateStatus.Future) {
      await this.hasCapability(UserCapability.DeletePublishedTemplates, requestUserId);
    }

    // 是否有删除别人模版权限
    if (template.author !== requestUserId) {
      await this.hasCapability(UserCapability.DeleteOthersTemplates, requestUserId);

      // 是否有删除私有的(别人)模版权限
      if (template.status === TemplateStatus.Private) {
        await this.hasCapability(UserCapability.DeletePrivateTemplates, requestUserId);
      }
    }
  }

  private async checkOperateStatus(status: string) {
    if (TemplateOperateStatus.includes(status as TemplateInnerStatus)) {
      if (status === TemplateInnerStatus.AutoDraft) {
        throw new UserInputError(
          this.translate(
            'infrastructure-server.datasource.template.operate_status_autodraft_is_not_allowed',
            `Status "AutoDraft" is not allowed!`,
          ),
        );
      }
      throw new UserInputError(
        this.translate(
          'infrastructure-server.datasource.template.operate_status_is_not_allowed',
          `Status "${status}" is not allowed!`,
          {
            args: {
              status,
            },
          },
        ),
      );
    }
  }

  /**
   * 记录修改为 Trash 状态之前的状态
   * @param templateId Template id
   * @param prevStatus 之前的状态
   */
  private async storeTrashStatus(templateId: number, prevStatus: string, t?: Transaction) {
    return await this.models.TemplateMeta.bulkCreate(
      [
        {
          templateId,
          metaKey: TemplateMetaPresetKeys.TrashStatus,
          metaValue: prevStatus,
        },
        {
          templateId,
          metaKey: TemplateMetaPresetKeys.TrashTime,
          metaValue: String(Date.now()),
        },
      ],
      {
        updateOnDuplicate: ['metaValue'], // mssql not support
        transaction: t,
      },
    );
  }

  /**
   * 批量记录修改为 Trash 状态之前的状态
   * @param templateIds Template ids
   */
  private async bulkStoreTrashStatus(templatesOrtemplateIds: Attributes<Templates>[] | number[], t?: Transaction) {
    const templates = templatesOrtemplateIds.some((templateOrId) => typeof templateOrId === 'number')
      ? await this.models.Templates.findAll({
          attributes: ['id', 'status'],
          where: {
            id: templatesOrtemplateIds as number[],
          },
        })
      : (templatesOrtemplateIds as Attributes<Templates>[]);

    if (!templates.length) return [];

    return await this.models.TemplateMeta.bulkCreate(
      Array.prototype.concat.apply(
        [],
        templates.map((template) => [
          {
            templateId: template.id,
            metaKey: TemplateMetaPresetKeys.TrashStatus,
            metaValue: template.status,
          },
          {
            templateId: template.id,
            metaKey: TemplateMetaPresetKeys.TrashTime,
            metaValue: String(Date.now()),
          },
        ]),
      ),
      {
        updateOnDuplicate: ['metaValue'], // mssql not support
        transaction: t,
      },
    );
  }

  /**
   * 获取模版
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access Authorized?
   * @param id Template id
   * @param type 类型(不限制类型传 undefined)
   * @param fields 返回字段
   * @param requestUserId 请求的用户ID, 匿名用户只能查询 published 的内容
   */
  async get(
    id: number,
    type: string | undefined,
    fields: string[],
    requestUserId?: number,
  ): Promise<TemplateModel | undefined> {
    if (!fields.includes('id')) {
      // 主键(meta 查询)
      fields.unshift('id');
    }

    const andWhere: WhereOptions<Attributes<Templates>>[] = [];
    const where: WhereOptions<Attributes<Templates>> = {
      id,
      [Op.and]: andWhere,
    };

    if (!!type) {
      andWhere.push({
        type,
      });
    }

    // 匿名用户只能查询 published 的内容
    if (!requestUserId) {
      andWhere.push({
        status: TemplateStatus.Publish,
      });
    } else {
      andWhere.push({
        // 不包含所有的操作时的状态
        status: {
          [Op.notIn]: TemplateOperateStatus,
        },
        // 不返回非自己草稿、垃圾箱的内容
        [Op.not]: {
          status: [TemplateStatus.Draft, TemplateStatus.Trash],
          author: {
            [Op.ne]: requestUserId,
          },
        },
      });

      // 如果没有编辑别人权限，则不返回非自己的内容
      const hasEditOthersCapability = await this.hasCapability(UserCapability.EditOthersTemplates, requestUserId)
        .then(() => true)
        .catch(() => false);

      if (!hasEditOthersCapability) {
        andWhere.push({
          author: requestUserId,
        });
      }

      // 如果没有编辑私有权限，则不返回非自己私有的内容
      const hasEditPrivateCapability = await this.hasCapability(UserCapability.EditPrivateTemplates, requestUserId)
        .then(() => true)
        .catch(() => false);

      if (!hasEditPrivateCapability) {
        andWhere.push({
          [Op.not]: {
            status: TemplateStatus.Private,
            author: {
              [Op.ne]: requestUserId,
            },
          },
        });
      }
    }
    return this.models.Templates.findOne({
      attributes: this.filterFields(fields, this.models.Templates),
      where,
    }).then((template) => template?.toJSON<TemplateModel>());
  }

  /**
   * 根据name获取模版
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access Authorized?
   * @param name Template name
   * @param type 类型(不限制类型传 undefined)
   * @param fields 返回字段
   * @param requestUserId 请求的用户ID, 匿名用户只能查询 published 的内容
   */
  async getByName(
    name: string,
    type: string | undefined,
    fields: string[],
    requestUserId?: number,
  ): Promise<TemplateModel | undefined> {
    if (!fields.includes('id')) {
      // 主键(meta 查询)
      fields.unshift('id');
    }

    const andWhere: WhereOptions<Attributes<Templates>>[] = [];
    const where: WhereOptions<Attributes<Templates>> = {
      name,
      [Op.and]: andWhere,
    };

    if (!!type) {
      andWhere.push({
        type,
      });
    }

    // 匿名用户只能查询 published 的内容
    if (!requestUserId) {
      andWhere.push({
        status: TemplateStatus.Publish,
      });
    } else {
      andWhere.push({
        // 不包含所有的操作时的状态
        status: {
          [Op.notIn]: TemplateOperateStatus,
        },
        // 不返回非自己草稿、垃圾箱的内容
        [Op.not]: {
          status: [TemplateStatus.Draft, TemplateStatus.Trash],
          author: {
            [Op.ne]: requestUserId,
          },
        },
      });

      // 如果没有编辑别人权限，则不返回非自己的内容
      const hasEditOthersCapability = await this.hasCapability(UserCapability.EditOthersTemplates, requestUserId)
        .then(() => true)
        .catch(() => false);

      if (!hasEditOthersCapability) {
        andWhere.push({
          author: requestUserId,
        });
      }

      // 如果没有编辑私有权限，则不返回非自己私有的内容
      const hasEditPrivateCapability = await this.hasCapability(UserCapability.EditPrivateTemplates, requestUserId)
        .then(() => true)
        .catch(() => false);

      if (!hasEditPrivateCapability) {
        andWhere.push({
          [Op.not]: {
            status: TemplateStatus.Private,
            author: {
              [Op.ne]: requestUserId,
            },
          },
        });
      }
    }
    return this.models.Templates.findOne({
      attributes: this.filterFields(fields, this.models.Templates),
      where,
    }).then((template) => template?.toJSON<TemplateModel>());
  }

  /**
   * 获取模版Options，只返回 Publish 状态的数据
   * 默认返回 id, title 字段，可通过 fields 字段定义
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access None
   * @param id Template id
   * @param type 类型
   * @param fields 返回字段
   * @param requestUser 请求的用户
   */
  async getOptions(query: TemplateOptionArgs, type: string, fields = ['id', 'title']): Promise<TemplateOptionModel[]> {
    const include: Includeable[] = [],
      andWhere: WhereOptions<Attributes<Templates>>[] = [],
      where: WhereOptions<Attributes<Templates>> = {
        status: TemplateStatus.Publish,
        type,
        [Op.not]: {
          title: '',
        },
        [Op.and]: andWhere,
      };
    const { keywordField = 'title', keyword, author, date, taxonomies = [] } = query;
    if (keyword) {
      andWhere.push({
        [keywordField]: {
          [Op.like]: `%${keyword}%`,
        },
      });
    }
    if (author) {
      andWhere.push({
        author: author,
      });
    }

    if (date) {
      andWhere.push(
        this.sequelize.where(
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? this.sequelize.fn(
                'LEFT',
                this.sequelize.fn(
                  'CONVERT',
                  this.sequelize.literal('varchar(12)'),
                  this.col('createdAt', this.models.Templates),
                  112,
                ),
                date.length,
              )
            : this.sequelize.fn(
                'DATE_FORMAT',
                this.col('createdAt', this.models.Templates),
                date.length === 4 ? '%Y' : date.length === 6 ? '%Y%m' : '%Y%m%d',
              ),
          date,
        ),
      );
    }

    for (const { id: taxonomyId, name: taxonomyName, type: taxonomyType } of taxonomies as Array<{
      id?: number;
      name?: string;
      type: string;
    }>) {
      if (taxonomyId) {
        include.push({
          model: this.models.TermRelationships,
          as: 'TermRelationships',
          include: [
            {
              model: this.models.TermTaxonomy,
              as: 'TermTaxonomy',
              duplicating: false,
            },
          ],
          duplicating: false,
        });

        // 特殊处理：如果是默认分类的情况下，查询是默认分类或没有分类的所有项
        if (
          taxonomyType === TermPresetTaxonomy.Category &&
          (await this.getOption(OptionPresetKeys.DefaultCategory)) === String(taxonomyId)
        ) {
          andWhere.push({
            [`$TermRelationships.TermTaxonomy.${this.field('id', this.models.TermTaxonomy)}$`]: {
              [Op.or]: [taxonomyId, { [Op.is]: null }],
            },
          });
        } else {
          andWhere.push({
            [`$TermRelationships.TermTaxonomy.${this.field('id', this.models.TermTaxonomy)}$`]: taxonomyId,
            [`$TermRelationships.TermTaxonomy.${this.field('taxonomy', this.models.TermTaxonomy)}$`]: taxonomyType,
          });
        }
      } else if (taxonomyName) {
        include.push({
          model: this.models.TermRelationships,
          as: 'TermRelationships',
          attributes: [],
          include: [
            {
              model: this.models.TermTaxonomy,
              as: 'TermTaxonomy',
              attributes: [],
            },
          ],
          duplicating: false,
        });

        andWhere.push({
          [`$TermRelationships.TermTaxonomy.${this.field('name', this.models.TermTaxonomy)}$`]: taxonomyName,
          [`$TermRelationships.TermTaxonomy.${this.field('taxonomy', this.models.TermTaxonomy)}$`]: taxonomyType,
        });
      }
    }

    return this.models.Templates.findAll({
      attributes: this.filterFields(fields, this.models.Templates),
      include,
      where,
    });
  }

  /**
   * 获取模版别名
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access None
   * @param type 类型
   */
  async getNames(type: string): Promise<string[]> {
    const templates = await this.models.Templates.findAll({
      attributes: ['name'],
      where: {
        type,
        [Op.not]: {
          name: '',
        },
      },
    });

    return templates.map((template) => template.name);
  }

  /**
   * 获取我的数量 (不包含草稿的)
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access Authorized
   * @param type 类型
   * @param includeTrashStatus 包含草稿状态
   * @param requestUserId 请求的用户ID
   */
  getCountBySelf(type: string, includeTrashStatus: boolean, requestUserId: number) {
    const notIn: Array<TemplateStatus | TemplateInnerStatus> = [...TemplateOperateStatus];
    if (!includeTrashStatus) {
      notIn.push(TemplateStatus.Trash);
    }

    return this.models.Templates.count({
      where: {
        type,
        status: {
          // 不包含所有的操作时的状态
          [Op.notIn]: notIn,
        },
        author: requestUserId,
      },
    });
  }

  /**
   * 按天分组获取数量
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param month 月份：yyyyMM
   * @param type 类型
   */
  getCountByDay(month: string, type: string) {
    const mssqlDayCol = this.sequelize.fn(
      'LEFT',
      this.sequelize.fn(
        'CONVERT',
        this.sequelize.literal('varchar(12)'),
        this.col('createdAt', this.models.Templates),
        112,
      ),
      8,
    );
    return this.models.Templates.count({
      attributes: [
        [
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? mssqlDayCol
            : this.sequelize.fn('DATE_FORMAT', this.col('createdAt', this.models.Templates), '%Y%m%d'),
          'day',
        ],
      ],
      where: {
        type,
        status: {
          // 不包含所有的操作时的状态
          [Op.notIn]: [...TemplateOperateStatus],
        },
        [Op.and]: this.sequelize.where(
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? this.sequelize.fn(
                'LEFT',
                this.sequelize.fn(
                  'CONVERT',
                  this.sequelize.literal('varchar(12)'),
                  this.col('createdAt', this.models.Templates),
                  112,
                ),
                6,
              )
            : this.sequelize.fn('DATE_FORMAT', this.col('createdAt', this.models.Templates), '%Y%m'),
          month,
        ),
      },
      // TODO: 只支持 mssql 和 mysql
      group: this.sequelize.getDialect() === 'mssql' ? mssqlDayCol : 'day',
    });
  }

  /**
   * 按月分组获取数量
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param param year: 当前年的月份分组，months: 如果年没有值，则从当前时间向前推多少个月（默认12个月）
   * @param type 类型
   */
  getCountByMonth({ year, months }: { year?: string; months?: number }, type: string) {
    if (!year) {
      months = months || 12; // 默认向前推12个月
    }

    const mssqlMonthCol = this.sequelize.fn(
      'LEFT',
      this.sequelize.fn(
        'CONVERT',
        this.sequelize.literal('varchar(12)'),
        this.col('createdAt', this.models.Templates),
        112,
      ),
      6,
    );

    return this.models.Templates.count({
      attributes: [
        [
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? mssqlMonthCol
            : this.sequelize.fn('DATE_FORMAT', this.col('createdAt', this.models.Templates), '%Y%m'),
          'month',
        ],
      ],
      where: {
        type,
        status: {
          // 不包含所有的操作时的状态
          [Op.notIn]: TemplateOperateStatus,
        },
        [Op.and]: year
          ? this.sequelize.where(
              // TODO: 只支持 mssql 和 mysql
              this.sequelize.getDialect() === 'mssql'
                ? this.sequelize.fn(
                    'LEFT',
                    this.sequelize.fn(
                      'CONVERT',
                      this.sequelize.literal('varchar(12)'),
                      this.col('createdAt', this.models.Templates),
                      112,
                    ),
                    4,
                  )
                : this.sequelize.fn('DATE_FORMAT', this.col('createdAt', this.models.Templates), '%Y'),
              year,
            )
          : this.sequelize.where(
              // TODO: 只支持 mssql 和 mysql
              this.sequelize.getDialect() === 'mssql'
                ? this.sequelize.fn(
                    'DATEDIFF',
                    this.sequelize.literal('mm'),
                    this.col('createdAt', this.models.Templates),
                    this.sequelize.literal('getdate()'),
                  )
                : this.sequelize.fn(
                    'TIMESTAMPDIFF',
                    this.sequelize.literal('MONTH'),
                    this.col('createdAt', this.models.Templates),
                    this.sequelize.literal('CURRENT_TIMESTAMP'),
                  ),
              { [Op.lte]: months },
            ),
      },
      // TODO: 只支持 mssql 和 mysql
      group: this.sequelize.getDialect() === 'mssql' ? mssqlMonthCol : 'month',
    });
  }

  /**
   * 按年分组获取数量
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access None
   * @param type 类型
   */
  getCountByYear(type: string) {
    const mssqlYearCol = this.sequelize.fn(
      'LEFT',
      this.sequelize.fn(
        'CONVERT',
        this.sequelize.literal('varchar(12)'),
        this.col('createdAt', this.models.Templates),
        112,
      ),
      4,
    );
    return this.models.Templates.count({
      attributes: [
        [
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? mssqlYearCol
            : this.sequelize.fn('DATE_FORMAT', this.col('createdAt', this.models.Templates), '%Y'),
          'year',
        ],
      ],
      where: {
        type,
        status: {
          // 不包含所有的操作时的状态
          [Op.notIn]: TemplateOperateStatus,
        },
      },
      // TODO: 只支持 mssql 和 mysql
      group: this.sequelize.getDialect() === 'mssql' ? mssqlYearCol : 'year',
    });
  }

  /**
   * 根据状态分组获取模版数量
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access Authorized
   * @param type 类型
   * @param requestUserId 请求的用户ID
   */
  async getCountByStatus(type: string, requestUserId: number) {
    const andWhere: WhereOptions<Attributes<Templates>>[] = [];
    const where: WhereOptions<Attributes<Templates>> = {
      type,
      status: {
        // 不包含所有的操作时的状态
        [Op.notIn]: TemplateOperateStatus,
      },
      [Op.and]: andWhere,
    };

    // 如果没有编辑别人权限，则不返回非自己的内容
    const hasEditOthersCapability = await this.hasCapability(UserCapability.EditOthersTemplates, requestUserId)
      .then(() => true)
      .catch(() => false);

    if (!hasEditOthersCapability) {
      andWhere.push({
        author: requestUserId,
      });
    }

    // 如果没有编辑私有权限，则不返回非自己私有的内容
    const hasEditPrivateCapability = await this.hasCapability(UserCapability.EditPrivateTemplates, requestUserId)
      .then(() => true)
      .catch(() => false);

    if (!hasEditPrivateCapability) {
      andWhere.push({
        [Op.not]: {
          status: TemplateStatus.Private,
          author: {
            [Op.ne]: requestUserId,
          },
        },
      });
    }

    // 不返回非自己草稿、垃圾箱的内容
    andWhere.push({
      [Op.not]: {
        status: [TemplateStatus.Draft, TemplateStatus.Trash],
        author: {
          [Op.ne]: requestUserId,
        },
      },
    });

    return this.models.Templates.count({
      attributes: ['status'],
      where,
      group: 'status',
    });
  }

  /**
   * 查询分页模版列表
   * 匿名访问只返回 Publish 状态的结果
   * 没有状态条件时，结果不包含 Trash 状态的
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access Authorized?
   * @param param 分页查询参数
   * @param type 类型
   * @param fields 返回字段，空[]查询所有字段
   * @param requestUserId 请求的用户ID, 匿名用户只能查询 published 的内容
   */
  async getPaged(
    { offset = 0, limit = 20, ...query }: PagedTemplateArgs,
    type: string,
    fields: string[],
    requestUserId?: number,
  ): Promise<PagedTemplateModel> {
    // 主键(meta 查询)
    if (!fields?.includes('id')) {
      fields.unshift('id');
    }

    const include: Includeable[] = [];
    const andWhere: WhereOptions<Attributes<Templates>>[] = [];
    const where: WhereOptions<Attributes<Templates>> = {
      type,
      status: {
        // 不包含所有的操作时的状态
        [Op.notIn]: TemplateOperateStatus,
      },
      [Op.and]: andWhere,
    };
    const { keywordField = 'title', keyword, author, status, date, taxonomies = [] } = query;

    if (keyword) {
      andWhere.push({
        [keywordField]: {
          [Op.like]: `%${keyword}%`,
        },
      });
    }

    if (author) {
      andWhere.push({
        author,
      });
    }

    if (date) {
      andWhere.push(
        this.sequelize.where(
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? this.sequelize.fn(
                'LEFT',
                this.sequelize.fn(
                  'CONVERT',
                  this.sequelize.literal('varchar(12)'),
                  this.col('createdAt', this.models.Templates),
                  112,
                ),
                date.length,
              )
            : this.sequelize.fn(
                'DATE_FORMAT',
                this.col('createdAt', this.models.Templates),
                date.length === 4 ? '%Y' : date.length === 6 ? '%Y%m' : '%Y%m%d',
              ),
          date,
        ),
      );
    }

    // 匿名用户只返回 published 的模版
    if (!requestUserId) {
      andWhere.push({
        status: TemplateStatus.Publish,
      });
    } else {
      // 如果没有编辑别人权限，则不返回非自己的内容
      const hasEditOthersCapability = await this.hasCapability(UserCapability.EditOthersTemplates, requestUserId)
        .then(() => true)
        .catch(() => false);

      if (!hasEditOthersCapability) {
        andWhere.push({
          author: requestUserId,
        });
      }

      // 如果没有编辑私有权限，则不返回非自己私有的内容
      const hasEditPrivateCapability = await this.hasCapability(UserCapability.EditPrivateTemplates, requestUserId)
        .then(() => true)
        .catch(() => false);

      if (!hasEditPrivateCapability) {
        andWhere.push({
          [Op.not]: {
            status: TemplateStatus.Private,
            author: {
              [Op.ne]: requestUserId,
            },
          },
        });
      }

      // 不返回非自己草稿、垃圾箱的内容
      andWhere.push({
        [Op.not]: {
          status: [TemplateStatus.Draft, TemplateStatus.Trash],
          author: {
            [Op.ne]: requestUserId,
          },
        },
      });

      if (status) {
        andWhere.push({
          status,
        });
      }
    }

    for (const { id: taxonomyId, name: taxonomyName, type: taxonomyType } of taxonomies as Array<{
      id?: number;
      name?: string;
      type: string;
    }>) {
      if (taxonomyId) {
        include.push({
          model: this.models.TermRelationships,
          as: 'TermRelationships',
          attributes: [],
          include: [
            {
              model: this.models.TermTaxonomy,
              as: 'TermTaxonomy',
              attributes: [],
              duplicating: false,
            },
          ],
          duplicating: false,
        });
        // 特殊处理：如果是默认分类的情况下，查询是默认分类或没有分类的所有项
        if (
          taxonomyType === TermPresetTaxonomy.Category &&
          (await this.getOption(OptionPresetKeys.DefaultCategory)) === String(taxonomyId)
        ) {
          andWhere.push({
            [`$TermRelationships.TermTaxonomy.${this.field('id', this.models.TermTaxonomy)}$`]: {
              [Op.or]: [taxonomyId, { [Op.is]: null }],
            },
          });
        } else {
          andWhere.push({
            [`$TermRelationships.TermTaxonomy.${this.field('id', this.models.TermTaxonomy)}$`]: taxonomyId,
            [`$TermRelationships.TermTaxonomy.${this.field('taxonomy', this.models.TermTaxonomy)}$`]: taxonomyType,
          });
        }
      } else if (taxonomyName) {
        include.push({
          model: this.models.TermRelationships,
          as: 'TermRelationships',
          attributes: [],
          include: [
            {
              model: this.models.TermTaxonomy,
              as: 'TermTaxonomy',
              attributes: [],
            },
          ],
          duplicating: false,
        });

        andWhere.push({
          [`$TermRelationships.TermTaxonomy.${this.field('name', this.models.TermTaxonomy)}$`]: taxonomyName,
          [`$TermRelationships.TermTaxonomy.${this.field('taxonomy', this.models.TermTaxonomy)}$`]: taxonomyType,
        });
      }
    }

    return this.models.Templates.findAndCountAll({
      attributes: this.filterFields(fields, this.models.Templates),
      include,
      where,
      offset,
      limit,
      order: [
        // 根据 keyword 匹配程度排序
        !!keyword && [
          this.sequelize.literal(`CASE WHEN ${keywordField} = '${keyword}' THEN 0
        WHEN ${keywordField} LIKE '${keyword}%' THEN 1
        WHEN ${keywordField} LIKE '%${keyword}%' THEN 2
        WHEN ${keywordField} LIKE '%${keyword}' THEN 3
        ELSE 4 END`),
          'ASC',
        ],
        ['order', 'ASC'],
        ['createdAt', 'DESC'],
      ].filter(Boolean) as Order,
    }).then(({ rows, count: total }) => ({
      rows: rows.map((row) => row.toJSON()),
      total,
    }));
  }

  /**
   * 获取修改历史记录数量
   * @author Hubert
   * @since 20203-09-14
   * @param id Template id
   */
  getRevisionCount(id: number) {
    return this.models.Templates.count({
      where: {
        type: TemplateInnerType.Revision,
        parentId: id,
      },
    });
  }

  /**
   * 获取修改历史记录列表
   * @author Hubert
   * @since 20203-09-14
   * @param id Template id
   * @param fields 返回字段
   * @param requestUserId 请求的用户ID
   */
  async getRevisions(id: number, fields: string[], requestUserId: number) {
    const template = await this.models.Templates.findByPk(id, {
      attributes: ['id', 'type', 'status', 'author'],
    });
    if (!template) return [];

    // 需要有编辑权限才可以查看
    await this.hasEditCapability(template, requestUserId);

    return this.models.Templates.findAll({
      attributes: this.filterFields(fields, this.models.Templates),
      where: {
        type: TemplateInnerType.Revision,
        parentId: id,
      },
    }).then((templates) => templates.map((template) => template.toJSON<TemplateModel>()));
  }

  /**
   * 创建表单模版
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param model 添加实体模型
   * @param type 类型
   * @param requestUserId 请求的用户ID
   */
  async create(
    model: NewFormTemplateInput,
    type: TemplatePresetType.Form,
    requestUserId: number,
  ): Promise<TemplateModel>;
  /**
   * 创建页面模版
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param model 添加实体模型
   * @param type 类型
   * @param requestUserId 请求的用户ID
   */
  async create(
    model: NewPageTemplateInput,
    type: TemplatePresetType.Page,
    requestUserId: number,
  ): Promise<TemplateModel>;
  /**
   * 创建文章模版
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param model 添加实体模型
   * @param type 类型
   * @param requestUserId 请求的用户ID
   */
  async create(
    model: NewPostTemplateInput,
    type: TemplatePresetType.Post,
    requestUserId: number,
  ): Promise<TemplateModel>;
  /**
   * 创建其它模版
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param model 添加实体模型
   * @param type 类型
   * @param requestUserId 请求的用户ID
   */
  async create(model: NewTemplateInput, type: string, requestUserId: number): Promise<TemplateModel>;
  async create(
    model: NewFormTemplateInput | NewPageTemplateInput | NewPostTemplateInput | NewTemplateInput,
    type: string,
    requestUserId: number,
  ): Promise<TemplateModel> {
    // 不可以是操作状态
    if (model.status) {
      await this.checkOperateStatus(model.status);
    }

    // 具有编辑权限才可以新建
    await this.hasCapability(UserCapability.EditTemplates, requestUserId);

    if (model.status === TemplateStatus.Publish || model.status === TemplateStatus.Future) {
      // 具有发布权限才可以直接创建发布状态的内容
      await this.hasCapability(UserCapability.PublishTemplates, requestUserId);
    } else if (model.status === TemplateStatus.Trash) {
      // Trash 状态不允许直接创建
      throw new ForbiddenError(
        this.translate(
          'infrastructure-server.datasource.template.trash_status_forbidden_in_creation',
          'Do not create "trash" content!',
        ),
      );
    }

    const { status = TemplateInnerStatus.AutoDraft, content, commentStatus, metas, ...restModel } = model;

    const name = await this.fixName(model.name || model.title || '', type); // name 需要取唯一
    const title =
      model.title ?? status === TemplateInnerStatus.AutoDraft
        ? this.translate('infrastructure-server.datasource.template.status.auto_draft', 'Auto Draft')
        : '';
    const excerpt = (restModel as any).excerpt || ''; // post

    const t = await this.sequelize.transaction();
    try {
      const template = await this.models.Templates.create(
        {
          name,
          title,
          content: content ?? '',
          author: requestUserId,
          type,
          excerpt,
          status,
          commentStatus,
        },
        { transaction: t },
      );

      metas?.length &&
        (await this.models.TemplateMeta.bulkCreate(
          metas.map((meta) => {
            return {
              ...meta,
              templateId: template.id,
            };
          }),
          { transaction: t },
        ));

      t.commit();
      return template.toJSON<TemplateModel>();
    } catch (err) {
      t.rollback();
      throw err;
    }
  }

  /**
   * 修改模版，Trash 状态下不可修改(抛出 ForbiddenError)
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param id Template id/副本 template id
   * @param model 修改实体模型
   * @param requestUserId 请求的用户ID
   */
  async update(
    id: number,
    model: UpdateFormTemplateInput | UpdatePageTemplateInput | UpdatePostTemplateInput | UpdateTemplateInput,
    requestUserId: number,
  ): Promise<void> {
    // 不可以是操作状态
    if (model.status) {
      await this.checkOperateStatus(model.status);

      // 具有发布权限才可以发布内容
      if (model.status === TemplateStatus.Publish || model.status === TemplateStatus.Future) {
        await this.hasCapability(UserCapability.PublishTemplates, requestUserId);
      }
    }

    const template = await this.models.Templates.findByPk(id);
    if (template) {
      // 如果状态为 Trash, 不被允许修改，先使用 restore 统一处理状态逻辑
      // 需要恢复到移入Trash前的状态，并删除记录等逻辑
      if (template.status === TemplateStatus.Trash) {
        throw new ForbiddenError(
          this.translate(
            'infrastructure-server.datasource.template.update_forbidden_in_trash_status',
            `Do not update content that status is in "trash"!`,
          ),
        );
      }

      // 是否有编辑权限
      await this.hasEditCapability(template, requestUserId);

      // 修改到 Trash 状态同删除权限一致
      if (model.status === TemplateStatus.Trash) {
        await this.hasDeleteCapability(template, requestUserId);
      }

      const t = await this.sequelize.transaction();
      try {
        // 移到 Trash 之前记录状态
        if (model.status === TemplateStatus.Trash) {
          await this.storeTrashStatus(id, template.status, t);
        }

        const { title, content, status, commentStatus, ...restModel } = model;
        let name, modelName;
        // name 需要取唯一
        if ((modelName = (restModel as any).name) !== void 0) {
          template.name !== modelName && (name = await this.fixName(modelName, template.type));
        }

        await this.models.Templates.update(
          {
            ...restModel,
            name,
            title,
            content,
            excerpt: (restModel as any).excerpt, // post
            status,
            commentStatus,
          },
          {
            where: { id },
            transaction: t,
          },
        );

        // 记录每一次的修改（undefined 是不会产生修改记录，需要区分 null 和 undefined）
        const changedTitle = model.title !== void 0 && model.title !== template.title ? model.title! : false;
        const changedContent = model.content !== void 0 && model.content !== template.content ? model.content! : false;
        const changedExcerpt =
          (model as UpdateTemplateInput).excerpt !== void 0 &&
          (model as UpdateTemplateInput).excerpt !== template.excerpt
            ? (model as UpdateTemplateInput).excerpt!
            : false;
        if (changedTitle || changedContent || changedExcerpt) {
          await this.models.Templates.create(
            {
              title: changedTitle || template.title,
              content: changedContent || template.content,
              excerpt: changedExcerpt || template.excerpt,
              author: requestUserId,
              name: `${id}-revision`,
              type: TemplateInnerType.Revision,
              status: TemplateInnerStatus.Inherit,
              parentId: id,
            },
            { transaction: t },
          );
        }

        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } else {
      throw new ValidationError(
        this.translate('infrastructure-server.datasource.template.template_does_not_exist', 'Template does not exist!'),
      );
    }
  }

  /**
   * 修改模版名字，trash 状态下不可以修改（抛出 ForbiddenError)
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param id Template id
   * @param name Template name
   * @param requestUserId 请求的用户ID
   */
  async updateName(id: number, name: string, requestUserId: number): Promise<void> {
    // name 不可修改为空
    if (!!name) {
      throw new ForbiddenError(
        this.translate('infrastructure-server.datasource.template.name_is_invalid', `Name is invalid!`),
      );
    }

    const template = await this.models.Templates.findByPk(id);
    if (template) {
      // 状态相同，忽略
      if (template.name === name) {
        return;
      }

      // 如果状态为 Trash, 不被允许修改，先使用 restore 统一处理状态逻辑
      // 需要恢复到移入Trash前的状态等逻辑
      if (template.status === TemplateStatus.Trash) {
        throw new ForbiddenError(
          this.translate(
            'infrastructure-server.datasource.template.update_forbidden_in_trash_status',
            `Do not update content that status is in "trash"!`,
          ),
        );
      }

      // 是否有编辑权限
      await this.hasEditCapability(template, requestUserId);

      template.name = await this.fixName(name, template.name);
      template.save();
    } else {
      throw new ValidationError(
        this.translate('infrastructure-server.datasource.template.template_does_not_exist', 'Template does not exist!'),
      );
    }
  }

  /**
   * 修改模版状态，trash 状态下不可以修改（抛出 ForbiddenError)
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param id Template id
   * @param status 状态
   * @param requestUserId 请求的用户ID
   */
  async updateStatus(id: number, status: TemplateStatus, requestUserId: number): Promise<void> {
    // 不可以是操作状态
    await this.checkOperateStatus(status);

    // 具有发布权限才可以发布内容
    if (status === TemplateStatus.Publish || status === TemplateStatus.Future) {
      await this.hasCapability(UserCapability.PublishTemplates, requestUserId);
    }

    const template = await this.models.Templates.findByPk(id);
    if (template) {
      // 状态相同，忽略
      if (template.status === status) {
        return;
      }

      // 如果状态为 Trash, 不被允许修改，先使用 restore 统一处理状态逻辑
      // 需要恢复到移入Trash前的状态等逻辑
      if (template.status === TemplateStatus.Trash) {
        throw new ForbiddenError(
          this.translate(
            'infrastructure-server.datasource.template.update_forbidden_in_trash_status',
            `Do not update content that status is in "trash"!`,
          ),
        );
      }

      // 是否有编辑权限
      await this.hasEditCapability(template, requestUserId);

      // 修改到 Trash 状态同删除权限一致
      if (status === TemplateStatus.Trash) {
        await this.hasDeleteCapability(template, requestUserId);
      }

      const t = await this.sequelize.transaction();
      try {
        // 移到 Trash 之前记录状态
        if (status === TemplateStatus.Trash) {
          await this.storeTrashStatus(template.id, template.status, t);
        }
        template.status = status;
        await template.save({
          transaction: t,
        });
        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } else {
      throw new ValidationError(
        this.translate('infrastructure-server.datasource.template.template_does_not_exist', 'Template does not exist!'),
      );
    }
  }

  /**
   * 批量修改模版状态
   * 任意一条是 trash 状态下不可以修改（抛出 ForbiddenError）
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param ids Template ids
   * @param status 状态
   * @param requestUserId 请求的用户ID
   */
  async bulkUpdateStatus(ids: number[], status: TemplateStatus, requestUserId: number): Promise<void> {
    // 不可以是操作状态
    await this.checkOperateStatus(status);

    // 具有发布权限才可以发布内容
    if (status === TemplateStatus.Publish || status === TemplateStatus.Future) {
      await this.hasCapability(UserCapability.PublishTemplates, requestUserId);
    }

    const templates = await this.models.Templates.findAll({
      where: {
        id: ids,
      },
    });

    // trash 状态下不可以修改，使用 restore 重置
    const trushedIds = templates
      .filter((template) => template.status === TemplateStatus.Trash)
      .map((template) => template.id);
    if (trushedIds.length > 0) {
      const ids = trushedIds.join(',');
      throw new ForbiddenError(
        this.translate(
          'infrastructure-server.datasource.template.bulk_update_forbidden_in_trash_status',
          `Do not update content that status is in "trash", Id(s}: "${ids}"!`,
          { ids },
        ),
      );
    }

    // 权限判断
    await Promise.all(
      templates.map(async (template) => {
        // 是否有编辑权限
        await this.hasEditCapability(template, requestUserId);

        // 修改到 Trash 状态同删除权限一致
        if (status === TemplateStatus.Trash) {
          await this.hasDeleteCapability(template, requestUserId);
        }
      }),
    );

    const t = await this.sequelize.transaction();
    try {
      // 移到 Trash 之前记录状态
      if (status === TemplateStatus.Trash) {
        await this.bulkStoreTrashStatus(templates, t);
      }

      await this.models.Templates.update(
        {
          status,
        },
        {
          where: {
            id: ids,
          },
          transaction: t,
        },
      );

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 更新评论数据
   * @author Hubert
   * @since 2022-05-01
   * @param id Template id
   * @param count Comment count
   * @returns
   */
  async updateCommentCount(id: number, count: number): Promise<void> {
    await this.models.Templates.update(
      {
        commentCount: count,
      },
      {
        where: {
          id,
        },
      },
    );
  }

  /**
   * 重置Trash到之前状态
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @param id Template id
   * @param requestUserId 请求的用户ID
   */
  async restore(id: number, requestUserId: number): Promise<void> {
    const metaStatus = await this.models.TemplateMeta.findOne({
      attributes: ['id', 'metaValue'],
      where: {
        templateId: id,
        metaKey: TemplateMetaPresetKeys.TrashStatus,
      },
    });

    const template = await this.models.Templates.findByPk(id);
    if (template) {
      if (template.status !== TemplateStatus.Trash) {
        throw new ForbiddenError(
          this.translate(
            'infrastructure-server.datasource.template.restore_forbidden_not_in_trash_status',
            `Do not restore content that status is not in "trash"!`,
          ),
        );
      } else if (template.author !== requestUserId) {
        throw new ForbiddenError(
          this.translate(
            'infrastructure-server.datasource.template.restore_forbidden_not_author',
            `Do not restore content that is not yours!`,
          ),
        );
      }

      template.status = (metaStatus?.metaValue as TemplateStatus) ?? TemplateStatus.Draft; // 默认恢复为为 draft
      const t = await this.sequelize.transaction();
      try {
        await template.save({
          transaction: t,
        });
        await metaStatus?.destroy({
          transaction: t,
        });
        await t.commit();
      } catch (err) {
        t.rollback();
        throw err;
      }
    } else {
      throw new ValidationError(
        this.translate('infrastructure-server.datasource.template.template_does_not_exist', 'Template does not exist!'),
      );
    }
  }

  /**
   * 批量重置Trash到之前状态
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [
   *  EditPosts/EditPages,
   *  EditOthersPosts/EditOthersPages,
   *  EditPublishedPosts/EditPublishedPages,
   *  EditPrivatePosts/EditPrivatePages
   * ]
   * @param ids Template ids
   * @param requestUserId 请求的用户ID
   */
  async bulkRestore(ids: number[], requestUserId: number): Promise<void> {
    const templates = await this.models.Templates.findAll({
      where: {
        id: ids,
      },
    }).then((templates) =>
      // 如果状态为非 Trash 不修改
      templates.filter((template) => template.status !== TemplateStatus.Trash),
    );

    // 权限判断
    await Promise.all(
      templates.map(async (template) => {
        if (template.status !== TemplateStatus.Trash) {
          throw new ForbiddenError(
            this.translate(
              'infrastructure-server.datasource.template.restore_forbidden_not_in_trash_status',
              `Do not restore content that status is not in "trash"!`,
            ),
          );
        } else if (template.author !== requestUserId) {
          throw new ForbiddenError(
            this.translate(
              'infrastructure-server.datasource.template.restore_forbidden_not_author',
              `Do not restore content that is not yours!`,
            ),
          );
        }
      }),
    );

    const metas = await this.models.TemplateMeta.findAll({
      attributes: ['id', 'templateId', 'metaValue'],
      where: {
        templateId: templates.map((template) => template.id),
        metaKey: TemplateMetaPresetKeys.TrashStatus,
      },
    });

    const t = await this.sequelize.transaction();
    try {
      await Promise.all(
        templates.map((template) =>
          this.models.Templates.update(
            {
              status:
                (metas.find((meta) => meta.templateId === template.id)?.metaValue as TemplateStatus) ??
                TemplateStatus.Draft, // 默认恢复为为 draft
            },
            {
              where: { id: template.id },
              transaction: t,
            },
          ),
        ),
      );

      await this.models.TemplateMeta.destroy({
        where: {
          id: metas.map((meta) => meta.id),
        },
        transaction: t,
      });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 根据 id 删除模版，非 Trash 状态下不可以删除（抛出 ForbiddenError）
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access capabilities: [
   *  DeletePosts/DeletePages,
   *  DeleteOthersPosts/DeleteOthersPages,
   *  DeletePublishedPosts/DeletePublishedPages,
   *  DeletePrivatePosts/DeletePrivatePages
   * ]
   * @param id Template id
   * @param requestUserId 请求的用户ID
   */
  async delete(id: number, requestUserId: number): Promise<void> {
    const template = await this.models.Templates.findByPk(id);
    if (template) {
      // 非 trash 状态下不可以删除
      if (template.status !== TemplateStatus.Trash) {
        throw new ForbiddenError(
          this.translate(
            'infrastructure-server.datasource.template.delete_forbidden_not_in_trash_status',
            `Do not delete content that status is not in "trash"!`,
          ),
        );
      }

      // 是否有删除模版的权限
      await this.hasDeleteCapability(template, requestUserId);

      const t = await this.sequelize.transaction();
      try {
        // 删除相关信息
        await this.models.TermRelationships.destroy({
          where: {
            objectId: template.id,
          },
          transaction: t,
        });

        // TODO: TermTaxonomy count calc

        await template.destroy({ transaction: t });

        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } else {
      throw new ValidationError(
        this.translate('infrastructure-server.datasource.template.template_does_not_exist', 'Template does not exist!'),
      );
    }
  }

  /**
   * 批量永久删除模版，任意一条是非 trash 状态下不可以删除（抛出 ForbiddenError）
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access capabilities: [
   *  DeletePosts/DeletePages,
   *  DeleteOthersPosts/DeleteOthersPages,
   *  DeletePublishedPosts/DeletePublishedPages,
   *  DeletePrivatePosts/DeletePrivatePages
   * ]
   * @param ids Template ids
   * @param requestUserId 请求的用户ID
   */
  async bulkDelete(ids: number[], requestUserId: number): Promise<void> {
    const templates = await this.models.Templates.findAll({
      where: {
        id: ids,
      },
    });

    // 如果状态为非 Trash, 不被允许删除
    const notWithTrushedIds = templates
      .filter((template) => template.status !== TemplateStatus.Trash)
      .map((template) => template.id);
    if (notWithTrushedIds.length > 0) {
      const ids = notWithTrushedIds.join(',');
      throw new ForbiddenError(
        this.translate(
          'infrastructure-server.datasource.template.bulk_delete_forbidden_not_in_trash_status',
          `Do not delete content that status is not in "trash", Id(s}: "${ids}"!`,
          { ids },
        ),
      );
    }

    // 判断权限
    await Promise.all(
      templates.map(async (template) => {
        // 是否有删除表单的权限
        await this.hasDeleteCapability(template, requestUserId);
      }),
    );

    const t = await this.sequelize.transaction();

    try {
      // 删除相关信息
      await this.models.TermRelationships.destroy({
        where: {
          objectId: ids,
        },
        transaction: t,
      });

      // TODO: TermTaxonomy count calc

      await this.models.Templates.destroy({
        where: {
          id: ids,
        },
        transaction: t,
      });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
