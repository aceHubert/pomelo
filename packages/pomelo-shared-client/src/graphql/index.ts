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

export * from './request';
export { default as codes } from './codes.json';
export { uploadFetch, createUploadFetch } from './upload-fetch';
export { gql } from '@apollo/client/core';
