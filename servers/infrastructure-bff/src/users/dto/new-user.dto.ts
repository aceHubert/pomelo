import { UserRole } from '@ace-pomelo/shared/server';
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
  firstName?: string;

  /**
   * Last name
   */
  lastName?: string;

  /**
   * Avator
   */
  avator?: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Admin color
   */
  adminColor?: string;

  /**
   * User role
   */
  capabilities?: UserRole;

  /**
   * Locale
   * @default Site Default
   */
  locale?: string;

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
