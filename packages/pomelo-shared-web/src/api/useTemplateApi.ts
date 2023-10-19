import { typedUrl } from '@ace-fetch/core';
import { defineRegistApi } from '@ace-fetch/vue';
import { getEnv } from '@ace-util/core';

// Types
export enum TemplateStatus {
  Draft = 'Draft', // 草稿
  Pending = 'Pending', // 等审核
  Publish = 'Publish', // 已发布
  Private = 'Private', // 私有，暂未使用
  Future = 'Future', // 定时发布，暂未使用
  Trash = 'Trash', // 垃圾箱
}

export enum TemplatePageType {
  Default = 'default',
  Cover = 'cover',
  FullWidth = 'full-width',
}

export enum TemplateCommentStatus {
  Open = 'Open',
  Closed = 'Closed',
}

export interface TemplateModel {
  id: number;
  name: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  status: TemplateStatus;
  type: string;
  commentStatus: TemplateCommentStatus;
  commentCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface FormTemplateModel
  extends Pick<TemplateModel, 'id' | 'title' | 'content' | 'author' | 'status' | 'updatedAt' | 'createdAt'> {}

export interface FormTemplateWithMetasModel extends FormTemplateModel {
  metas?: MetaModel[];
}

export interface PageTemplateModel
  extends Pick<
    TemplateModel,
    | 'id'
    | 'name'
    | 'title'
    | 'content'
    | 'author'
    | 'status'
    | 'commentStatus'
    | 'commentCount'
    | 'updatedAt'
    | 'createdAt'
  > {}

export interface PageTemplateWithMetasModel extends PageTemplateModel {
  metas?: MetaModel[];
}

export interface PostTemplateModel
  extends Pick<
    TemplateModel,
    | 'id'
    | 'name'
    | 'title'
    | 'author'
    | 'content'
    | 'excerpt'
    | 'status'
    | 'commentStatus'
    | 'commentCount'
    | 'updatedAt'
    | 'createdAt'
  > {}

export interface PostTemplateWithMetasModel extends PostTemplateModel {
  metas?: MetaModel[];
}

export interface MetaModel {
  id: number;
  templateId: number;
  metaKey: string;
  metaValue: string;
}

export const TemplateMetaPresetKeys = {
  CssText: 'css-text',
  StyleLink: 'style-link',
  FeatureImage: 'feature-image',
  SettingsDisplay: 'settings-display',
};

export const PostMetaPresetKeys = {
  Template: 'template',
  ...TemplateMetaPresetKeys,
};

export const FormMetaPresetKeys = {
  SubmitAction: 'submit.action',
  SubmitSuccessRedirect: 'submit.success_redirect',
  SubmitSuccessTips: 'submit.success_tips',
  ...TemplateMetaPresetKeys,
};

export const PageMetaPresetKeys = {
  ...TemplateMetaPresetKeys,
};

/**
 * prefix 需要注册到window._ENV上
 */
export const useTemplateApi = defineRegistApi('__TEMPLATES__', {
  apis: {
    get: typedUrl<TemplateModel, { id: string | number }>`templates/${'id'}`,
    // form
    getForm: typedUrl<
      FormTemplateWithMetasModel | undefined,
      { id: string | number; metaKeys?: string[] }
    >`template/forms/${'id'}`,
    // pages
    getAliasPaths: typedUrl<string[]>`template/page/alias/paths`,
    getPage: typedUrl<
      PageTemplateWithMetasModel | undefined,
      { id: string | number; metaKeys?: string[] }
    >`template/pages/${'id'}`,
    getPageByName: typedUrl<
      PageTemplateWithMetasModel | undefined,
      { name: string; metaKeys?: string[] }
    >`template/pages/${'name'}/alias`,
    // posts
    getPost: typedUrl<
      PostTemplateWithMetasModel | undefined,
      { id: string | number; metaKeys?: string[] }
    >`template/posts/${'id'}`,
    // metas
    getMeta: typedUrl<MetaModel, { id: string | number }>`templates/metas/${'id'}`,
    getMetas: typedUrl<MetaModel[], { templateId: string | number }>`templates/${'templateId'}/metas`,
  },
  prefix: getEnv('apiBase', '/api', (window as any)._ENV),
});
