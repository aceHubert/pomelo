import { defineRegistApi, gql } from './core';

// Types
import type { TemplateStatus, TemplateCommentStatus } from '@pomelo/shared-client';
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from './core/request';
import type { TermTaxonomyModel } from './term-taxonomy';
import type { Paged } from './types';

export enum TemplateType {
  Post = 'Post',
  Page = 'Page',
  Form = 'Form',
}

export interface PagedTemplateArgs {
  keyword?: string;
  type: string;
  author?: string;
  status?: TemplateStatus;
  date?: string;
  categoryId?: number;
  offset?: number;
  limit?: number;
  queryStatusCounts?: boolean;
  querySelfCounts?: boolean;
}

export interface TempateModel {
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

export interface PagedTemplateItem extends Omit<TempateModel, 'content' | 'metas'> {}

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
  id: number;
  templateId: number;
  key: string;
  value: string;
}

export interface NewTemplateMetaInput {
  templateId: number;
  metaKey: string;
  metaValue: string;
}

export const useTemplateApi = defineRegistApi('template', {
  // 分页获取模版
  getPaged: gql`
    query getTemplates(
      $offset: Int
      $limit: Int
      $keyword: String
      $type: String!
      $author: String
      $status: TemplateStatus
      $date: String
      $categoryId: Int
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
  ` as TypedQueryDocumentNode<{ template?: TempateModel }, { id: number; metaKeys?: string[] }>,
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
        metas(metaKeys: $metaKeys) {
          id
          key: metaKey
          value: metaValue
        }
      }
    }
  ` as TypedMutationDocumentNode<{ template: TempateModel }, { newTemplate: NewTemplateInput }>,
  // 修改模版
  update: gql`
    mutation update($id: ID!, $updateTemplate: UpdateTemplateInput!) {
      result: updateTemplate(id: $id, model: $updateTemplate)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { id: number; updateTemplate: UpdateTemplateInput }>,
  // 修改模版状态
  updateStatus: gql`
    mutation updateStatus($id: ID!, $status: TemplateStatus!) {
      result: updateTemplateStatus(id: $id, status: $status)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { id: number; status: TemplateStatus }>,
  bulkUpdateStatus: gql`
    mutation bulkUpdateStatus($ids: [ID!]!, $status: TemplateStatus!) {
      result: bulkUpdateTemplateStatus(ids: $ids, status: $status)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { ids: number[]; status: TemplateStatus }>,
  // 重置模版(必须是trush状态)
  restore: gql`
    mutation restore($id: ID!) {
      result: restoreTemplate(id: $id)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { id: number }>,
  bulkRestore: gql`
    mutation bulkRestore($ids: [ID!]!) {
      result: bulkRestoreTemplate(ids: $ids)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { ids: number[] }>,
  // 删除模版(必须是trush状态)
  delete: gql`
    mutation delete($id: ID!) {
      result: deleteTemplate(id: $id)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { id: number }>,
  bulkDelete: gql`
    mutation bulkDelete($ids: [ID!]!) {
      result: bulkDeleteTemplate(ids: $ids)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { ids: number[] }>,
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
    { newMeta: { templateId: number; metaKey: string; metaValue: string } }
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
    { result: boolean },
    { templateId: number; metaKey: string; metaValue: string; createIfNotExists?: boolean }
  >,
  updateMeta: gql`
    mutation updateTemplateMeta($id: ID!, $metaValue: String!) {
      result: updateTemplateMeta(id: $id, metaValue: $metaValue)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { id: number; metaValue: string }>,
  // 删除模版 meta
  deleteMetaByKey: gql`
    mutation deleteTemplateMetaByKey($templateId: ID!, $key: String!) {
      result: deleteTemplateMetaByKey(templateId: $templateId, metaKey: $key)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { templateId: number; key: string }>,
  // 删除模版 meta
  deleteMeta: gql`
    mutation deleteTemplateMeta($id: ID!) {
      result: deleteTemplateMeta(id: $id)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { id: number }>,
});
