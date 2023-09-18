import { defineRegistApi, gql } from './core';

// Types
import type { Paged } from './types';

export interface FileData {
  fileName: string;
  path: string;
  fullPath: string;
  fileSize: number;
  width?: number;
  height?: number;
}

export interface ScaleImageFileData extends Omit<FileData, 'fileSize'> {}

export interface File {
  original: FileData;
  thumbnail?: ScaleImageFileData;
  scaled?: ScaleImageFileData;
  large?: ScaleImageFileData;
  medium?: ScaleImageFileData;
  mediumLarge?: ScaleImageFileData;
}

export interface PagedMediaArgs {
  keyword?: string;
  extensions?: string[];
  mimeTypes?: string[];
  offset?: number;
  limit?: number;
}

export interface Media extends Omit<File, 'original'>, FileData {
  id: number;
  originalFileName: string;
  extension: string;
  mimeType: string;
  createdAt: string;
}

export interface PagedMedia extends Paged<Media> {}

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from './core/request';

export const useResApi = defineRegistApi('resources', {
  uploadFile: gql`
    mutation uploadFile($file: Upload!) {
      file: uploadFile(file: $file) {
        id
        originalFileName
        fileName
        path
        fullPath
        fileSize
        width
        height
        extension
        mimeType
        createdAt
        thumbnail {
          fileName
          path
          fullPath
          width
          height
        }
        medium {
          fileName
          path
          fullPath
          width
          height
        }
        mediumLarge {
          fileName
          path
          fullPath
          width
          height
        }
        large {
          fileName
          path
          fullPath
          width
          height
        }
      }
    }
  ` as TypedMutationDocumentNode<{ file: Media }, { file: File }>,
  uploadFiles: gql`
    mutation uploadFiles($files: [Upload!]!) {
      files: uploadFiles(files: $files) {
        id
        originalFileName
        fileName
        path
        fullPath
        fileSize
        width
        height
        extension
        mimeType
        createdAt
        thumbnail {
          fileName
          path
          fullPath
          width
          height
        }
        medium {
          fileName
          path
          fullPath
          width
          height
        }
        mediumLarge {
          fileName
          path
          fullPath
          width
          height
        }
        large {
          fileName
          path
          fullPath
          width
          height
        }
      }
    }
  ` as TypedMutationDocumentNode<{ files: Media[] }, { files: File[] }>,
  getPaged: gql`
    query getMedias($offset: Int, $limit: Int, $keyword: String, $extensions: [String!], $mimeTypes: [String!]) {
      medias: medias(
        offset: $offset
        limit: $limit
        keyword: $keyword
        extensions: $extensions
        mimeTypes: $mimeTypes
      ) {
        rows {
          id
          originalFileName
          fileName
          path
          fullPath
          fileSize
          width
          height
          extension
          mimeType
          createdAt
          thumbnail {
            fileName
            path
            fullPath
            width
            height
          }
          medium {
            fileName
            path
            fullPath
            width
            height
          }
          mediumLarge {
            fileName
            path
            fullPath
            width
            height
          }
          large {
            fileName
            path
            fullPath
            width
            height
          }
        }
        total
      }
    }
  ` as TypedQueryDocumentNode<{ medias: PagedMedia }, PagedMediaArgs>,
  get: gql`
    query getMedia($id: ID!) {
      media(id: $id) {
        id
        originalFileName
        fileName
        path
        fullPath
        fileSize
        width
        height
        extension
        mimeType
        createdAt
        thumbnail {
          fileName
          path
          fullPath
          width
          height
        }
        medium {
          fileName
          path
          fullPath
          width
          height
        }
        mediumLarge {
          fileName
          path
          fullPath
          width
          height
        }
        large {
          fileName
          path
          fullPath
          width
          height
        }
      }
    }
  ` as TypedQueryDocumentNode<{ media: Media }, { id: number }>,

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
