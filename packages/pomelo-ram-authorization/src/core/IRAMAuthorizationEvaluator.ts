import { RAMAuthorizeContext } from './RAMAuthorizeContext';

/**
 * Define the ram policy evaluate methods.
 */
export interface IRAMAuthorizationEvaluator {
  /**
   * Determines whether the authorization result was successful or not.
   * @param authorizeContext The authorize context.
   */
  evaluateAsync(authorizeContext: RAMAuthorizeContext): Promise<boolean>;
}
