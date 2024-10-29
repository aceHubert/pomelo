import { Field, InputType } from '@nestjs/graphql';
import { VerifyUserValidator } from './verify-user.validator';

@InputType({ description: 'Verify user input' })
export class VerifyUserInput extends VerifyUserValidator {
  /**
   * Username
   */
  @Field(() => String)
  username!: string;

  /**
   * Password, at least 6 characters
   */
  @Field(() => String)
  password!: string;
}
