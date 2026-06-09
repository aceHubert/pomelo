import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Current management user profile.' })
export class ManagementCurrentUser {
  @Field(() => Int)
  @ApiProperty({ description: 'User id.' })
  id!: number;

  @Field()
  @ApiProperty({ description: 'Login name.' })
  loginName!: string;

  @Field()
  @ApiProperty({ description: 'Nice name.' })
  niceName!: string;

  @Field()
  @ApiProperty({ description: 'Display name.' })
  displayName!: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Avatar URL or path.' })
  avatar?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Email.' })
  email?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'Mobile phone number.' })
  mobile?: string;

  @Field({ nullable: true })
  @ApiPropertyOptional({ description: 'User website URL.' })
  url?: string;
}
