import { Op } from 'sequelize';
import { Injectable } from '@nestjs/common';
import { ValidationError, UserCapability } from '@ace-pomelo/shared/server';
import { InfrastructureDatasourceService } from '../../datasource.service';
import { Links } from '../entities';
import { LinkModel, PagedLinkModel, PagedLinkArgs, NewLinkInput, UpdateLinkInput } from '../interfaces/link.interface';
import { BaseDataSource } from './base.datasource';

@Injectable()
export class LinkDataSource extends BaseDataSource {
  constructor(datasourceService: InfrastructureDatasourceService) {
    super(datasourceService);
  }

  get(id: number, fields: string[]): Promise<LinkModel | undefined> {
    return Links.findByPk(id, {
      attributes: this.filterFields(fields, Links),
    }).then((link) => link?.toJSON<LinkModel>());
  }

  getPaged({ offset, limit, ...query }: PagedLinkArgs, fields: string[]): Promise<PagedLinkModel> {
    const { keyword, ...restQuery } = query;
    return Links.findAndCountAll({
      attributes: this.filterFields(fields, Links),
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
   * @param requestUserId 请求用户 Id
   */
  async create(model: NewLinkInput, requestUserId: number): Promise<LinkModel> {
    const link = await Links.create({
      ...model,
      userId: requestUserId,
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
   * @param requestUserId 请求用户 Id
   */
  async update(id: number, model: UpdateLinkInput, requestUserId: number): Promise<void> {
    const link = await Links.findByPk(id, {
      attributes: ['userId'],
    });
    if (link) {
      // 非本人创建的是否可编辑
      if (link.userId !== requestUserId) {
        await this.hasCapability(UserCapability.ManageLinks, requestUserId);
      }

      await Links.update(model, {
        where: { id },
      });
    } else {
      throw new ValidationError(
        this.translate('infrastructure-service.datasource.link.link_does_not_exist', 'Link does not exist!'),
      );
    }
  }

  /**
   * 根据 Id 删除
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [ManageLinks (if not yours)]
   * @param id Link Id
   * @param requestUserId 请求用户 Id
   */
  async delete(id: number, requestUserId: number): Promise<void> {
    const link = await Links.findByPk(id);
    if (link) {
      // 非本人创建的是否可删除
      if (link.userId !== requestUserId) {
        await this.hasCapability(UserCapability.ManageLinks, requestUserId);
      }

      await link.destroy();
    } else {
      throw new ValidationError(
        this.translate('infrastructure-service.datasource.link.link_does_not_exist', 'Link does not exist!'),
      );
    }
  }
}
