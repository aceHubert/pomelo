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
import type { TermTaxonomyModel } from './term-taxonomy';
import type { Paged } from './types';

export interface PagedPostTemplateQuery extends Omit<PagedTemplateQuery, 'type'> {
  tagId?: number;
}

export interface PagedPostTemplateItem extends PagedTemplateItem {
  tags: Pick<TermTaxonomyModel, 'id' | 'name'>[];
}

export interface PostTemplateModel extends Omit<TempaleModel, 'type'> {
  tags: Pick<TermTaxonomyModel, 'id' | 'name'>[];
}

export interface NewPostTemplateInput extends Omit<NewTemplateInput, 'type'> {}

export interface UpdatePostTemplateInput extends UpdateTemplateInput {}

export const usePostApi = defineRegistApi('template_post', {
  // 分页获取表单
  getPaged: gql`
    query getPostTemplates(
      $offset: Int
      $limit: Int
      $keyword: String
      $author: String
      $status: TemplateStatus
      $date: String
      $categoryId: Int
      $tagId: Int
      $queryStatusCounts: Boolean! = false
      $querySelfCounts: Boolean! = false
    ) {
      posts: postTemplates(
        offset: $offset
        limit: $limit
        keyword: $keyword
        author: $author
        status: $status
        date: $date
        categoryId: $categoryId
        tagId: $tagId
      ) {
        rows {
          id
          title
          name
          excerpt
          author
          status
          categories {
            id
            name
          }
          tags {
            id
            name
          }
          createdAt
        }
        total
      }
      statusCounts: templateCountByStatus(type: "Post") @include(if: $queryStatusCounts) {
        status
        count
      }
      selfCounts: templateCountBySelf(type: "Post", includeTrash: false) @include(if: $querySelfCounts)
    }
  ` as TypedQueryDocumentNode<
    {
      posts: Paged<PagedPostTemplateItem>;
      statusCounts?: TemplateStatusCountItem[];
      selfCounts?: number;
    },
    PagedPostTemplateQuery
  >,
  // 获取表单
  get: gql`
    query getPost($id: ID!, $metaKeys: [String!]) {
      post: postTemplate(id: $id) {
        id
        title
        name
        excerpt
        content
        author
        status
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
  ` as TypedQueryDocumentNode<{ post?: PostTemplateModel }, { id: number; metaKeys?: string[] }>,
  // 创建表单
  create: gql`
    mutation createPost($newPostTemplate: NewPostTemplateInput!) {
      post: createPostTempate(model: $newPostTemplate) {
        id
        title
        name
        status
        content
        metas {
          id
          key: metaKey
          value: metaValue
        }
      }
    }
  ` as TypedMutationDocumentNode<{ post: PostTemplateModel }, { newPostTemplate: NewPostTemplateInput }>,
  // 修改表单
  update: gql`
    mutation updatePost($id: ID!, $updatePost: UpdatePostTemplateInput!) {
      result: updatePostTemplate(id: $id, model: $updatePost)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { id: number; updatePost: UpdatePostTemplateInput }>,
});
