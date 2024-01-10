import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { ValidationError } from '@ace-pomelo/shared-server';
import { UserCapability } from '../helpers/user-capability';
import {
  CommentModel,
  CommentMetaModel,
  PagedCommentArgs,
  PagedCommentModel,
  NewCommentInput,
  NewCommentMetaInput,
  UpdateCommentInput,
} from '../interfaces/comment.interface';
import { MetaDataSource } from './meta.datasource';

@Injectable()
export class CommentDataSource extends MetaDataSource<CommentMetaModel, NewCommentMetaInput> {
  constructor(protected readonly moduleRef: ModuleRef) {
    super(moduleRef);
  }

  /**
   * 获取评论
   * @param id 评论 Id
   * @param fields 返回的字段
   */
  get(id: number, fields: string[]): Promise<CommentModel | undefined> {
    // 主键(meta 查询)
    if (!fields.includes('id')) {
      fields.unshift('id');
    }

    return this.models.Comments.findByPk(id, {
      attributes: this.filterFields(fields, this.models.Comments),
    }).then((comment) => comment?.toJSON<CommentModel>());
  }

  /**
   * 获取评论分页列表
   * @param query 分页 Query 参数
   * @param fields 返回的字段
   */
  getPaged({ offset, limit, ...query }: PagedCommentArgs, fields: string[]): Promise<PagedCommentModel> {
    return this.models.Comments.findAndCountAll({
      attributes: this.filterFields(fields, this.models.Comments),
      where: {
        ...query,
      },
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    }).then(({ rows, count: total }) => ({
      rows: rows as PagedCommentModel['rows'],
      total,
    }));
  }

  /**
   * 添加评论
   * @param model 添加实体模型
   * @param fields 返回的字段
   * @param requestUserId 请求用户 Id
   */
  async create(model: NewCommentInput, requestUserId: number): Promise<CommentModel> {
    const { metas, ...rest } = model;

    const t = await this.sequelize.transaction();
    try {
      const comment = await this.models.Comments.create(
        {
          ...rest,
          userId: requestUserId,
        },
        { transaction: t },
      );

      if (metas && metas.length) {
        this.models.CommentMeta.bulkCreate(
          metas.map((meta) => {
            return {
              ...meta,
              commentId: comment.id,
            };
          }),
          { transaction: t },
        );
      }

      await t.commit();

      return comment.toJSON<CommentModel>();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * 修改评论
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [ModerateComments (if not yours)]
   * @param id Link Id
   * @param model 修改实体模型
   * @param requestUserId 请求用户 Id
   */
  async update(id: number, model: UpdateCommentInput, requestUserId: number): Promise<void> {
    const comment = await this.models.Comments.findByPk(id, {
      attributes: ['userId'],
    });
    if (comment) {
      // 非本人创建的是否可以编辑
      if (comment.userId !== requestUserId) {
        await this.hasCapability(UserCapability.ModerateComments, requestUserId, true);
      }

      await this.models.Comments.update(model, {
        where: { id },
      });
    }

    throw new ValidationError(this.translate('datasource.comment.comment_does_not_exist', 'Comment does not exist!'));
  }

  /**
   * 删除评论
   * @author Hubert
   * @since 2020-10-01
   * @version 0.0.1
   * @access capabilities: [ModerateComments (if not yours)]
   * @param id comment id
   * @param requestUserId 请求用户 Id
   */
  async delete(id: number, requestUserId: number): Promise<void> {
    const comment = await this.models.Comments.findByPk(id);
    if (comment) {
      // 非本人创建的是否可以删除
      if (comment.userId !== requestUserId) {
        await this.hasCapability(UserCapability.ModerateComments, requestUserId, true);
      }
      const t = await this.sequelize.transaction();
      try {
        await comment.destroy({ transaction: t });

        await this.models.CommentMeta.destroy({
          where: {
            commentId: id,
          },
          transaction: t,
        });

        await t.commit();
      } catch (err) {
        await t.rollback();
        throw err;
      }
    }

    throw new ValidationError(this.translate('datasource.comment.comment_does_not_exist', 'Comment does not exist!'));
  }
}
