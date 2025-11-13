import { defineRegistGraphql, gql } from '@ace-fetch/graphql-vue';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-fetch/graphql';
import type { PagedTemplateArgs, TemplateModel, NewTemplateInput, TemplateStatusCountItem } from '.';
import type { Paged } from '../types';

export interface PagedPageTemplateArgs extends Omit<PagedTemplateArgs, 'type'> {}

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

export interface PagedPageTemplateItem extends Omit<PageTemplateModel, 'content' | 'metas'> {}

export interface NewPageTemplateInput
  extends Pick<NewTemplateInput, 'name' | 'title' | 'content' | 'status' | 'commentStatus' | 'metas'> {}

export interface UpdatePageTemplateInput extends Partial<Omit<NewPageTemplateInput, 'meta'>> {}

export const usePageApi = defineRegistGraphql('template_page', {
  definition: {
    // 分页获取表单
    getPaged: gql`
      query getPageTemplates(
        $offset: Int
        $limit: Int
        $keyword: String
        $author: ID
        $status: TemplateStatus
        $date: String
        $categoryId: ID
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
            name
            title
            author {
              id
              displayName
            }
            status
            commentStatus
            commentCount
            updatedAt
            createdAt
          }
          total
        }
        statusCounts: templateCountByStatus(type: "page") @include(if: $queryStatusCounts) {
          status
          count
        }
        selfCounts: templateCountBySelf(type: "page", includeTrash: false) @include(if: $querySelfCounts)
      }
    ` as TypedQueryDocumentNode<
      {
        pages: Paged<PagedPageTemplateItem>;
        statusCounts?: TemplateStatusCountItem[];
        selfCounts?: number;
      },
      PagedPageTemplateArgs
    >,
    // 获取页面
    get: gql`
      query getPage($id: ID!, $metaKeys: [String!]) {
        page: pageTemplate(id: $id) {
          id
          name
          title
          content
          author {
            id
            displayName
          }
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
    ` as TypedQueryDocumentNode<{ page: PageTemplateModel | null }, { id: number; metaKeys?: string[] }>,
    // 通过别名获取页面
    getByName: gql`
      query getPageByName($name: String, $metaKeys: [String!]) {
        page: pageTemplateByName(name: $name) {
          id
          name
          title
          content
          author {
            id
            displayName
          }
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
    // 创建表单
    create: gql`
      mutation createPage($newPageTemplate: NewPageTemplateInput! = {}) {
        page: createPageTempate(model: $newPageTemplate) {
          id
          name
          title
          content
          author {
            id
            displayName
          }
          status
          commentStatus
          commentCount
          updatedAt
          createdAt
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
      mutation updatePage($id: ID!, $updatePage: UpdatePageTemplateInput!, $featureImage: String!) {
        result: updatePageTemplate(id: $id, model: $updatePage)
        featureImageResult: updateTemplateMetaByKey(
          templateId: $id
          metaKey: "feature-image"
          metaValue: $featureImage
          createIfNotExists: true
        )
      }
    ` as TypedMutationDocumentNode<
      { result: null; featureImageResult: null },
      { id: number; updatePage: UpdatePageTemplateInput; featureImage?: string }
    >,
  },
});
