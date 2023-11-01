import { RequestUser } from '@pomelo/shared-server';

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
  isPermited(user: RequestUser, actionName: string): Promise<boolean>;
}
