import { Field, InputType } from '@nestjs/graphql';
import { SignInValidator } from './signin.validator';

@InputType({ description: 'Sign in input' })
export class SignInInput extends SignInValidator {
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
