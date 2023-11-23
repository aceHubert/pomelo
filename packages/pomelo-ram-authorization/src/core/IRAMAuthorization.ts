import { RequestUser } from '@ace-pomelo/shared-server';

/**
 * Authorization the user action.
 */
export interface IRAMAuthorization {
  /**
   * Determines whether the action permited by user.
   * @param user The user.
   * @param actionName The action name.
   */
  isPermited(user: RequestUser, actionName: string): Promise<boolean>;
}
