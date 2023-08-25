import { Op } from 'sequelize';
import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { ValidationError, RequestUser } from '@pomelo/shared';
import {
  MediaModel,
  MediaMetaModel,
  PagedMediaArgs,
  PagedMediaModel,
  NewMediaInput,
  NewMediaMetaInput,
} from '../interfaces/media.interface';
import { MetaDataSource } from './meta.datasource';

@Injectable()
export class MediaDataSource extends MetaDataSource<MediaMetaModel, NewMediaMetaInput> {
  constructor(protected readonly moduleRef: ModuleRef) {
    super(moduleRef);
  }

  /**
   * 获取媒体
   * @param id Media Id
   * @param fields 返回的字段
   */
  get(id: number, fields: string[]): Promise<MediaModel | null> {
    // 主键(meta 查询)
    if (!fields.includes('id')) {
      fields.push('id');
    }

    return this.models.Medias.findByPk(id, {
      attributes: this.filterFields(fields, this.models.Medias),
    }).then((media) => media?.toJSON() as MediaModel);
  }

  /**
   * 根据文件名获取媒体
   * @param fileName 文件名 (通常文件名为 md5 用于判断唯一)
   * @param fields 返回的字段
   * @returns
   */
  getByName(fileName: string, fields: string[]): Promise<MediaModel | null> {
    // 主键(meta 查询)
    if (!fields.includes('id')) {
      fields.push('id');
    }

    return this.models.Medias.findOne({
      attributes: this.filterFields(fields, this.models.Medias),
      where: {
        fileName,
      },
    }).then((media) => media?.toJSON() as MediaModel);
  }

  /**
   * 获取媒体分页
   * @param param 查询条件
   * @param fields 返回的字段
   */
  getPaged({ offset, limit, ...query }: PagedMediaArgs, fields: string[]): Promise<PagedMediaModel> {
    const { keyword, ...restQuery } = query;
    return this.models.Medias.findAndCountAll({
      attributes: this.filterFields(fields, this.models.Medias),
      where: {
        ...(keyword
          ? {
              fileName: {
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
      rows: rows as PagedMediaModel['rows'],
      total,
    }));
  }

  /**
   * 判断文件名是否在在
   * @param fileName 文件名 (通常文件名为 md5 用于判断唯一)
   */
  async isExists(fileName: string): Promise<boolean> {
    return (
      (await this.models.Medias.count({
        where: {
          fileName,
        },
      })) > 0
    );
  }

  /**
   * 添加媒体
   * @param model 添加实体模型
   * @param fields 返回的字段
   */
  async create(model: NewMediaInput, requestUser: RequestUser): Promise<MediaModel> {
    if (await this.isExists(model.fileName)) {
      throw new ValidationError(`The media filename "${model.fileName}" has existed!`);
    }

    const { metas, ...rest } = model;
    const t = await this.sequelize.transaction();
    try {
      const media = await this.models.Medias.create(
        {
          ...rest,
          userId: requestUser.sub!,
        },
        { transaction: t },
      );

      if (metas && metas.length) {
        this.models.MediaMeta.bulkCreate(
          metas.map((meta) => {
            return {
              ...meta,
              mediaId: media.id,
            };
          }),
          {
            transaction: t,
          },
        );
      }

      await t.commit();

      return media.toJSON() as MediaModel;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
