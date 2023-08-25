import { ArgumentNullException } from './ArgumentNullException';
import { RAMPolicy } from './RAMPolicy';

export class RAMAuthorizeContext {
  /// <summary>
  /// The RAM policy to evaluate.
  /// </summary>
  readonly Policies: RAMPolicy[];

  /// <summary>
  /// The name of the authorize service.
  /// </summary>
  ServiceName: string;

  /// <summary>
  /// The target action name to evaluate.
  /// </summary>
  ActionName: string;

  /// <summary>
  /// Creates a new instance of <see cref="RAMAuthorizeContext"/>
  /// </summary>
  /// <param name="serviceName">The name of the authorize service.</param>
  /// <param name="actionName">The target action name to evaluate.</param>
  /// <param name="policies">The RAM policy to evaluate.</param>
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
