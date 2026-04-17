import { buildResourceUrn, DEFAULT_RESOURCE_PREFIX } from '../utils/resource-matcher';
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
  readonly ServiceName: string;

  /**
   * The target action name to evaluate.
   */
  readonly ActionName: string;

  /**
   * The resource type (optional).
   */
  readonly ResourceType?: string;

  /**
   * The resource ID (optional).
   */
  readonly ResourceId?: string | number;

  /**
   * The resource prefix (default: 'po').
   */
  readonly ResourcePrefix: string;

  /**
   * Creates a new instance of <see cref="RAMAuthorizeContext"/>
   * @param serviceName The name of the authorize service.
   * @param actionName The target action name to evaluate.
   * @param policies The RAM policy to evaluate.
   * @param resourceType The resource type (optional).
   * @param resourceId The resource ID (optional).
   * @param resourcePrefix The resource prefix (default: 'po').
   */
  constructor(
    serviceName: string,
    actionName: string,
    policies: RAMPolicy[],
    resourceType?: string,
    resourceId?: string | number,
    resourcePrefix: string = DEFAULT_RESOURCE_PREFIX,
  ) {
    if (!serviceName) {
      throw new ArgumentNullException('serviceName');
    }

    if (!actionName) {
      throw new ArgumentNullException('actionName');
    }

    this.ServiceName = serviceName;
    this.ActionName = actionName;
    this.Policies = policies;
    this.ResourceType = resourceType;
    this.ResourceId = resourceId;
    this.ResourcePrefix = resourcePrefix;
  }

  /**
   * Get the full action name in format: <service-name>:<action-name>
   */
  get fullActionName(): string {
    return `${this.ServiceName}:${this.ActionName}`;
  }

  /**
   * Get the resource URN in format: <prefix>:<service-name>:<resource-type>/<resource-id>
   * Returns undefined if resourceType or resourceId is not set.
   */
  get resourceUrn(): string | undefined {
    if (!this.ResourceType || this.ResourceId === undefined) {
      return undefined;
    }
    return buildResourceUrn(this.ServiceName, this.ResourceType, this.ResourceId, this.ResourcePrefix);
  }
}
