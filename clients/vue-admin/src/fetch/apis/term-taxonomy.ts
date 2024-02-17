import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '../graphql/infrastructure-request';
// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-pomelo/shared-client';

export enum PresetTaxonomy {
  Category = 'Category',
  Tag = 'Tag',
}

export type TermTaxonomyModel = {
  id: string;
  name: string;
  slug: string;
  taxonomy: PresetTaxonomy | string;
  description: string;
  parentId: string;
  group: number;
  count: number;
};

export type TermRelationshipModel = {
  objectId: string;
  termTaxonomyId: string;
  order: number;
};

export type NewTermTaxonomyInput = {
  name: string;
  slug?: string;
  taxonomy: string;
  description: string;
  parentId?: string;
  group?: number;
  objectId?: number;
};

export type NewTermRelationshipInput = {
  objectId: string;
  termTaxonomyId: string;
  order?: number;
};

export const useTermTaxonomyApi = defineRegistApi('term-taxonomy', {
  apis: {
    get: gql`
      query getTermTaxonomies($taxonomy: String!, $keyword: String, $parentId: ID, $group: Int) {
        termTaxonomies(taxonomy: $taxonomy, keyword: $keyword, group: $group, parentId: $parentId) {
          id
          name
          slug
          description
          parentId
          count
          group
        }
      }
    ` as TypedQueryDocumentNode<
      { termTaxonomies: Omit<TermTaxonomyModel, 'taxonomy'>[] },
      { taxonomy: string; keyword?: string; group?: number; parentId?: number }
    >,
    getCategories: gql`
      query getCategoryTermTaxonomies(
        $keyword: String
        $parentId: ID
        $group: Int
        $objectId: ID! = 0
        $includeDefault: Boolean! = false
        $withMine: Boolean! = false
      ) {
        categories: categoryTermTaxonomies(
          keyword: $keyword
          group: $group
          parentId: $parentId
          includeDefault: $includeDefault
        ) {
          id
          name
          slug
          description
          parentId
          count
          group
        }
        myCategories: termTaxonomiesByObjectId(objectId: $objectId, taxonomy: "Category") @include(if: $withMine) {
          id
          name
        }
      }
    ` as TypedQueryDocumentNode<
      { categories: Omit<TermTaxonomyModel, 'taxonomy'>[]; myCategories?: Pick<TermTaxonomyModel, 'id' | 'name'>[] },
      | { keyword?: string; group?: number; parentId?: string }
      | {
          keyword?: string;
          group?: number;
          parentId?: string;
          objectId: string;
          includeDefault?: boolean;
          withMine?: true;
        }
    >,
    getTags: gql`
      query getTagTermTaxonomies($keyword: String, $group: Int, $objectId: ID! = 0, $withMine: Boolean! = false) {
        tags: tagTermTaxonomies(keyword: $keyword, group: $group) {
          id
          name
          slug
          description
          parentId
          count
          group
        }
        myTags: termTaxonomiesByObjectId(objectId: $objectId, taxonomy: "Category") @include(if: $withMine) {
          id
          name
        }
      }
    ` as TypedQueryDocumentNode<
      { tags: Omit<TermTaxonomyModel, 'taxonomy'>[]; myTags?: Pick<TermTaxonomyModel, 'id' | 'name'>[] },
      { keyword?: string; group?: number } | { keyword?: string; group?: number; objectId: string; withMine: true }
    >,
    create: gql`
      mutation createTerm($model: NewTermTaxonomyInput!) {
        term: createTermTaxonomy(model: $model) {
          id
          name
          slug
          taxonomy
          description
          parentId
          group
          count
        }
      }
    ` as TypedMutationDocumentNode<{ term: TermTaxonomyModel }, { model: NewTermTaxonomyInput }>,
    createRelationship: gql`
      mutation createRelationship($model: NewTermRelationshipInput!) {
        relationship: createTermRelationship(model: $model) {
          objectId
          termTaxonomyId
          order
        }
      }
    ` as TypedMutationDocumentNode<{ relationship: TermRelationshipModel }, { model: NewTermRelationshipInput }>,
    deleteRelationship: gql`
      mutation deleteRelationship($objectId: ID!, $termTaxonomyId: ID!) {
        result: deleteTermRelationship(objectId: $objectId, termTaxonomyId: $termTaxonomyId)
      }
    ` as TypedMutationDocumentNode<{ result: Boolean }, { objectId: string; termTaxonomyId: string }>,
  },
  request,
});
