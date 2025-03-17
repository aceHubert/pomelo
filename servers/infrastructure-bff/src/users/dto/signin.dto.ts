import { SignInValidator } from './signin.validator';

export class VerifyUserDto extends SignInValidator {
  /**
   * Username
   */
  username!: string;

  /**
   * Password, at least 6 characters
   */
  password!: string;
}
