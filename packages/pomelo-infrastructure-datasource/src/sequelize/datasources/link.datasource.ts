import { Op } from 'sequelize';
import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { RequestUser } from '@ace-pomelo/shared-server';
import { UserCapability } from '../../utils/user-capability.util';
import { LinkModel, PagedLinkModel, PagedLinkArgs, NewLinkInput, UpdateLinkInput } from '../interfaces/link.interface';
import { BaseDataSource } from './base.datasource';

@Injectable()
export class LinkDataSource extends BaseDataSource {
  constructor(protected readonly moduleRef: ModuleRef) {
    super(moduleRef);
  }

  get(id: number, fields: string[]): Promise<LinkModel | undefined> {
    return this.models.Links.findByPk(id, {
      attributes: this.filterFields(fields, this.models.Links),
    }).then((link) => link?.toJSON<LinkModel>());
  }

  getPaged({ offset, limit, ...query }: PagedLinkArgs, fields: string[]): Promise<PagedLinkModel> {
    const { keyword, ...restQuery } = query;
    return this.models.Links.findAndCountAll({
      attributes: this.filterFields(fields, this.models.Links),
      where: {
        ...(keyword
          ? {
              name: {
                [Op.like]: `%${keyword}%`,
              },
            }
          : null),
        ...restQuery,
      },
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    }).then(({ rows, count: total }) => ({
      rows: rows as unknown as PagedLinkModel['rows'],
      total,
    }));
  }

  /**
   * 添加链接
   * @param model 添加实体模型
   */
  async create(model: NewLinkInput, requestUser: RequestUser): Promise<LinkModel> {
    const link = await this.models.Links.create({
      ...model,
      userId: Number(requestUser.sub),
    });
    return link.toJSON<LinkModel>();
  }

  /**
   * 修改链接
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [ManageLinks (if not yours)]
   * @param id Link Id
   * @param model 修改实体模型
   */
  async update(id: number, model: UpdateLinkInput, requestUser: RequestUser): Promise<boolean> {
    const link = await this.models.Links.findByPk(id, {
      attributes: ['userId'],
    });
    if (link) {
      // 非本人创建的是否可编辑
      if (link.userId !== Number(requestUser.sub)) {
        await this.hasCapability(UserCapability.ManageLinks, requestUser, true);
      }

      await this.models.Links.update(model, {
        where: { id },
      });
      return true;
    }
    return false;
  }

  /**
   * 根据 Id 删除
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [ManageLinks (if not yours)]
   * @param id Link Id
   */
  async delete(id: number, requestUser: RequestUser): Promise<boolean> {
    const link = await this.models.Links.findByPk(id);
    if (link) {
      // 非本人创建的是否可删除
      if (link.userId !== Number(requestUser.sub)) {
        await this.hasCapability(UserCapability.ManageLinks, requestUser, true);
      }

      await link.destroy();
      return true;
    }
    return false;
  }
}
