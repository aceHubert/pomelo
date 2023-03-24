import { defineRegistApi, typedUrl } from '@vue-async/fetch';
import { getEnv } from '../utils/env';

// Types
export enum TemplateStatus {
  Draft = 'Draft', // 草稿
  Publish = 'Publish', // 已发布
  Trash = 'Trash', // 垃圾箱
}

export enum TemplatePlatform {
  Mobile = 'mobile', // metaKey
  Desktop = 'desktop', // metaKey
  Responsive = 'responsive', // default in template table
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
  createdAt: string;
}

export interface FormTemplateModel extends Pick<TemplateModel, 'id' | 'title' | 'status' | 'author' | 'createdAt'> {
  schema: string;
}

export interface FormTemplateWithMetasModel extends FormTemplateModel {
  metas?: MetaModel[];
}

export interface PageTemplateModel
  extends Pick<TemplateModel, 'id' | 'name' | 'title' | 'status' | 'author' | 'createdAt'> {
  schema: string;
}

export interface PageTemplateWithMetasModel extends PageTemplateModel {
  metas?: MetaModel[];
}

export interface PostTemplateModel
  extends Pick<TemplateModel, 'id' | 'excerpt' | 'content' | 'title' | 'status' | 'author' | 'createdAt'> {}

export interface PostTemplateWithMetasModel extends PostTemplateModel {
  metas?: MetaModel[];
}

export interface MetaModel {
  id: number;
  templateId: number;
  metaKey: string;
  metaValue: string;
}

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
