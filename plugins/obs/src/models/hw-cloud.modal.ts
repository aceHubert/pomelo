import { Field, ObjectType } from '@nestjs/graphql';
import { JSONObjectResolver } from 'graphql-scalars';

@ObjectType({ description: 'Signed url modal' })
export class ObsUploadSignedUrlModel {
  /**
   * Signed url
   */
  url!: string;

  /**
   * Request headers
   */
  @Field(() => JSONObjectResolver)
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
