/**
 * Authorization the user action.
 */
export interface IRAMAuthorization<User> {
  /**
   * Determines whether the action permited by user.
   * @param user The user.
   * @param actionName The action name.
   */
  isPermited(user: User, actionName: string): Promise<boolean>;
}
