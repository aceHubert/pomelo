import { User } from '../types';

/// <summary>
/// Authorization the user action.
/// </summary>
export interface IRAMAuthorization {
  /// <summary>
  /// Determines whether the action permited by user.
  /// </summary>
  /// <param name="user">The user.</param>
  /// <param name="actionName">The action name.</param>
  /// <returns></returns>
  isPermited(user: User, actionName: string): Promise<boolean>;
}
