import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

@InputType({ description: 'Management login input' })
export class ManagementLoginInput {
  /**
   * Account login name, email or phone number.
   */
  @Field(() => String)
  @ApiProperty({ description: 'Account login name, email or phone number.' })
  @IsString()
  @MinLength(1)
  username!: string;

  /**
   * Account password.
   */
  @Field(() => String)
  @ApiProperty({ description: 'Account password.' })
  @IsString()
  @MinLength(1)
  password!: string;
}
