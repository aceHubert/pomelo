import { defineRegistApi, gql } from './core';

// Types
import type { TypedQueryDocumentNode } from './core/request';

export const useResApi = defineRegistApi('resources', {
  getObsUploadSignedUrl: gql`
    query gethwCloudObsUploadSignedUrl(
      $bucket: String!
      $key: String
      $expires: Int
      $queryParams: JSONObject
      $headers: JSONObject
    ) {
      signedUrl: hwCloudObsUploadSignedUrl(
        bucket: $bucket
        key: $key
        expires: $expires
        queryParams: $queryParams
        headers: $headers
      ) {
        url
        headers
      }
    }
  ` as TypedQueryDocumentNode<
    { signedUrl: { url: string; headers: Record<string, any> } },
    {
      bucket: string;
      key?: string;
      expires?: number;
      queryParams?: Record<string, any>;
      headers?: Record<string, any>;
    }
  >,
  getObsPostUploadSignature: gql`
    query gethwCloudObsPostUploadSignature($bucket: String!, $key: String, $expires: Int) {
      signature: hwCloudObsPostUploadSignature(bucket: $bucket, key: $key, expires: $expires) {
        url
        policy
        signature
      }
    }
  ` as TypedQueryDocumentNode<
    { signature: { url: string; policy: string; signature: string } },
    {
      bucket: string;
      key?: string;
      expires?: number;
    }
  >,
});
