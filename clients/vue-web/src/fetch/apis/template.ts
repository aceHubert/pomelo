import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql/infrastructure-request';

// Types
import type { TemplateStatus, TemplateCommentStatus, TypedQueryDocumentNode } from '@ace-pomelo/shared-client';
import type { TermTaxonomyModel } from './term-taxonomy';

export enum TemplatePageType {
  Default = 'default',
  Cover = 'cover',
  FullWidth = 'full-width',
}

export interface TemplateModel {
  id: number;
  title: string;
  name: string;
  excerpt: string;
  content: string;
  author: string;
  status: TemplateStatus;
  type: string;
  commentStatus: TemplateCommentStatus;
  commentCount: number;
  updatedAt: string;
  createdAt: string;
  categories: Pick<TermTaxonomyModel, 'id' | 'name'>[];
  metas: Array<Pick<TemplateMetaModel, 'id' | 'key' | 'value'>>;
}

export interface TemplateMetaModel {
  id: number;
  templateId: number;
  key: string;
  value: string;
}

export interface FormTemplateModel
  extends Pick<TemplateModel, 'id' | 'title' | 'content' | 'author' | 'status' | 'updatedAt' | 'createdAt' | 'metas'> {}

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
    | 'metas'
  > {}

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
    | 'categories'
    | 'metas'
  > {
  tags: Pick<TermTaxonomyModel, 'id' | 'name'>[];
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

export const useTemplateApi = defineRegistApi('template', {
  apis: {
    // 获取模版
    get: gql`
      query getTemplate($id: ID!, $metaKeys: [String!]) {
        template(id: $id) {
          id
          title
          content
          excerpt
          author
          status
          type
          commentStatus
          commentCount
          updatedAt
          createdAt
          categories {
            id
            name
          }
          metas(metaKeys: $metaKeys) {
            id
            key: metaKey
            value: metaValue
          }
        }
      }
    ` as TypedQueryDocumentNode<{ template?: TemplateModel }, { id: number; metaKeys?: string[] }>,
    // 获取表单
    getForm: gql`
      query getForm($id: ID!, $metaKeys: [String!]) {
        form: formTemplate(id: $id) {
          id
          title
          content
          author
          status
          updatedAt
          createdAt
          metas(metaKeys: $metaKeys) {
            id
            key: metaKey
            value: metaValue
          }
        }
      }
    ` as TypedQueryDocumentNode<{ form?: FormTemplateModel }, { id: number; metaKeys?: string[] }>,
    // 获取页面别名路径
    getAliasPaths: gql`
      query getAliasPaths {
        paths: pageAliasPaths
      }
    ` as TypedQueryDocumentNode<{ paths: string[] }>,
    // 获取页面
    getPage: gql`
      query getPage($id: ID!, $metaKeys: [String!]) {
        page: pageTemplate(id: $id) {
          id
          name
          title
          content
          author
          status
          commentStatus
          commentCount
          updatedAt
          createdAt
          metas(metaKeys: $metaKeys) {
            id
            key: metaKey
            value: metaValue
          }
        }
      }
    ` as TypedQueryDocumentNode<{ page?: PageTemplateModel }, { id: number; metaKeys?: string[] }>,
    // 通过别名获取页面
    getPageByName: gql`
      query getPage($name: String, $metaKeys: [String!]) {
        page: pageTemplateByName(name: $name) {
          id
          name
          title
          content
          author
          status
          commentStatus
          commentCount
          updatedAt
          createdAt
          metas(metaKeys: $metaKeys) {
            id
            key: metaKey
            value: metaValue
          }
        }
      }
    ` as TypedQueryDocumentNode<{ page?: PageTemplateModel }, { name?: string; metaKeys?: string[] }>,
    // 获取文章
    getPost: gql`
      query getPost($id: ID!, $metaKeys: [String!]) {
        post: postTemplate(id: $id) {
          id
          name
          title
          content
          excerpt
          author
          status
          commentStatus
          commentCount
          updatedAt
          createdAt
          categories {
            id
            name
          }
          tags {
            id
            name
          }
          metas(metaKeys: $metaKeys) {
            id
            key: metaKey
            value: metaValue
          }
        }
      }
    ` as TypedQueryDocumentNode<{ post?: PostTemplateModel }, { id: number }>,
  },
  request,
});
