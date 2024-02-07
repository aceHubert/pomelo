import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType({ description: 'Signed url modal' })
export class ObsUploadSignedUrlModel {
  /**
   * Signed url
   */
  url!: string;

  /**
   * Request headers
   */
  @Field(() => GraphQLJSONObject)
  headers!: Record<string, any>;
}

@ObjectType({ description: 'Post upload signature' })
export class ObsPostUploadSignatureModel {
  /**
   * Upload url
   */
  url!: string;

  /**
   * OriginPolicy
   */
  originPolicy!: string;

  /**
   * Policy
   */
  policy!: string;

  /**
   * Signature
   */
  signature!: string;
}
