import { ArgumentNullException } from './ArgumentNullException';
import { RAMPolicy } from './RAMPolicy';

export class RAMAuthorizeContext {
  /**
   * The RAM policy to evaluate.
   */
  readonly Policies: RAMPolicy[];

  /**
   * The name of the authorize service.
   */
  ServiceName: string;

  /**
   * The target action name to evaluate.
   */
  ActionName: string;

  /**
   * Creates a new instance of <see cref="RAMAuthorizeContext"/>
   * @param serviceName The name of the authorize service.
   * @param actionName The target action name to evaluate.
   * @param policies The RAM policy to evaluate.
   */
  constructor(serviceName: string, actionName: string, policies: RAMPolicy[]) {
    if (!serviceName) {
      throw new ArgumentNullException('serviceName');
    }

    if (!actionName) {
      throw new ArgumentNullException('actionName');
    }

    this.ServiceName = serviceName;
    this.ActionName = actionName;
    this.Policies = policies;
  }
}
