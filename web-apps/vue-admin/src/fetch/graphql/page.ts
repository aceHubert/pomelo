import { defineRegistApi, gql } from './core';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from './core/request';
import type {
  PagedTemplateQuery,
  PagedTemplateItem,
  TempaleModel,
  NewTemplateInput,
  UpdateTemplateInput,
  TemplateStatusCountItem,
} from './template';
import type { Paged } from './types';

export interface PagedPageTemplateQuery extends Omit<PagedTemplateQuery, 'type'> {}

export interface PagedPageTemplateItem extends Omit<PagedTemplateItem, 'excerpt'> {}

export interface PageTemplateModel extends Omit<TempaleModel, 'type' | 'excerpt' | 'content'> {
  schema: string;
}

export interface NewPageTemplateInput extends Omit<NewTemplateInput, 'type' | 'excerpt' | 'content'> {
  schema: string;
}

export interface UpdatePageTemplateInput extends Omit<UpdateTemplateInput, 'excerpt' | 'content'> {
  schema: string;
}

export const usePageApi = defineRegistApi('template_page', {
  // 分页获取表单
  getPaged: gql`
    query getPageTemplates(
      $offset: Int
      $limit: Int
      $keyword: String
      $author: String
      $status: TemplateStatus
      $date: String
      $categoryId: Int
      $queryStatusCounts: Boolean! = false
      $querySelfCounts: Boolean! = false
    ) {
      pages: pageTemplates(
        offset: $offset
        limit: $limit
        keyword: $keyword
        author: $author
        status: $status
        date: $date
        categoryId: $categoryId
      ) {
        rows {
          id
          title
          name
          author
          status
          categories {
            id
            name
          }
          createdAt
        }
        total
      }
      statusCounts: templateCountByStatus(type: "Page") @include(if: $queryStatusCounts) {
        status
        count
      }
      selfCounts: templateCountBySelf(type: "Page", includeTrash: false) @include(if: $querySelfCounts)
    }
  ` as TypedQueryDocumentNode<
    {
      pages: Paged<PagedPageTemplateItem>;
      statusCounts?: TemplateStatusCountItem[];
      selfCounts?: number;
    },
    PagedPageTemplateQuery
  >,
  // 获取表单
  get: gql`
    query getPage($id: ID!, $metaKeys: [String!]) {
      page: pageTemplate(id: $id) {
        id
        title
        name
        schema
        author
        status
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
  ` as TypedQueryDocumentNode<{ page?: PageTemplateModel }, { id: number; metaKeys?: string[] }>,
  // 创建表单
  create: gql`
    mutation createPage($newPageTemplate: NewPageTemplateInput!) {
      page: createPageTempate(model: $newPageTemplate) {
        id
        title
        name
        status
        schema
        metas {
          id
          key: metaKey
          value: metaValue
        }
      }
    }
  ` as TypedMutationDocumentNode<{ page: PageTemplateModel }, { newPageTemplate: NewPageTemplateInput }>,
  // 修改表单
  update: gql`
    mutation updatePage($id: ID!, $updatePage: UpdatePageTemplateInput!) {
      result: updatePageTemplate(id: $id, model: $updatePage)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { id: number; updatePage: UpdatePageTemplateInput }>,
});
