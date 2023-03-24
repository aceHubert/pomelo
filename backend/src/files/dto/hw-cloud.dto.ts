import {
  ObsCreateUploadSignedUrlOptionsValiator,
  ObsCreatePostUploadSignatureOptionsValiator,
} from './hw-cloud.validator';

export class ObsCreateUploadSignedUrlOptionsDto extends ObsCreateUploadSignedUrlOptionsValiator {
  /**
   * Bucket name
   */
  bucket!: string;

  /**
   * Object name
   */
  key?: string;

  /**
   * Expires(unit: second), default: 300
   */
  expires?: number;

  /**
   * Request query params
   */
  queryParams?: Record<string, any>;

  /**
   * Request headers
   */
  headers?: Record<string, any>;
}

export class ObsCreatePostUploadSignatureOptionsDto extends ObsCreatePostUploadSignatureOptionsValiator {
  /**
   * Bucket name
   */
  bucket!: string;

  /**
   * Object name
   */
  key?: string;

  /**
   * Expires(unit: second), default: 300
   */
  expires?: number;

  /**
   * Request form params
   */
  formParams?: Record<string, any>;
}
