import { Op, WhereOptions } from 'sequelize';
import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { ValidationError, RequestUser } from '@ace-pomelo/shared-server';
import {
  MediaModel,
  MediaMetaDataModel,
  MediaMetaModel,
  PagedMediaArgs,
  PagedMediaModel,
  NewMediaInput,
  NewMediaMetaInput,
  UpdateMediaInput,
} from '../interfaces/media.interface';
import { MediaMetaPresetKeys } from '../helpers/media-preset-keys';
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
  get(id: number, fields: string[]): Promise<MediaModel | undefined> {
    // 主键(meta 查询)
    if (!fields.includes('id')) {
      fields.unshift('id');
    }

    return this.models.Medias.findByPk(id, {
      attributes: this.filterFields(fields, this.models.Medias),
      include: {
        model: this.models.MediaMeta.scope(MediaMetaPresetKeys.Matedata),
        attributes: ['metaValue'],
        as: 'MediaMetadata',
        required: false,
        duplicating: false,
      },
    }).then((media) => {
      if (media) {
        const mediaMeta = (media as any).MediaMetadata as MediaMetaModel | undefined;
        return {
          ...media.toJSON<MediaModel>(),
          metaData: mediaMeta?.metaValue ? (JSON.parse(mediaMeta.metaValue) as MediaMetaDataModel) : undefined,
        };
      }
      return;
    });
  }

  /**
   * 根据文件名获取媒体
   * @param fileName 文件名 (通常文件名为 md5 用于判断唯一)
   * @param fields 返回的字段
   * @returns
   */
  getByName(fileName: string, fields: string[]): Promise<MediaModel | undefined> {
    // 主键(meta 查询)
    if (!fields.includes('id')) {
      fields.unshift('id');
    }

    return this.models.Medias.findOne({
      attributes: this.filterFields(fields, this.models.Medias),
      include: {
        model: this.models.MediaMeta.scope(MediaMetaPresetKeys.Matedata),
        attributes: ['metaValue'],
        as: 'MediaMetadata',
        required: false,
        duplicating: false,
      },
      where: {
        fileName,
      },
    }).then((media) => {
      if (media) {
        const mediaMeta = (media as any).MediaMetadata as MediaMetaModel | undefined;
        return {
          ...media.toJSON<MediaModel>(),
          metaData: mediaMeta?.metaValue ? (JSON.parse(mediaMeta.metaValue) as MediaMetaDataModel) : undefined,
        };
      }
      return;
    });
  }

  /**
   * 获取媒体分页
   * @param param 查询条件
   * @param fields 返回的字段
   */
  getPaged({ offset, limit, ...query }: PagedMediaArgs, fields: string[]): Promise<PagedMediaModel> {
    const where: WhereOptions = {};
    if (query.keyword) {
      where.originalFileName = {
        [Op.like]: `%${query.keyword}%`,
      };
    }

    if (query.extensions?.length) {
      where.extension = query.extensions;
    }

    if (query.mimeTypes?.length) {
      // jpg/jpeg 同一处理
      if (query.mimeTypes.includes('image/jpg')) {
        query.mimeTypes.push('image/jpeg');
      }
      where.mimeType = query.mimeTypes;
    }

    return this.models.Medias.findAndCountAll({
      attributes: this.filterFields(fields, this.models.Medias),
      include: {
        model: this.models.MediaMeta.scope(MediaMetaPresetKeys.Matedata),
        as: 'MediaMetadata',
        attributes: ['metaValue'],
        required: false,
        duplicating: false,
      },
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    }).then(({ rows, count: total }) => ({
      rows: rows.map((media) => {
        const mediaMeta = (media as any).MediaMetadata as MediaMetaModel | undefined;
        return {
          ...media.toJSON<MediaModel>(),
          metaData: mediaMeta?.metaValue ? (JSON.parse(mediaMeta.metaValue) as MediaMetaDataModel) : undefined,
        };
      }),
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
  async create(
    model: NewMediaInput,
    metaData: MediaMetaDataModel,
    requestUser: RequestUser,
  ): Promise<
    MediaModel & {
      metaData: MediaMetaDataModel;
      metas: MediaMetaModel[];
    }
  > {
    if (await this.isExists(model.fileName)) {
      throw new ValidationError(`The media filename "${model.fileName}" has existed!`);
    }

    const { metas, ...rest } = model;
    const t = await this.sequelize.transaction();
    try {
      const media = await this.models.Medias.create(
        {
          ...rest,
          userId: Number(requestUser.sub),
        },
        { transaction: t },
      );

      const mediaMetas = await this.models.MediaMeta.bulkCreate(
        [
          {
            mediaId: media.id,
            metaKey: MediaMetaPresetKeys.Matedata,
            metaValue: JSON.stringify(metaData),
          },
          ...(metas?.map((meta) => ({
            ...meta,
            mediaId: media.id,
          })) ?? []),
        ],
        {
          transaction: t,
        },
      );

      await t.commit();

      return {
        ...media.toJSON<MediaModel>(),
        metaData,
        metas: mediaMetas.filter(({ metaKey }) => metaKey !== MediaMetaPresetKeys.Matedata),
      };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 修改媒体
   * @param id Media id
   * @param model Update model
   * @param metaData metadata
   */
  async update(
    id: number,
    model: UpdateMediaInput,
    metaData: MediaMetaDataModel | 'NONE',
    requestUser: RequestUser,
  ): Promise<boolean> {
    const t = await this.sequelize.transaction();
    try {
      await this.models.Medias.update(
        {
          ...model,
          userId: Number(requestUser.sub),
        },
        {
          where: {
            id,
          },
          transaction: t,
        },
      );

      if (metaData !== 'NONE') {
        await this.models.MediaMeta.update(
          {
            metaValue: JSON.stringify(metaData),
          },
          {
            where: {
              mediaId: id,
              metaKey: MediaMetaPresetKeys.Matedata,
            },
            transaction: t,
          },
        );
      }

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      return false;
    }
  }

  /**
   * 修改 Metadata
   * @param mediaId Media Id
   * @param metaData Metadata
   */
  updateMetaData(mediaId: number, metaData: MediaMetaDataModel): Promise<boolean> {
    return this.models.MediaMeta.update(
      {
        metaValue: JSON.stringify(metaData),
      },
      {
        where: {
          mediaId,
          metaKey: MediaMetaPresetKeys.Matedata,
        },
      },
    ).then(([count]) => count > 0);
  }
}
