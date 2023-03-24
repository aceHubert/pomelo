import { Field, ArgsType, Int } from '@nestjs/graphql';
import {
  ObsCreateUploadSignedUrlOptionsValiator,
  ObsCreatePostUploadSignatureOptionsValiator,
} from './hw-cloud.validator';
import { GraphQLJSONObject } from 'graphql-type-json';

@ArgsType()
export class ObsCreateUploadSignedUrlOptionsArgs extends ObsCreateUploadSignedUrlOptionsValiator {
  @Field({ description: 'Bucket name' })
  bucket!: string;

  @Field({ nullable: true, description: 'Object name' })
  key?: string;

  @Field(() => Int, { nullable: true, description: 'Expires(unit: second), default: 300' })
  expires?: number;

  @Field(() => GraphQLJSONObject, { nullable: true, description: 'Request query params' })
  queryParams?: Record<string, any>;

  @Field(() => GraphQLJSONObject, { nullable: true, description: 'Request headers' })
  headers?: Record<string, any>;
}

@ArgsType()
export class ObsCreatePostUploadSignatureOptionsArgs extends ObsCreatePostUploadSignatureOptionsValiator {
  @Field({ description: 'Bucket name' })
  bucket!: string;

  @Field({ nullable: true, description: 'Object name' })
  key?: string;

  @Field(() => Int, { nullable: true, description: 'Expires(unit: second), default: 300' })
  expires?: number;

  @Field(() => GraphQLJSONObject, { nullable: true, description: 'Request form params' })
  formParams?: Record<string, any>;
}
