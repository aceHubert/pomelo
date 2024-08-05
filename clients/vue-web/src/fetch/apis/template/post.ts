import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../../graphql/infrastructure-request';

// Types
import type { TemplatePageType, TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-pomelo/shared-client';
import type { PagedTemplateArgs, TemplateModel, NewTemplateInput, TemplateStatusCountItem } from '.';
import type { TermTaxonomyModel } from '../term-taxonomy';
import type { Paged } from '../types';

export interface PagedPostTemplateArgs extends Omit<PagedTemplateArgs, 'type'> {
  tagId?: string;
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
    | 'categories'
    | 'metas'
  > {
  tags: Pick<TermTaxonomyModel, 'id' | 'name'>[];
}

export interface PagedPostTemplateItem extends Omit<PostTemplateModel, 'content' | 'metas'> {}

export interface NewPostTemplateInput
  extends Pick<NewTemplateInput, 'title' | 'name' | 'excerpt' | 'content' | 'status' | 'commentStatus' | 'metas'> {}

export interface UpdatePostTemplateInput extends Partial<Omit<NewPostTemplateInput, 'metas'>> {}

export const usePostApi = defineRegistApi('template_post', {
  apis: {
    // 分页获取文章
    getPaged: gql`
      query getPostTemplates(
        $offset: Int
        $limit: Int
        $keyword: String
        $author: ID
        $status: TemplateStatus
        $date: String
        $categoryId: ID
        $tagId: ID
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
            tags {
              id
              name
            }
          }
          total
        }
        statusCounts: templateCountByStatus(type: "post") @include(if: $queryStatusCounts) {
          status
          count
        }
        selfCounts: templateCountBySelf(type: "post", includeTrash: false) @include(if: $querySelfCounts)
      }
    ` as TypedQueryDocumentNode<
      {
        posts: Paged<PagedPostTemplateItem>;
        statusCounts?: TemplateStatusCountItem[];
        selfCounts?: number;
      },
      PagedPostTemplateArgs
    >,
    // 分页获取文章
    getPublishedPaged: gql`
      query getPostTemplates(
        $offset: Int
        $limit: Int
        $keyword: String
        $categoryId: ID
        $tagId: ID
        $metaKeys: [String!]
      ) {
        posts: postPublishedTemplates(
          offset: $offset
          limit: $limit
          keyword: $keyword
          categoryId: $categoryId
          tagId: $tagId
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
          total
        }
      }
    ` as TypedQueryDocumentNode<
      {
        posts: Paged<PagedPostTemplateItem>;
      },
      Pick<PagedPostTemplateArgs, 'offset' | 'limit' | 'keyword' | 'categoryId' | 'tagId'>
    >,
    // 获取文章
    get: gql`
      query getPost($id: ID!, $metaKeys: [String!]) {
        post: postTemplate(id: $id) {
          id
          name
          title
          content
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
    ` as TypedQueryDocumentNode<{ post: PostTemplateModel | null }, { id: string; metaKeys?: string[] }>,
    // 创建文章
    create: gql`
      mutation createPost($newPostTemplate: NewPostTemplateInput! = {}) {
        post: createPostTempate(model: $newPostTemplate) {
          id
          name
          title
          content
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
          tags {
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
    ` as TypedMutationDocumentNode<{ post: PostTemplateModel }, { newPostTemplate?: NewPostTemplateInput }>,
    // 修改文章
    update: gql`
      mutation updatePost($id: ID!, $updatePost: UpdatePostTemplateInput!, $featureImage: String!, $template: String!) {
        result: updatePostTemplate(id: $id, model: $updatePost)
        featureImageResult: updateTemplateMetaByKey(
          templateId: $id
          metaKey: "feature-image"
          metaValue: $featureImage
          createIfNotExists: true
        )
        templateResult: updateTemplateMetaByKey(
          templateId: $id
          metaKey: "template"
          metaValue: $template
          createIfNotExists: true
        )
      }
    ` as TypedMutationDocumentNode<
      { result: null; featureImageResult: null; templateResult: null },
      { id: string; updatePost: UpdatePostTemplateInput; featureImage?: string; template?: TemplatePageType }
    >,
  },
  request,
});
