import { Injectable, Inject } from '@nestjs/common';
import ObsClient from 'esdk-obs-nodejs';
import { ObsCommonError } from './errors/ObsCommonError';
import { FILE_OPTIONS } from './constants';

// Types
import { Readable } from 'stream';
import { ObsFileOptions } from './interfaces/file-options.interface';

@Injectable()
export class HWCloudObsService {
  // private readonly logger = new Logger(FileService.name, { timestamp: true });
  private _obsClient: ObsClient | null = null;

  constructor(@Inject(FILE_OPTIONS) private readonly options: ObsFileOptions) {}

  get obsClient() {
    return (
      this._obsClient ||
      (this._obsClient = new ObsClient({
        access_key_id: this.options.accessKey,
        secret_access_key: this.options.secretKey,
        server: this.options.endpoint,
        max_retry_count: this.options.maxRetryCount,
        timeout: this.options.timeout,
        ssl_verify: this.options.sslVerify,
        long_conn_param: this.options.longConnParam,
      }))
    );
  }

  /**
   * 获取桶的存量信息，包含桶的空间大小以及对象个数。
   */
  async getBucketStorageInfo(bucket: string): Promise<{ size: number; objectNumber: number }> {
    const { InterfaceResult, CommonMsg } = await this.obsClient.getBucketStorageInfo({
      Bucket: bucket,
    });

    if (CommonMsg.Status < 300) {
      const { Size, ObjectNumber } = InterfaceResult;
      return {
        size: Size,
        objectNumber: ObjectNumber,
      };
    } else {
      throw new ObsCommonError(CommonMsg.Message, CommonMsg.Code);
    }
  }

  /**
   * 列举桶内对象，默认返回最大1000个对象。
   */
  async listObjects(options: {
    bucket: string;
    prefix?: string;
    marker?: string;
    maxKeys?: number;
    delimiter?: string;
  }): Promise<{
    objects: Array<{ id: string; key: string; size: number; ownerId: string; lastModified: string; type: string }>;
    prefixes?: string[];
    nextMarker: string;
  }> {
    const { InterfaceResult, CommonMsg } = await this.obsClient.listObjects({
      Bucket: options.bucket,
      Prefix: options.prefix,
      Marker: options.marker,
      MaxKeys: options.maxKeys,
      Delimiter: options.delimiter,
    });

    if (CommonMsg.Status < 300) {
      const { NextMarker, Contents, CommonPrefixes = [] } = InterfaceResult;
      return {
        objects: Contents.map((item: any) => ({
          id: item.ETag,
          key: item.Key,
          size: item.Size,
          ownerId: item.Owner?.ID,
          lastModified: item.LastModified,
          type: item.Type,
        })),
        prefixes: CommonPrefixes.map((item: any) => item.Prefix),
        nextMarker: NextMarker,
      };
    } else {
      throw new ObsCommonError(CommonMsg.Message, CommonMsg.Code);
    }
  }

  /**
   * 获取指定桶中的对象。
   */
  async getObject(option: { bucket: string; key: string }): Promise<{
    id: string;
    content: string | Readable;
    contentType: string;
    lastModified: string;
    metadata: Record<string, any>;
  }> {
    const { InterfaceResult, CommonMsg } = await this.obsClient.getObject({
      Bucket: option.bucket,
      Key: option.key,
    });

    if (CommonMsg.Status < 300) {
      const { ETag, Content, ContentType, LastModified, Metadata } = InterfaceResult;
      return {
        id: ETag,
        content: Content,
        contentType: ContentType,
        lastModified: LastModified,
        metadata: Metadata,
      };
    } else {
      throw new ObsCommonError(CommonMsg.Message, CommonMsg.Code);
    }
  }

  /**
   * 获取PUT上传签名信息
   */
  createUploadSignedUrl(options: {
    bucket: string;
    key?: string;
    expires?: number;
    headers?: Record<string, any>;
    queryParams?: Record<string, any>;
  }): { url: string; headers: Record<string, any> } {
    const { SignedUrl, ActualSignedRequestHeaders } = this.obsClient.createSignedUrlSync({
      Method: 'PUT',
      Bucket: options.bucket,
      Key: options.key,
      Expires: options.expires,
      Headers: options.headers,
      QueryParams: options.queryParams,
    });

    return {
      url: SignedUrl,
      headers: ActualSignedRequestHeaders,
    };
  }

  /**
   * 获取POST上传签名信息
   */
  createPostUploadSignature(options: {
    bucket: string;
    key?: string;
    expires?: number;
    formParams?: Record<string, any>;
  }) {
    const { OriginPolicy, Policy, Signature } = this.obsClient.createPostSignatureSync({
      Bucket: options.bucket,
      Key: options.key,
      Expires: options.expires,
      FormParams: options.formParams,
    });

    return {
      url: `https://${options.bucket}.${this.options.endpoint}`,
      originPolicy: OriginPolicy,
      policy: Policy,
      signature: Signature,
    };
  }
}
