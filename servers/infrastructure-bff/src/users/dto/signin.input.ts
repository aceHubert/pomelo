import { InputType } from '@nestjs/graphql';
import { SignInValidator } from './signin.validator';

@InputType({ description: 'User sign in input' })
export class SignInInput extends SignInValidator {
  /**
   * Username
   */
  username!: string;

  /**
   * Password, at least 6 characters
   */
  password!: string;
}
