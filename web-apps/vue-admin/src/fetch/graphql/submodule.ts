import { defineRegistApi, gql } from './core';
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from './core/request';
import type { Paged } from './types';

export interface Version {
  version: string;
  createAt: string;
}

export interface Tag {
  name: string;
  version: string;
}

export interface PagedSubModuleQuery {
  name?: string;
  offset?: number;
  limit?: number;
}

export interface PagedSubModuleItem {
  name: string;
  description: string;
}

export interface SubModuleItem extends PagedSubModuleItem {
  versions: Version[];
  tags: Tag[];
  readme: string;
}

export const useSubmoduleApi = defineRegistApi('submodule', {
  // 获取模块列表（分页）
  getPaged: gql`
    query getSubModules($name: String, $offset: Int, $limit: Int) {
      unpkgSubModules(name: $name, offset: $offset, limit: $limit) {
        rows {
          name
          description
        }
        total
      }
    }
  ` as TypedQueryDocumentNode<
    {
      subModules: Paged<{
        name: string;
        description: string;
      }>;
    },
    PagedSubModuleQuery
  >,
  // 获取模块详情
  get: gql`
    query getSubModule($name: String!) {
      unpkgSubModule(name: $name) {
        name
        description
        versions {
          version
          createdAt
        }
        tags {
          name
          version
        }
        readme
      }
    }
  ` as TypedMutationDocumentNode<{ subModule: SubModuleItem }, { name: string }>,
});
