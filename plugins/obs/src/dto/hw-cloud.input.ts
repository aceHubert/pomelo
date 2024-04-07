import { Field, ArgsType, Int } from '@nestjs/graphql';
import { JSONObjectResolver } from 'graphql-scalars';
import {
  ObsCreateUploadSignedUrlOptionsValiator,
  ObsCreatePostUploadSignatureOptionsValiator,
} from './hw-cloud.validator';

@ArgsType()
export class ObsCreateUploadSignedUrlOptionsArgs extends ObsCreateUploadSignedUrlOptionsValiator {
  /**
   * Bucket name
   */
  bucket!: string;

  /**
   * Object name
   */
  key?: string;

  /**
   * Expires(unit: second)
   */
  @Field(() => Int, { defaultValue: 300 })
  expires?: number;

  /**
   * Request query params
   */
  @Field(() => JSONObjectResolver)
  queryParams?: Record<string, any>;

  /**
   * Request headers
   */
  @Field(() => JSONObjectResolver)
  headers?: Record<string, any>;
}

@ArgsType()
export class ObsCreatePostUploadSignatureOptionsArgs extends ObsCreatePostUploadSignatureOptionsValiator {
  /**
   * Bucket name
   */
  bucket!: string;

  /**
   * Object name
   */
  key?: string;

  /**
   * Expires(unit: second)
   */
  @Field(() => Int, { defaultValue: 300 })
  expires?: number;

  /**
   * Request form params
   */
  @Field(() => JSONObjectResolver)
  formParams?: Record<string, any>;
}
