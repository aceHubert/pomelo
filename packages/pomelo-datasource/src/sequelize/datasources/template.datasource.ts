import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { WhereOptions, Includeable, Transaction, Op, Order } from 'sequelize';
import { UserInputError, ValidationError, ForbiddenError, RequestUser } from '@pomelo/shared';
import { Taxonomy, TemplateType, TemplateStatus, TemplateOperateStatus, TemplateAttributes } from '../../entities';
import { UserCapability } from '../utils/user-capability.util';
import { OptionPresetKeys, TemplateMetaPresetKeys } from '../utils/preset-keys.util';
import {
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

@Injectable()
export class TemplateDataSource extends MetaDataSource<TemplateMetaModel, NewTemplateMetaInput> {
  constructor(protected readonly moduleRef: ModuleRef) {
    super(moduleRef);
  }

  /**
   * 修正唯一名称，在末尾添加数字
   * @param name 唯一名称，用于URL地址
   */
  private async fixName(name: string, type: string) {
    name = escape(name).trim();
    if (!name) return '';

    const count = await this.models.Template.count({
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
   * @param requestUser 登录用户
   */
  private async hasEditCapability(
    template: Pick<TemplateAttributes, 'type' | 'status' | 'author'>,
    requestUser: RequestUser,
  ) {
    // 是否有编辑权限
    await this.hasCapability(
      template.type === TemplateType.Post
        ? UserCapability.EditPosts
        : template.type === TemplateType.Page
        ? UserCapability.EditPages
        : template.type === TemplateType.Form
        ? UserCapability.EditForms
        : UserCapability.EditTemplates,
      requestUser,
      true,
    );

    // 是否有编辑已发布的文章的权限
    if (template.status === TemplateStatus.Publish) {
      await this.hasCapability(
        template.type === TemplateType.Post
          ? UserCapability.EditPublishedPosts
          : template.type === TemplateType.Page
          ? UserCapability.EditPublishedPages
          : template.type === TemplateType.Form
          ? UserCapability.EditPublishedForms
          : UserCapability.EditPublishedTemplates,
        requestUser,
        true,
      );
    }

    // 是否有编辑别人文章的权限
    if (template.author !== requestUser.sub) {
      await this.hasCapability(
        template.type === TemplateType.Post
          ? UserCapability.EditOthersPosts
          : template.type === TemplateType.Page
          ? UserCapability.EditOthersPages
          : template.type === TemplateType.Form
          ? UserCapability.EditOthersForms
          : UserCapability.EditOthersTemplates,
        requestUser,
      );

      // 是否有编辑私有的(别人)文章权限
      if (template.status === TemplateStatus.Private) {
        await this.hasCapability(
          template.type === TemplateType.Post
            ? UserCapability.EditPrivatePosts
            : template.type === TemplateType.Page
            ? UserCapability.EditPrivatePages
            : template.type === TemplateType.Form
            ? UserCapability.EditPrivateForms
            : UserCapability.EditPrivateTemplates,
          requestUser,
        );
      }
    }
    return Promise.resolve(true);
  }

  /**
   * 是否有删除权限，没有则会直接抛出异常
   * @param template Tempate
   * @param requestUser 登录用户
   */
  private async hasDeleteCapability(
    template: Pick<TemplateAttributes, 'type' | 'status' | 'author'>,
    requestUser: RequestUser,
  ) {
    // 是否有删除文章的权限
    await this.hasCapability(
      template.type === TemplateType.Post
        ? UserCapability.DeletePosts
        : template.type === TemplateType.Page
        ? UserCapability.DeletePages
        : template.type === TemplateType.Form
        ? UserCapability.DeleteForms
        : UserCapability.DeleteTemplates,
      requestUser,
      true,
    );

    // 是否有删除已发布的文章的权限
    if (template.status === TemplateStatus.Publish) {
      await this.hasCapability(
        template.type === TemplateType.Post
          ? UserCapability.DeletePublishedPosts
          : template.type === TemplateType.Page
          ? UserCapability.DeletePublishedPages
          : template.type === TemplateType.Form
          ? UserCapability.DeletePublishedForms
          : UserCapability.DeletePublishedTemplates,
        requestUser,
        true,
      );
    }

    // 是否有删除别人文章的权限
    if (template.author !== requestUser.sub) {
      await this.hasCapability(
        template.type === TemplateType.Post
          ? UserCapability.DeleteOthersPosts
          : template.type === TemplateType.Page
          ? UserCapability.DeleteOthersPages
          : template.type === TemplateType.Form
          ? UserCapability.DeleteOthersForms
          : UserCapability.DeleteOthersTemplates,
        requestUser,
        true,
      );

      // 是否有删除私有的文章权限
      if (template.status === TemplateStatus.Private) {
        await this.hasCapability(
          template.type === TemplateType.Post
            ? UserCapability.DeletePrivatePosts
            : template.type === TemplateType.Page
            ? UserCapability.DeletePrivatePages
            : template.type === TemplateType.Form
            ? UserCapability.DeletePrivateForms
            : UserCapability.DeletePrivateTemplates,
          requestUser,
          true,
        );
      }
    }
    return Promise.resolve(true);
  }

  private async checkOperateStatus(status: TemplateStatus, requestUser: RequestUser) {
    if (TemplateOperateStatus.includes(status)) {
      if (status === TemplateStatus.AutoDraft) {
        throw new UserInputError(
          await this.translate(
            'template.datasource.operate_status_autodraft_is_not_allowed',
            `Status "AutoDraft" is not allowed!`,
            {
              lang: requestUser.lang,
            },
          ),
        );
      }
      throw new UserInputError(
        await this.translate(
          'template.datasource.operate_status_is_not_allowed',
          `Status "${status}" is not allowed!`,
          {
            args: {
              status,
            },
            lang: requestUser.lang,
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
  private async storeTrashStatus(templateId: number, prevStatus: TemplateStatus, t?: Transaction) {
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
  private async bulkStoreTrashStatus(templatesOrtemplateIds: TemplateAttributes[] | number[], t?: Transaction) {
    const templates = templatesOrtemplateIds.some((templateOrId) => typeof templateOrId === 'number')
      ? await this.models.Template.findAll({
          attributes: ['id', 'status'],
          where: {
            id: templatesOrtemplateIds as number[],
          },
        })
      : (templatesOrtemplateIds as TemplateAttributes[]);

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
   * @param type 类型
   * @param fields 返回字段
   * @param requestUser 请求的用户
   */
  async get(
    id: number,
    type: string | undefined,
    fields: string[],
    requestUser?: RequestUser,
  ): Promise<TemplateModel | undefined> {
    if (!fields.includes('id')) {
      // 主键(meta 查询)
      fields.push('id');
    }

    const where: WhereOptions<TemplateAttributes> = {
      id,
    };

    if (type !== void 0) {
      where.type = type;
    }

    // 匿名用户只能查询 published 的内容
    if (!requestUser) {
      where['status'] = TemplateStatus.Publish;
      return this.models.Template.findOne({
        attributes: this.filterFields(
          fields.filter((field) => !['status', 'author'].includes(field)), // 匿名用户排除状态和作者
          this.models.Template,
        ),
        where,
      }).then((template) => template?.toJSON<TemplateModel>());
    } else {
      const template = await this.models.Template.findOne({
        attributes: this.filterFields(fields, this.models.Template),
        where,
      });
      if (template) {
        // 是否有编辑权限
        await this.hasEditCapability(template, requestUser);

        return template.toJSON<TemplateModel>();
      }
      return;
    }
  }

  /**
   * 根据name获取模版
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @access Authorized?
   * @param name Template name
   * @param type 类型
   * @param fields 返回字段
   * @param requestUser 请求的用户
   */
  async getByName(
    name: string,
    type: string | undefined,
    fields: string[],
    requestUser?: RequestUser,
  ): Promise<TemplateModel | undefined> {
    if (!fields.includes('id')) {
      // 主键(meta 查询)
      fields.push('id');
    }

    const where: WhereOptions<TemplateAttributes> = {
      name,
    };

    if (type !== void 0) {
      where.type = type;
    }

    // 匿名用户只能查询 published 的内容
    if (!requestUser) {
      where['status'] = TemplateStatus.Publish;
      return this.models.Template.findOne({
        attributes: this.filterFields(fields, this.models.Template),
        where,
      }).then((template) => template?.toJSON<TemplateModel>());
    } else {
      const template = await this.models.Template.findOne({
        attributes: this.filterFields(fields, this.models.Template),
        where,
      });
      if (template) {
        // 如果是已发布的状态，可以直接返回
        if (template.status !== TemplateStatus.Publish) {
          // 是否有编辑权限
          await this.hasEditCapability(template, requestUser);
        }

        return template.toJSON<TemplateModel>();
      }
      return;
    }
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
    const include: Includeable[] = [];
    const andWhere: WhereOptions<TemplateAttributes>[] = [];
    const where: WhereOptions<TemplateAttributes> = {
      status: TemplateStatus.Publish,
      type,
      [Op.not]: {
        title: '',
      },
      [Op.and]: andWhere,
    };
    const { keywordField = 'title' } = query;
    if (query.keyword) {
      andWhere.push({
        [keywordField]: {
          [Op.like]: `%${query.keyword}%`,
        },
      });
    }
    if (query.author) {
      andWhere.push({
        author: query.author,
      });
    }

    if (query.date) {
      andWhere.push(
        this.sequelize.where(
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? this.sequelize.fn(
                'LEFT',
                this.sequelize.fn(
                  'CONVERT',
                  this.sequelize.literal('varchar(12)'),
                  this.col('createdAt', this.models.Template),
                  112,
                ),
                query.date.length,
              )
            : this.sequelize.fn(
                'DATE_FORMAT',
                this.col('createdAt', this.models.Template),
                query.date.length === 4 ? '%Y' : query.date.length === 6 ? '%Y%m' : '%Y%m%d',
              ),
          query.date,
        ),
      );
    }

    const { taxonomies = [] } = query;
    for (const { taxonomyId, taxonomyName, taxonomyType } of taxonomies) {
      if ((taxonomyId || taxonomyName) && !taxonomyType) {
        throw new ValidationError(
          await this.translate('template.datasource.taxonomy_type_is_required', 'Taxonomy type is required!'),
        );
      }

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
          taxonomyType === Taxonomy.Category &&
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

    return this.models.Template.findAll({
      attributes: this.filterFields(fields, this.models.Template),
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
    const templates = await this.models.Template.findAll({
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
   * 根据状态分组获取模版数量
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access Authorized
   * @param type 类型
   */
  async getCountByStatus(type: string, requestUser: RequestUser) {
    const andWhere: WhereOptions<TemplateAttributes>[] = [];
    const where: WhereOptions<TemplateAttributes> = {
      type,
      status: {
        // 不包含所有的操作时的状态
        [Op.notIn]: TemplateOperateStatus,
      },
      [Op.and]: andWhere,
    };

    // 如果没有编辑私有权限，则不返回非自己私有的内容
    const hasEditPrivateCapability = await this.hasCapability(
      type === TemplateType.Post
        ? UserCapability.EditPrivatePosts
        : type === TemplateType.Page
        ? UserCapability.EditPrivatePages
        : type === TemplateType.Form
        ? UserCapability.EditPrivateForms
        : UserCapability.EditPrivateTemplates,
      requestUser,
    );
    if (!hasEditPrivateCapability) {
      andWhere.push({
        [Op.not]: {
          status: TemplateStatus.Private,
          author: {
            [Op.ne]: requestUser.sub!,
          },
        },
      });
    }

    // 如果没有发布权限的，不返回待发布的内容
    const hasPublishCapability = await this.hasCapability(
      type === TemplateType.Post
        ? UserCapability.PublishPosts
        : type === TemplateType.Page
        ? UserCapability.PublishPages
        : type === TemplateType.Form
        ? UserCapability.PublishForms
        : UserCapability.PublishTemplates,
      requestUser,
    );
    if (!hasPublishCapability) {
      andWhere.push({
        [Op.not]: {
          status: TemplateStatus.Pending,
          author: {
            [Op.ne]: requestUser.sub!,
          },
        },
      });
    }

    return this.models.Template.count({
      attributes: ['status'],
      where,
      group: 'status',
    });
  }

  /**
   * 获取我的数量 (不包含草稿的)
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access Authorized
   * @param type 类型
   * @param includeTrashStatus 包含草稿状态
   * @param requestUser 请求的用户
   */
  getCountBySelf(type: string, includeTrashStatus: boolean, requestUser: RequestUser) {
    const notIn: Array<TemplateStatus> = [...TemplateOperateStatus];
    if (!includeTrashStatus) {
      notIn.push(TemplateStatus.Trash);
    }

    return this.models.Template.count({
      where: {
        type,
        status: {
          // 不包含所有的操作时的状态
          [Op.notIn]: notIn,
        },
        author: requestUser.sub,
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
        this.col('createdAt', this.models.Template),
        112,
      ),
      8,
    );
    return this.models.Template.count({
      attributes: [
        [
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? mssqlDayCol
            : this.sequelize.fn('DATE_FORMAT', this.col('createdAt', this.models.Template), '%Y%m%d'),
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
                  this.col('createdAt', this.models.Template),
                  112,
                ),
                6,
              )
            : this.sequelize.fn('DATE_FORMAT', this.col('createdAt', this.models.Template), '%Y%m'),
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
        this.col('createdAt', this.models.Template),
        112,
      ),
      6,
    );

    return this.models.Template.count({
      attributes: [
        [
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? mssqlMonthCol
            : this.sequelize.fn('DATE_FORMAT', this.col('createdAt', this.models.Template), '%Y%m'),
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
                      this.col('createdAt', this.models.Template),
                      112,
                    ),
                    4,
                  )
                : this.sequelize.fn('DATE_FORMAT', this.col('createdAt', this.models.Template), '%Y'),
              year,
            )
          : this.sequelize.where(
              // TODO: 只支持 mssql 和 mysql
              this.sequelize.getDialect() === 'mssql'
                ? this.sequelize.fn(
                    'DATEDIFF',
                    this.sequelize.literal('mm'),
                    this.col('createdAt', this.models.Template),
                    this.sequelize.literal('getdate()'),
                  )
                : this.sequelize.fn(
                    'TIMESTAMPDIFF',
                    this.sequelize.literal('MONTH'),
                    this.col('createdAt', this.models.Template),
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
        this.col('createdAt', this.models.Template),
        112,
      ),
      4,
    );
    return this.models.Template.count({
      attributes: [
        [
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? mssqlYearCol
            : this.sequelize.fn('DATE_FORMAT', this.col('createdAt', this.models.Template), '%Y'),
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
   * 获取修改历史记录数量
   * @author Hubert
   * @since 20203-09-14
   * @param id Template id
   */
  getRevisionCount(id: number) {
    return this.models.Template.count({
      where: {
        type: TemplateType.Revision,
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
   * @param requestUser 请求的用户
   */
  async getRevisions(id: number, fields: string[], requestUser: RequestUser) {
    const template = await this.models.Template.findByPk(id, {
      attributes: ['id', 'type', 'status', 'author'],
    });
    if (!template) return [];

    this.hasEditCapability(template, requestUser);
    return this.models.Template.findAll({
      attributes: this.filterFields(fields, this.models.Template),
      where: {
        type: TemplateType.Revision,
        parentId: id,
      },
    }).then((templates) => templates.map((template) => template.toJSON<TemplateModel>()));
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
   * @param requestUser 请求的用户
   */
  async getPaged(
    { offset = 0, limit = 20, ...query }: PagedTemplateArgs,
    type: string,
    fields: string[],
    requestUser?: RequestUser,
  ): Promise<PagedTemplateModel> {
    if (!fields?.includes('id')) {
      // 主键(meta 查询)
      fields.push('id');
    }

    const include: Includeable[] = [];
    const andWhere: WhereOptions<TemplateAttributes>[] = [];
    const where: WhereOptions<TemplateAttributes> = {
      type,
      [Op.and]: andWhere,
    };
    const { keywordField = 'title' } = query;
    if (query.keyword) {
      andWhere.push({
        [keywordField]: {
          [Op.like]: `%${query.keyword}%`,
        },
      });
    }
    if (query.author) {
      andWhere.push({
        author: query.author,
      });
    }

    if (query.date) {
      andWhere.push(
        this.sequelize.where(
          // TODO: 只支持 mssql 和 mysql
          this.sequelize.getDialect() === 'mssql'
            ? this.sequelize.fn(
                'LEFT',
                this.sequelize.fn(
                  'CONVERT',
                  this.sequelize.literal('varchar(12)'),
                  this.col('createdAt', this.models.Template),
                  112,
                ),
                query.date.length,
              )
            : this.sequelize.fn(
                'DATE_FORMAT',
                this.col('createdAt', this.models.Template),
                query.date.length === 4 ? '%Y' : query.date.length === 6 ? '%Y%m' : '%Y%m%d',
              ),
          query.date,
        ),
      );
    }

    // 匿名用户只返回 published 的模版
    if (!requestUser) {
      andWhere.push({
        status: TemplateStatus.Publish,
      });
    } else {
      if (query.status) {
        andWhere.push({
          status: query.status,
        });
      } else {
        // All 时排除 操作状态下的所有状态和 trash 状态
        // 及操作状态下的所有状态
        andWhere.push({
          status: {
            [Op.notIn]: [TemplateStatus.Trash, ...TemplateOperateStatus],
          },
        });
      }
    }

    const { taxonomies = [] } = query;
    for (const { taxonomyId, taxonomyName, taxonomyType } of taxonomies) {
      if ((taxonomyId || taxonomyName) && !taxonomyType) {
        throw new ValidationError(
          await this.translate('template.datasource.taxonomy_type_is_required', 'Taxonomy type is required!'),
        );
      }

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
          taxonomyType === Taxonomy.Category &&
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

    return this.models.Template.findAndCountAll({
      attributes: this.filterFields(fields, this.models.Template),
      include,
      where,
      offset,
      limit,
      order: [
        !!query.keyword && [
          this.sequelize.literal(`CASE WHEN ${keywordField} = '${query.keyword}' THEN 0
        WHEN ${keywordField} LIKE '${query.keyword}%' THEN 1
        WHEN ${keywordField} LIKE '%${query.keyword}%' THEN 2
        WHEN ${keywordField} LIKE '%${query.keyword}' THEN 3
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
   * 创建模版
   * name 没有的时间会通过 title 生成
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param model 添加实体模型
   * @param type 类型
   * @param requestUser 请求的用户
   */
  async create(model: NewFormTemplateInput, type: TemplateType.Form, requestUser: RequestUser): Promise<TemplateModel>;
  async create(model: NewPageTemplateInput, type: TemplateType.Page, requestUser: RequestUser): Promise<TemplateModel>;
  async create(model: NewPostTemplateInput, type: TemplateType.Post, requestUser: RequestUser): Promise<TemplateModel>;
  async create(model: NewTemplateInput, type: string, requestUser: RequestUser): Promise<TemplateModel>;
  async create(
    model: NewFormTemplateInput | NewPageTemplateInput | NewPostTemplateInput | NewTemplateInput,
    type: string,
    requestUser: RequestUser,
  ): Promise<TemplateModel> {
    // 不可以是操作状态
    if (model.status) {
      await this.checkOperateStatus(model.status, requestUser);
    }

    // 具有编辑权限才可以新建
    await this.hasCapability(
      type === TemplateType.Form
        ? UserCapability.EditPosts
        : type === TemplateType.Page
        ? UserCapability.EditPages
        : type === TemplateType.Form
        ? UserCapability.EditForms
        : UserCapability.EditTemplates,
      requestUser,
      true,
    );

    // 是否有发布的权限
    if (model.status === TemplateStatus.Publish) {
      await this.hasCapability(
        type === TemplateType.Post
          ? UserCapability.PublishPosts
          : type === TemplateType.Page
          ? UserCapability.PublishPages
          : type === TemplateType.Form
          ? UserCapability.PublishForms
          : UserCapability.PublishTemplates,
        requestUser,
        true,
      );
    }

    const { content, commentStatus, metas, ...restModel } = model;
    const status = model.status ?? TemplateStatus.AutoDraft; // 默认为 auto draft
    const name = await this.fixName(((restModel as any).name || model.title) ?? '', type); // name 需要取唯一
    const title =
      model.title ?? status === TemplateStatus.AutoDraft
        ? await this.translate('datasource.template.status.auto_draft', '自动草稿', {
            lang: requestUser.lang,
          })
        : '';
    const excerpt = (restModel as any).excerpt || ''; // post

    const t = await this.sequelize.transaction();
    try {
      const template = await this.models.Template.create(
        {
          name,
          title,
          content: content ?? '',
          author: requestUser.sub!,
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
   * 修改模版
   * trash 状态下不可修改(抛出 ForbiddenError)
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param id Template id/副本 template id
   * @param model 修改实体模型
   * @param requestUser 请求的用户
   */
  async update(
    id: number,
    model: UpdateFormTemplateInput | UpdatePageTemplateInput | UpdatePostTemplateInput | UpdateTemplateInput,
    requestUser: RequestUser,
  ): Promise<boolean> {
    // 不可以是操作状态
    if (model.status) {
      await this.checkOperateStatus(model.status, requestUser);
    }

    const template = await this.models.Template.findByPk(id);
    if (template) {
      // 如果状态为 Trash, 不被允许修改，先使用 restore 统一处理状态逻辑
      // 需要恢复到移入Trash前的状态，并删除记录等逻辑
      if (template.status === TemplateStatus.Trash) {
        throw new ForbiddenError(
          await this.translate(
            'datasource.template.update_trash_forbidden',
            `It is in "trush" status, use "restore" function first!`,
            { lang: requestUser.lang },
          ),
        );
      }

      // 是否有编辑权限
      await this.hasEditCapability(template, requestUser);

      // 是否有发布的权限
      if (model.status === TemplateStatus.Publish && template.status !== model.status) {
        await this.hasCapability(
          template.type === TemplateType.Post
            ? UserCapability.PublishPosts
            : template.type === TemplateType.Page
            ? UserCapability.PublishPages
            : template.type === TemplateType.Form
            ? UserCapability.PublishForms
            : UserCapability.PublishTemplates,
          requestUser,
          true,
        );
      }

      // 修改到 Trash 状态同删除权限一致
      if (model.status === TemplateStatus.Trash) {
        await this.hasDeleteCapability(template, requestUser);
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

        await this.models.Template.update(
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
          await this.models.Template.create(
            {
              title: changedTitle || template.title,
              content: changedContent || template.content,
              excerpt: changedExcerpt || template.excerpt,
              author: requestUser.sub!,
              name: `${id}-revision`,
              type: TemplateType.Revision,
              status: TemplateStatus.Inherit,
              parentId: id,
            },
            { transaction: t },
          );
        }

        await t.commit();
        return true;
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }
    return false;
  }

  /**
   * 修改模版name
   * 如果template id 不在在返回 false
   * name 不可为空（抛出 ForbiddenError）
   * trash 状态下不可以修改（抛出 ForbiddenError)
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param id Template id
   * @param name Template name
   */
  async updateName(id: number, name: string, requestUser: RequestUser): Promise<boolean> {
    // name 不可修改为空
    if (!!name) {
      throw new ForbiddenError(
        await this.translate('datasource.template.name_is_invalid', `Name is invalid!`, {
          lang: requestUser.lang,
        }),
      );
    }

    const template = await this.models.Template.findByPk(id);
    if (template) {
      // 状态相同，忽略
      if (template.name === name) {
        return true;
      }

      // 如果状态为 Trash, 不被允许修改，先使用 restore 统一处理状态逻辑
      // 需要恢复到移入Trash前的状态等逻辑
      if (template.status === TemplateStatus.Trash) {
        throw new ForbiddenError(
          await this.translate(
            'datasource.template.update_status_forbidden_in_trash_status',
            `Must be in "trush" status, use "restore" function first!`,
            { lang: requestUser.lang },
          ),
        );
      }

      // 是否有编辑权限
      await this.hasEditCapability(template, requestUser);

      template.name = await this.fixName(name, template.name);
      template.save();
      return true;
    }
    return false;
  }

  /**
   * 修改模版状态
   * 如果template id 不在在返回 false
   * trash 状态下不可以修改（抛出 ForbiddenError)
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param id Template id
   * @param status 状态
   */
  async updateStatus(id: number, status: TemplateStatus, requestUser: RequestUser): Promise<boolean> {
    // 不可以是操作状态
    await this.checkOperateStatus(status, requestUser);

    const template = await this.models.Template.findByPk(id);
    if (template) {
      // 状态相同，忽略
      if (template.status === status) {
        return true;
      }

      // 如果状态为 Trash, 不被允许修改，先使用 restore 统一处理状态逻辑
      // 需要恢复到移入Trash前的状态等逻辑
      if (template.status === TemplateStatus.Trash) {
        throw new ForbiddenError(
          await this.translate(
            'datasource.template.update_status_forbidden_in_trash_status',
            `Must be in "trush" status, use "restore" function first!`,
            { lang: requestUser.lang },
          ),
        );
      }

      // 是否有编辑权限
      await this.hasEditCapability(template, requestUser);

      // 是否有发布的权限
      // TODO: Private 逻辑实现
      // if (status === TemplateStatus.Publish || status === TemplateStatus.Private) {
      if (status === TemplateStatus.Publish) {
        await this.hasCapability(
          template.type === TemplateType.Post
            ? UserCapability.PublishPosts
            : template.type === TemplateType.Page
            ? UserCapability.PublishPages
            : template.type === TemplateType.Form
            ? UserCapability.PublishForms
            : UserCapability.PublishTemplates,
          requestUser,
          true,
        );
      }

      // 修改到 Trash 状态同删除权限一致
      if (status === TemplateStatus.Trash) {
        await this.hasDeleteCapability(template, requestUser);
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
        return true;
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }
    return false;
  }

  /**
   * 批量修改模版状态
   * 任意一条是 trash 状态下不可以修改（抛出 ForbiddenError）
   * @author Hubert
   * @since 2022-05-01
   * @version 0.0.1
   * @param ids Template ids
   * @param status 状态
   */
  async bulkUpdateStatus(ids: number[], status: TemplateStatus, requestUser: RequestUser): Promise<true> {
    // 不可以是操作状态
    await this.checkOperateStatus(status, requestUser);

    const templates = await this.models.Template.findAll({
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
        await this.translate(
          'datasource.template.bulk_update_status_forbidden_in_trash_status',
          `Id(s} "${ids}" must not be in "trush" status, use "restore" function first!`,
          {
            lang: requestUser.lang,
            args: { ids },
          },
        ),
      );
    }

    // 权限判断
    await Promise.all(
      templates.map(async (template) => {
        // 是否有编辑权限
        await this.hasEditCapability(template, requestUser);

        // 是否有发布的权限
        if (status === TemplateStatus.Publish) {
          await this.hasCapability(
            template.type === TemplateType.Post
              ? UserCapability.PublishPosts
              : template.type === TemplateType.Page
              ? UserCapability.PublishPages
              : template.type === TemplateType.Form
              ? UserCapability.PublishForms
              : UserCapability.PublishTemplates,
            requestUser,
            true,
          );
        }

        // 修改到 Trash 状态同删除权限一致
        if (status === TemplateStatus.Trash) {
          await this.hasDeleteCapability(template, requestUser);
        }
      }),
    );

    const t = await this.sequelize.transaction();
    try {
      // 移到 Trash 之前记录状态
      if (status === TemplateStatus.Trash) {
        await this.bulkStoreTrashStatus(templates, t);
      }

      await this.models.Template.update(
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
      return true;
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
  async updateCommentCount(id: number, count: number): Promise<boolean> {
    return this.models.Template.update(
      {
        commentCount: count,
      },
      {
        where: {
          id,
        },
      },
    ).then(([count]) => count > 0);
  }

  /**
   * 重置Trash到之前状态
   * 如果历史状态没有记录或 template id 不在在返回 false
   * 如果状态不在 Trash 状态下不可重置（返回 ForbiddenError）
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @param id Template id
   */
  async restore(id: number, requestUser: RequestUser): Promise<boolean> {
    const metaStatus = await this.models.TemplateMeta.findOne({
      attributes: ['metaValue'],
      where: {
        templateId: id,
        metaKey: TemplateMetaPresetKeys.TrashStatus,
      },
    });

    const template = await this.models.Template.findByPk(id);
    if (template) {
      // 如果状态为非 Trash, 不被允许重置
      if (template.status !== TemplateStatus.Trash) {
        throw new ForbiddenError(
          await this.translate(
            'datasource.template.restore_forbidden_not_in_trash_status',
            `Must be in "trush" status!`,
            { lang: requestUser.lang },
          ),
        );
      }

      // 是否有编辑权限
      await this.hasEditCapability(template, requestUser);

      template.status = (metaStatus?.metaValue as TemplateStatus) ?? TemplateStatus.Draft; // 默认恢复为为 draft
      await template.save();
      return true;
    }
    return false;
  }

  /**
   * 批量重置Trash到之前状态
   * 任意一条是非 trash 状态下不可以重置（返回 ForbiddenError）
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
   */
  async bulkRestore(ids: number[], requestUser: RequestUser): Promise<true> {
    const templates = await this.models.Template.findAll({
      where: {
        id: ids,
      },
    });

    // 如果状态为非 Trash, 不被允许重置
    const notWithTrushedIds = templates
      .filter((template) => template.status !== TemplateStatus.Trash)
      .map((template) => template.id);
    if (notWithTrushedIds.length > 0) {
      const ids = notWithTrushedIds.join(',');
      throw new ForbiddenError(
        await this.translate(
          'datasource.template.bulk_restore_forbidden_not_in_trash_status',
          `Id(s} "${ids}" must be in "trush" status!`,
          {
            lang: requestUser.lang,
            args: { ids },
          },
        ),
      );
    }

    // 权限判断
    await Promise.all(
      templates.map(async (template) => {
        // 是否有编辑权限
        await this.hasEditCapability(template, requestUser);
      }),
    );

    const metas = await this.models.TemplateMeta.findAll({
      attributes: ['templateId', 'metaValue'],
      where: {
        templateId: ids,
        metaKey: TemplateMetaPresetKeys.TrashStatus,
      },
    });

    const t = await this.sequelize.transaction();
    try {
      await Promise.all(
        templates.map((template) =>
          this.models.Template.update(
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

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 根据 id 删除模版
   * 如果template id 不在在返回 false, 否则永久删除操作
   * 非 trash 状态下不可以删除（抛出 ForbiddenError）
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
   */
  async delete(id: number, requestUser: RequestUser): Promise<boolean> {
    const template = await this.models.Template.findByPk(id);
    if (template) {
      // 非 trash 状态下不可以删除
      if (template.status !== TemplateStatus.Trash) {
        throw new ForbiddenError(
          await this.translate(
            'datasource.template.delete_forbidden_not_in_trash_status',
            `Must be in "trash" status!`,
            {
              lang: requestUser.lang,
            },
          ),
        );
      }

      // 是否有删除模版的权限
      await this.hasDeleteCapability(template, requestUser);

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
        return true;
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }
    return false;
  }

  /**
   * 批量删除模版
   * 永久删除操作
   * 任意一条是非 trash 状态下不可以删除（抛出 ForbiddenError）
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
   */
  async bulkDelete(ids: number[], requestUser: RequestUser): Promise<true> {
    const templates = await this.models.Template.findAll({
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
        await this.translate(
          'datasource.template.bulk_delete_forbidden_not_in_trash_status',
          `Id(s} "${ids}" must be in "trash" status!`,
          {
            lang: requestUser.lang,
            args: { ids },
          },
        ),
      );
    }

    // 判断权限
    await Promise.all(
      templates.map(async (template) => {
        // 是否有删除表单的权限
        await this.hasDeleteCapability(template, requestUser);
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

      await this.models.Template.destroy({
        where: {
          id: ids,
        },
        transaction: t,
      });

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
