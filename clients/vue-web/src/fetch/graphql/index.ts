import { gql } from '@apollo/client/core';

// Types
import type { Request, RegistApiDefinition, RegistApi } from './request';

const cache = new Map();
export const defineRegistApi = <C extends RegistApiDefinition>(
  id: string,
  {
    apis,
    request,
  }: {
    apis: C;
    request: Request;
  },
) => {
  function useRegistApi() {
    if (!cache.has(id)) {
      cache.set(id, request.regist(apis));
    }
    return cache.get(id);
  }

  return useRegistApi as () => RegistApi<C>;
};

export { gql };
export { default as codes } from './codes.json';
export { TypedQueryDocumentNode, TypedMutationDocumentNode, TypedSubscriptionDocumentNode } from './request';
