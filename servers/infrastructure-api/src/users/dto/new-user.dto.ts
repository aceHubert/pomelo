import { UserRole } from '../enums/user-role.enum';
import { NewUserValidator } from './new-user.validator';

export class NewUserDto extends NewUserValidator {
  /**
   * Login name
   */
  loginName!: string;

  /**
   * Login password
   */
  loginPwd!: string;

  /**
   * First name
   */
  firstName?: string | undefined;

  /**
   * Last name
   */
  lastName?: string | undefined;

  /**
   * Avator
   */
  avator?: string | undefined;

  /**
   * Description
   */
  description?: string | undefined;

  /**
   * Admin color
   */
  adminColor?: string | undefined;

  /**
   * User role
   */
  capabilities?: UserRole | undefined;

  /**
   * Locale
   * @default Site Default
   */
  locale?: string | undefined;

  /**
   * Email
   */
  email!: string;

  /**
   * Mobile
   */
  mobile!: string;

  /**
   * Client Url
   */
  url!: string;
}
