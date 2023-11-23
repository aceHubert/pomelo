import { defineRegistApi, gql } from '../../graphql';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '../../graphql';
import type { PagedTemplateArgs, TemplateModel, NewTemplateInput, TemplateStatusCountItem } from '.';
import type { Paged } from '../types';

export interface PagedFormTemplateArgs extends Omit<PagedTemplateArgs, 'type' | 'categories'> {}

export interface FormTemplateModel
  extends Pick<TemplateModel, 'id' | 'title' | 'content' | 'author' | 'status' | 'updatedAt' | 'createdAt' | 'metas'> {}

export interface PagedFormTemplateItem extends Omit<FormTemplateModel, 'content' | 'metas'> {}

export interface NewFormTemplateInput extends Pick<NewTemplateInput, 'title' | 'content' | 'status' | 'metas'> {}

export interface UpdateFormTemplateInput extends Partial<Omit<NewFormTemplateInput, 'metas'>> {}

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
  // 创建表单
  create: gql`
    mutation createForm($newFormTemplate: NewFormTemplateInput! = {}) {
      form: createFormTemplate(model: $newFormTemplate) {
        id
        title
        content
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
  ` as TypedMutationDocumentNode<{ form: FormTemplateModel }, { newFormTemplate: NewFormTemplateInput }>,
  // 修改表单
  update: gql`
    mutation updateForm(
      $id: ID!
      $updateForm: UpdateFormTemplateInput!
      $submitAction: String!
      $submitSuccessRedirect: String!
      $submitSuccessTips: String!
      $featureImage: String!
    ) {
      result: updateFormTemplate(id: $id, model: $updateForm)
      submitActionResult: updateTemplateMetaByKey(
        templateId: $id
        metaKey: "submit.action"
        metaValue: $submitAction
        createIfNotExists: true
      )
      submitSuccessRedirectResult: updateTemplateMetaByKey(
        templateId: $id
        metaKey: "submit.success_redirect"
        metaValue: $submitSuccessRedirect
        createIfNotExists: true
      )
      submitSuccessTipsResult: updateTemplateMetaByKey(
        templateId: $id
        metaKey: "submit.success_tips"
        metaValue: $submitSuccessTips
        createIfNotExists: true
      )
      featureImageResult: updateTemplateMetaByKey(
        templateId: $id
        metaKey: "feature-image"
        metaValue: $featureImage
        createIfNotExists: true
      )
    }
  ` as TypedMutationDocumentNode<
    {
      result: boolean;
      submitActionResult: boolean;
      submitSuccessRedirectResult: boolean;
      submitSuccessTipsResult: boolean;
      featureImageResult: boolean;
    },
    {
      id: number;
      updateForm: UpdateFormTemplateInput;
      submitAction?: string;
      submitSuccessRedirect?: string;
      submitSuccessTips?: string;
      featureImage?: string;
    }
  >,
});
