import { Attributes, CreationAttributes } from 'sequelize';
import { TemplateStatus, TemplateCommentStatus } from '@ace-pomelo/shared/server';
import { Templates } from '../entities';
import { PagedArgs, Paged } from './paged.interface';
import { MetaModel, NewMetaInput } from './meta.interface';

export enum TemplateInnerStatus {
  AutoDraft = 'auto draft', // 新建
  Inherit = 'inherit', // 编辑副本
}

export enum TemplateInnerType {
  Revision = 'revision', // 修订版本
}

/* ----------BASE--------------- */

/**
 * Template 返回实体模型
 */
export interface TemplateModel extends Attributes<Templates> {
  readonly status: TemplateStatus;
  readonly commentStatus: TemplateCommentStatus;
  readonly updatedAt: Date;
  readonly createdAt: Date;
}

/**
 * Paged Template 查询参数
 */
export interface PagedTemplateArgs<F extends keyof Attributes<Templates> = 'title' | 'name'> extends PagedArgs {
  /**
   * 根据 keywordField 模糊查询
   */
  keyword?: string;

  /**
   * keyword 查询字段
   * @default title
   */
  keywordField?: F;

  /**
   * 创建人id
   */
  author?: number;

  /**
   * 状态
   * 注意：查询所有状态时是不包含 Trash 状态
   */
  status?: TemplateStatus;

  /**
   * 日期，年(YYYY)/月(YYYYMM)/日(YYYYMMDD)
   */
  date?: string;

  /**
   * 类别
   * AND 关系
   */
  taxonomies?: Array<
    | {
        /**
         * 类别id
         */
        id: number;

        /**
         * type
         * if type is "category", will compare with default category
         */
        type: string;
      }
    | {
        /**
         * 类别name
         */
        name: string;

        /**
         * type
         * if type is "category", will compare with default category
         */
        type: string;
      }
  >;
}

/**
 * Paged Template 返回实体模型
 */
export interface PagedTemplateModel extends Paged<TemplateModel> {}

/**
 * Template option 返回实体模型
 */
export interface TemplateOptionModel extends Pick<TemplateModel, 'id' | 'title' | 'name'> {}

/**
 * Template option 查询参数
 */
export interface TemplateOptionArgs<F extends keyof Attributes<Templates> = 'title' | 'name'>
  extends Omit<PagedTemplateArgs<F>, 'status' | 'offset' | 'limit'> {
  // something else
}

/**
 * Template meta 返回实体模型
 */
export interface TemplateMetaModel extends MetaModel {
  templateId: number;
}

/**
 * Template meta 新建实体模型
 */
export interface NewTemplateMetaInput extends NewMetaInput {
  templateId: number;
}

/**
 * Template 新建实体模型
 */
export interface NewTemplateInput
  extends Pick<CreationAttributes<Templates>, 'name' | 'excerpt' | 'status' | 'commentStatus'> {
  title?: string;
  content?: string;
  /**
   * metaKey 不可以重复
   */
  metas?: NewMetaInput[];
}

/**
 * Template 修改实体模型
 */
export interface UpdateTemplateInput
  extends Partial<Pick<NewTemplateInput, 'title' | 'name' | 'content' | 'excerpt' | 'status' | 'commentStatus'>> {}

/* ----------表单--------------- */

/**
 * Form 新建实体模型
 */
export interface NewFormTemplateInput extends Pick<CreationAttributes<Templates>, 'name' | 'status' | 'commentStatus'> {
  title?: string;
  content?: string;
  /**
   * metaKey 不可以重复
   */
  metas?: NewMetaInput[];
}

/**
 * Form 修改实体模型
 */
export interface UpdateFormTemplateInput
  extends Partial<Pick<NewFormTemplateInput, 'title' | 'name' | 'content' | 'status' | 'commentStatus'>> {}

/* ----------页面--------------- */

/**
 * Page 新建实体模型
 */
export interface NewPageTemplateInput extends Pick<CreationAttributes<Templates>, 'name' | 'status' | 'commentStatus'> {
  title?: string;
  content?: string;
  /**
   * metaKey 不可以重复
   */
  metas?: NewMetaInput[];
}

/**
 * Page 修改实体模型
 */
export interface UpdatePageTemplateInput
  extends Partial<Pick<NewPageTemplateInput, 'title' | 'name' | 'content' | 'status' | 'commentStatus'>> {}

/* ----------文章--------------- */

/**
 * Post 新建实体模型
 */
export interface NewPostTemplateInput
  extends Pick<CreationAttributes<Templates>, 'title' | 'name' | 'excerpt' | 'content' | 'status' | 'commentStatus'> {
  /**
   * metaKey 不可以重复
   */
  metas?: NewMetaInput[];
}

/**
 * Post 修改实体模型
 */
export interface UpdatePostTemplateInput
  extends Partial<Pick<NewPostTemplateInput, 'title' | 'name' | 'excerpt' | 'content' | 'status' | 'commentStatus'>> {}
