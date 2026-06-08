import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType({ description: 'Management bearer token response' })
export class ManagementTokenResponse {
  /**
   * Bearer JWT access token.
   */
  @Field(() => String)
  @ApiProperty({ description: 'Bearer JWT access token.' })
  accessToken!: string;

  /**
   * Token type.
   */
  @Field(() => String)
  @ApiProperty({ default: 'Bearer', description: 'Token type.' })
  tokenType!: 'Bearer';

  /**
   * Expiration value configured by MANAGEMENT_JWT_EXPIRES_IN.
   */
  @Field(() => String)
  @ApiProperty({ description: 'Expiration value configured by MANAGEMENT_JWT_EXPIRES_IN.' })
  expiresIn!: string | number;

  /**
   * Token issued timestamp in seconds.
   */
  @Field(() => Int)
  @ApiProperty({ description: 'Token issued timestamp in seconds.' })
  issuedAt!: number;
}
