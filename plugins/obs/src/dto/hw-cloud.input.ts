import { Field, ArgsType, Int } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
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
  @Field(() => GraphQLJSONObject)
  queryParams?: Record<string, any>;

  /**
   * Request headers
   */
  @Field(() => GraphQLJSONObject)
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
  @Field(() => GraphQLJSONObject)
  formParams?: Record<string, any>;
}
