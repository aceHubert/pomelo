import { RAMAuthorizeContext } from './RAMAuthorizeContext';

/// <summary>
/// Define the ram policy evaluate methods.
/// </summary>
export interface IRAMAuthorizationEvaluator {
  /// <summary>
  /// Determines whether the authorization result was successful or not.
  /// </summary>
  /// <param name="authorizeContext"></param>
  /// <returns></returns>
  evaluateAsync(authorizeContext: RAMAuthorizeContext): Promise<boolean>;
}
