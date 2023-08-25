declare module 'esdk-obs-nodejs' {
  export type ObsClientCallbackName =
    | 'headBucket'
    | 'getBucketMetadata'
    | 'deleteBucket'
    | 'setBucketQuota'
    | 'getBucketQuota'
    | 'getBucketStorageInfo'
    | 'setBucketPolicy'
    | 'getBucketPolicy'
    | 'deleteBucketPolicy'
    | 'setBucketVersioningConfiguration'
    | 'getBucketVersioningConfiguration'
    | 'getBucketLocation'
    | 'listVersions'
    | 'listObjects'
    | 'setBucketLifecycleConfiguration'
    | 'getBucketLifecycleConfiguration'
    | 'deleteBucketLifecycleConfiguration'
    | 'setBucketAcl'
    | 'getBucketAcl'
    | 'setBucketLoggingConfiguration'
    | 'getBucketLoggingConfiguration'
    | 'setBucketWebsiteConfiguration'
    | 'getBucketWebsiteConfiguration'
    | 'deleteBucketWebsiteConfiguration'
    | 'setBucketNotification'
    | 'getBucketNotification'
    | 'setBucketTagging'
    | 'deleteBucketTagging'
    | 'getBucketTagging'
    | 'setBucketReplication'
    | 'deleteBucketReplication'
    | 'getBucketReplication'
    | 'getObject'
    | 'setObjectMetadata'
    | 'getObjectMetadata'
    | 'setObjectAcl'
    | 'getObjectAcl'
    | 'deleteObject'
    | 'deleteObjects'
    | 'listMultipartUploads'
    | 'listParts'
    | 'abortMultipartUpload'
    | 'completeMultipartUpload'
    | 'setBucketCors'
    | 'getBucketCors'
    | 'deleteBucketCors'
    | 'optionsBucket'
    | 'optionsObject'
    | 'setBucketStoragePolicy'
    | 'getBucketStoragePolicy'
    | 'getBucketEncryption'
    | 'setBucketEncryption'
    | 'deleteBucketEncryption'
    | 'getBucketDirectColdAccess'
    | 'setBucketDirectColdAccess'
    | 'deleteBucketDirectColdAccess'
    | 'renameObject'
    | 'getBucketRequesterPayment'
    | 'setBucketRequesterPayment';

  export type ObsClientResult<R extends Record<string, any> = any> = {
    InterfaceResult: {
      RequestId: string;
      Id2: string;
    } & R;
    CommonMsg: {
      Status: number;
      Code: string;
      Message: string;
      HostId: string;
      RequestId: string;
      Id2: string;
      Indicator: string;
    };
  };

  class ObsClient {
    constructor(options: {
      access_key_id?: string; // 配置AK
      secret_access_key?: string; // 配置SK
      server: string; // 配置服务地址
      max_retry_count?: number;
      timeout?: number;
      ssl_verify?: boolean;
      long_conn_param?: number;
    });

    createSignedUrlSync(options: {
      Method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
      Bucket?: string;
      Key?: string;
      SpecialParam?:
        | 'versions'
        | 'uploads'
        | 'location'
        | 'storageinfo'
        | 'quota'
        | 'storagePolicy'
        | 'acl'
        | 'append'
        | 'logging'
        | 'policy'
        | 'lifecycle'
        | 'website'
        | 'versioning'
        | 'cors'
        | 'notification'
        | 'tagging'
        | 'delete'
        | 'restore';
      Expires?: number;
      Headers?: Record<string, any>;
      QueryParams?: Record<string, any>;
    }): {
      SignedUrl: string;
      ActualSignedRequestHeaders: Record<string, any>;
    };

    createPostSignatureSync(options: {
      Bucket?: string;
      Key?: string;
      Expires?: number;
      FormParams?: Record<string, any>;
    }): {
      OriginPolicy: string;
      Policy: string;
      Signature: string;
    };

    [name: string]: (params: any) => Promise<ObsClientResult>;
  }

  export default ObsClient;
}
