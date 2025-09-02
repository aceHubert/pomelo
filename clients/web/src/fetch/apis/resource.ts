import { defineRegistGraphql, gql } from '@ace-fetch/graphql-vue';

// Types
import type { TypedQueryDocumentNode, TypedMutationDocumentNode } from '@ace-fetch/graphql';
import type { PagedArgs, Paged } from './types';

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

export interface ImageCropOptions {
  left: number;
  top: number;
  width: number;
  height: number;
  replace?: boolean;
}

export interface FileUploadOptions {
  fileName?: string;
  crop?: ImageCropOptions;
}

export interface PagedMediaArgs extends PagedArgs {
  keyword?: string;
  extensions?: string[];
  mimeTypes?: string[];
}

export interface Media extends Omit<File, 'original'>, FileData {
  id: number;
  originalFileName: string;
  extension: string;
  mimeType: string;
  createdAt: string;
}

export interface PagedMedia extends Paged<Media> {}

export const useResApi = defineRegistGraphql('resource', {
  definition: {
    uploadFile: gql`
      mutation uploadFile($file: Upload!, $options: FileUploadOptionsInput) {
        file: uploadFile(file: $file, options: $options) {
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
    ` as TypedMutationDocumentNode<{ file: Media }, { file: File; options?: FileUploadOptions }>,
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
    cropImage: gql`
      mutation cropImage($id: ID!, $options: ImageCropOptionsInput!) {
        image: cropImage(id: $id, options: $options) {
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
    ` as TypedMutationDocumentNode<{ image: Media }, { id: number; options: ImageCropOptions }>,
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
    ` as TypedQueryDocumentNode<{ media: Media | null }, { id: number }>,
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
  },
});
