import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../../graphql-request/basic';

// Types
import type {
  TemplateStatus,
  TemplateCommentStatus,
  TypedQueryDocumentNode,
  TypedMutationDocumentNode,
} from '@ace-pomelo/shared-client';

import type { TermTaxonomyModel } from '../term-taxonomy';
import type { PagedArgs, Paged } from '../types';

export enum PresetTemplateType {
  Post = 'Post',
  Page = 'Page',
  Form = 'Form',
}

export interface PagedTemplateArgs extends PagedArgs {
  keyword?: string;
  type: string;
  author?: string;
  status?: TemplateStatus;
  date?: string;
  categoryId?: string;
  queryStatusCounts?: boolean;
  querySelfCounts?: boolean;
}

export interface TemplateModel {
  id: string;
  title: string;
  name: string;
  excerpt: string;
  content: string;
  author?: {
    id: string;
    displayName: string;
  };
  status: TemplateStatus;
  type: string;
  commentStatus: TemplateCommentStatus;
  commentCount: number;
  updatedAt: string;
  createdAt: string;
  categories: Pick<TermTaxonomyModel, 'id' | 'name'>[];
  metas: Array<Pick<TemplateMetaModel, 'id' | 'key' | 'value'>>;
}

export interface PagedTemplateItem extends Omit<TemplateModel, 'content' | 'metas'> {}

interface TemplateCountItem {
  count: number;
}

export interface TemplateStatusCountItem extends TemplateCountItem {
  status: TemplateStatus;
}

export interface TemplateDayCountItem extends TemplateCountItem {
  day: string;
}

export interface TemplateMonthCountItem extends TemplateCountItem {
  month: string;
}

export interface TemplateYearCountItem extends TemplateCountItem {
  year: string;
}

export interface NewTemplateInput {
  name?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  status?: TemplateStatus;
  type: string;
  commentStatus?: TemplateCommentStatus;
  metas?: Pick<NewTemplateMetaInput, 'metaKey' | 'metaValue'>[];
}

export interface UpdateTemplateInput
  extends Partial<Pick<NewTemplateInput, 'name' | 'title' | 'excerpt' | 'content' | 'status'>> {}

export interface TemplateMetaModel {
  id: string;
  templateId: string;
  key: string;
  value: string;
}

export interface NewTemplateMetaInput {
  templateId: string;
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
    // 分页获取模版
    getPaged: gql`
      query getTemplates(
        $offset: Int
        $limit: Int
        $keyword: String
        $type: String!
        $author: ID
        $status: TemplateStatus
        $date: String
        $categoryId: ID
        $queryStatusCounts: Boolean! = false
        $querySelfCounts: Boolean! = false
      ) {
        templates(
          offset: $offset
          limit: $limit
          keyword: $keyword
          type: $type
          author: $author
          status: $status
          date: $date
          categoryId: $categoryId
        ) {
          rows {
            id
            name
            title
            excerpt
            author {
              id
              displayName
            }
            status
            commentStatus
            commentCount
            updatedAt
            createdAt
            categories {
              id
              name
            }
          }
          total
        }
        statusCounts: templateCountByStatus(type: $type) @include(if: $queryStatusCounts) {
          status
          count
        }
        selfCounts: templateCountBySelf(type: $type) @include(if: $querySelfCounts)
      }
    ` as TypedQueryDocumentNode<
      {
        templates: Paged<PagedTemplateItem>;
        statusCounts?: TemplateStatusCountItem[];
        selfCounts?: number;
      },
      PagedTemplateArgs
    >,
    // 获取模版
    get: gql`
      query getTemplate($id: ID!, $metaKeys: [String!]) {
        template(id: $id) {
          id
          title
          content
          excerpt
          author {
            id
            displayName
          }
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
    ` as TypedQueryDocumentNode<{ template?: TemplateModel }, { id: string; metaKeys?: string[] }>,
    // 按状态分组数量
    getCountByStatus: gql`
      query getCountByStatus($type: String!) {
        statusCounts: templateCountByStatus(type: $type) {
          status
          count
        }
      }
    ` as TypedQueryDocumentNode<{ statusCounts: TemplateStatusCountItem[] }, { type: string }>,
    // 由本人创建的数量
    getCountBySelf: gql`
      query getCountBySelf($type: String!) {
        count: templateCountBySelf(type: $type, includeTrash: false)
      }
    ` as TypedQueryDocumentNode<{ count: number }, { type: string }>,
    // 按天分组数量, month (format: YYYYMM)
    getCountByDay: gql`
      query getCounts($type: String!, $month: String!) {
        dayCounts: templateCountByDay(type: $type, month: $month) {
          day
          count
        }
      }
    ` as TypedQueryDocumentNode<{ dayCounts: TemplateDayCountItem[] }, { month: string; type: string }>,
    // 按月分组数量, year (format: YYYY), months: 如果年份没有则取以当前向前推的 months 月数，默认12
    getCountByMonth: gql`
      query getCountByMonth($type: String!, $months: Int, $year: String) {
        monthCounts: templateCountByMonth(type: $type, months: $months, year: $year) {
          month
          count
        }
      }
    ` as TypedQueryDocumentNode<
      { monthCounts: TemplateMonthCountItem[] },
      { year: string; months: number; type: string }
    >,
    // 按年分组数量
    getCountByYear: gql`
      query getCountByYear($type: String!) {
        yearCounts: templateCountByYear(type: $type) {
          year
          count
        }
      }
    ` as TypedQueryDocumentNode<{ monthCounts: TemplateMonthCountItem[] }, { type: string }>,
    // 创建模版
    create: gql`
      mutation create($newTemplate: NewTemplateInput!) {
        template: createTemplate(model: $newTemplate) {
          id
          name
          title
          excerpt
          author {
            id
            displayName
          }
          status
          commentStatus
          commentCount
          updatedAt
          createdAt
          categories {
            id
            name
          }
          metas {
            id
            key: metaKey
            value: metaValue
          }
        }
      }
    ` as TypedMutationDocumentNode<{ template: TemplateModel }, { newTemplate: NewTemplateInput }>,
    // 修改模版
    update: gql`
      mutation update($id: ID!, $updateTemplate: UpdateTemplateInput!) {
        result: updateTemplate(id: $id, model: $updateTemplate)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: number; updateTemplate: UpdateTemplateInput }>,
    // 修改模版状态
    updateStatus: gql`
      mutation updateStatus($id: ID!, $status: TemplateStatus!) {
        result: updateTemplateStatus(id: $id, status: $status)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string; status: TemplateStatus }>,
    bulkUpdateStatus: gql`
      mutation bulkUpdateStatus($ids: [ID!]!, $status: TemplateStatus!) {
        result: bulkUpdateTemplateStatus(ids: $ids, status: $status)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { ids: string[]; status: TemplateStatus }>,
    // 重置模版(必须是trush状态)
    restore: gql`
      mutation restore($id: ID!) {
        result: restoreTemplate(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string }>,
    bulkRestore: gql`
      mutation bulkRestore($ids: [ID!]!) {
        result: bulkRestoreTemplate(ids: $ids)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { ids: string[] }>,
    // 删除模版(必须是trush状态)
    delete: gql`
      mutation delete($id: ID!) {
        result: deleteTemplate(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string }>,
    bulkDelete: gql`
      mutation bulkDelete($ids: [ID!]!) {
        result: bulkDeleteTemplate(ids: $ids)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { ids: string[] }>,
    // 创建模版 meta
    createMeta: gql`
      mutation createTemplateMeta($newMeta: NewTemplateMetaInput!) {
        meta: createTemplateMeta(model: $newMeta) {
          id
          templateId
          key: metaKey
          value: metaValue
        }
      }
    ` as TypedMutationDocumentNode<
      { meta: TemplateMetaModel },
      { newMeta: { templateId: string; metaKey: string; metaValue: string } }
    >,
    updateMetaByKey: gql`
      mutation updateTemplateMetaByKey(
        $templateId: ID!
        $metaKey: String!
        $metaValue: String!
        $createIfNotExists: Boolean! = false
      ) {
        result: updateTemplateMetaByKey(
          templateId: $templateId
          metaKey: $metaKey
          metaValue: $metaValue
          createIfNotExists: $createIfNotExists
        )
      }
    ` as TypedMutationDocumentNode<
      { result: null },
      { templateId: string; metaKey: string; metaValue: string; createIfNotExists?: boolean }
    >,
    updateMeta: gql`
      mutation updateTemplateMeta($id: ID!, $metaValue: String!) {
        result: updateTemplateMeta(id: $id, metaValue: $metaValue)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string; metaValue: string }>,
    // 删除模版 meta
    deleteMetaByKey: gql`
      mutation deleteTemplateMetaByKey($templateId: ID!, $key: String!) {
        result: deleteTemplateMetaByKey(templateId: $templateId, metaKey: $key)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { templateId: string; key: string }>,
    // 删除模版 meta
    deleteMeta: gql`
      mutation deleteTemplateMeta($id: ID!) {
        result: deleteTemplateMeta(id: $id)
      }
    ` as TypedMutationDocumentNode<{ result: null }, { id: string }>,
  },
  request,
});

export * from './post';
export * from './page';
export * from './form';
