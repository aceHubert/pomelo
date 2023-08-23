import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType({ description: 'Signed url modal' })
export class ObsUploadSignedUrlModel {
  @Field({ description: 'Signed url' })
  url!: string;

  @Field(() => GraphQLJSONObject, { description: 'Request headers' })
  headers!: Record<string, any>;
}

@ObjectType({ description: 'Post upload signature' })
export class ObsPostUploadSignatureModel {
  @Field({ description: 'Upload url' })
  url!: string;

  @Field({ description: 'OriginPolicy' })
  originPolicy!: string;

  @Field({ description: 'Policy' })
  policy!: string;

  @Field({ description: 'Signature' })
  signature!: string;
}
