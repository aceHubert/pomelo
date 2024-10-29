import { VerifyUserValidator } from './verify-user.validator';

export class VerifyUserDto extends VerifyUserValidator {
  /**
   * Username
   */
  username!: string;

  /**
   * Password, at least 6 characters
   */
  password!: string;
}
