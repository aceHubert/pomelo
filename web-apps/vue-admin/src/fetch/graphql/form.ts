import { defineRegistApi, gql } from './core';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from './core/request';
import type {
  PagedTemplateArgs,
  TempaleModel,
  NewTemplateInput,
  UpdateTemplateInput,
  TemplateStatusCountItem,
} from './template';
import type { Paged } from './types';

export interface PagedFormTemplateArgs extends Omit<PagedTemplateArgs, 'type' | 'categories'> {}

export interface FormTempaleModel
  extends Pick<TempaleModel, 'id' | 'title' | 'author' | 'status' | 'updatedAt' | 'createdAt' | 'metas'> {
  schema: string;
}

export interface PagedFormTemplateItem extends Omit<FormTempaleModel, 'schema' | 'metas'> {}

export interface NewFormTemplateInput extends Omit<NewTemplateInput, 'type' | 'excerpt' | 'content'> {
  schema: string;
}

export interface UpdateFormTemplateInput extends Omit<UpdateTemplateInput, 'excerpt' | 'content'> {
  schema: string;
}

export const useFormApi = defineRegistApi('template_form', {
  // 分页获取表单
  getPaged: gql`
    query getFormTemplates(
      $offset: Int
      $limit: Int
      $keyword: String
      $status: TemplateStatus
      $author: String
      $date: String
      $categoryId: Int
      $queryStatusCounts: Boolean! = false
      $querySelfCounts: Boolean! = false
    ) {
      forms: formTemplates(
        offset: $offset
        limit: $limit
        keyword: $keyword
        status: $status
        author: $author
        date: $date
        categoryId: $categoryId
      ) {
        rows {
          id
          title
          author
          status
          updatedAt
          createdAt
        }
        total
      }
      statusCounts: templateCountByStatus(type: "Form") @include(if: $queryStatusCounts) {
        status
        count
      }
      selfCounts: templateCountBySelf(type: "Form", includeTrash: false) @include(if: $querySelfCounts)
    }
  ` as TypedQueryDocumentNode<
    {
      forms: Paged<PagedFormTemplateItem>;
      statusCounts?: TemplateStatusCountItem[];
      selfCounts?: number;
    },
    PagedFormTemplateArgs
  >,
  // 获取表单
  get: gql`
    query getForm($id: ID!, $metaKeys: [String!]) {
      form: formTemplate(id: $id) {
        id
        title
        schema
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
  ` as TypedQueryDocumentNode<{ form?: FormTempaleModel }, { id: number; metaKeys?: string[] }>,
  // 创建表单
  create: gql`
    mutation createForm($newFormTemplate: NewFormTemplateInput!) {
      form: createFormTemplate(model: $newFormTemplate) {
        id
        title
        schema
        author
        status
        updatedAt
        createdAt
        metas {
          id
          key: metaKey
          value: metaValue
        }
      }
    }
  ` as TypedMutationDocumentNode<{ form: FormTempaleModel }, { newFormTemplate: NewFormTemplateInput }>,
  // 修改表单
  update: gql`
    mutation updateForm($id: ID!, $updateForm: UpdateFormTemplateInput!) {
      result: updateFormTemplate(id: $id, model: $updateForm)
    }
  ` as TypedMutationDocumentNode<{ result: boolean }, { id: number; updateForm: UpdateFormTemplateInput }>,
});
