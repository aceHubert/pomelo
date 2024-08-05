import { defineRegistApi, gql } from '@ace-pomelo/shared-client';
import { request } from '@/fetch/graphql/infrastructure-request';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-pomelo/shared-client';
import type { PagedArgs, Paged } from '@/fetch/apis/types';

export interface Version {
  version: string;
  createAt: string;
}

export interface Tag {
  name: string;
  version: string;
}

export interface PagedSubModuleArgs extends PagedArgs {
  name?: string;
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
  apis: {
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
      PagedSubModuleArgs
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
    ` as TypedMutationDocumentNode<{ subModule: SubModuleItem | null }, { name: string }>,
  },
  request,
});
