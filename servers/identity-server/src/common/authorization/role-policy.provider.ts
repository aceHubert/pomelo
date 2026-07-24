import {
  AuthorizeEffect,
  IRamPolicyProvider,
  PolicySourceType,
  RAMPolicy,
  RAMStatement,
} from '@ace-nestjs/ram-authorization';
import { UserRole } from '@ace-pomelo/shared/server';

export interface UserAuthorizationSnapshot {
  role?: unknown;
  superAdministrator?: unknown;
}

export type UserAuthorizationLoader = (userId: number) => Promise<UserAuthorizationSnapshot>;

const MANAGEMENT_ROLES = new Set<UserRole>([
  UserRole.Administrator,
  UserRole.Editor,
  UserRole.Author,
  UserRole.Contributor,
]);

// TODO: 待共享包能够稳定引用 RAM 包后，与 infrastructure-bff 中的实现重新合并。
export class RolePolicyProvider implements IRamPolicyProvider {
  readonly sourceType = PolicySourceType.External;
  readonly priority = 10;

  constructor(private readonly loadAuthorization: UserAuthorizationLoader) {}

  async getPolicies(user: Record<string, any>): Promise<RAMPolicy[]> {
    const userId = Number(user.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) return [];

    const { role, superAdministrator } = await this.loadAuthorization(userId);
    const actions = this.getActions(role, superAdministrator);
    if (actions.length === 0) return [];

    const policy = new RAMPolicy('PresetRoleAccess');
    policy.Statements = [
      new RAMStatement({
        Effect: AuthorizeEffect.Allow,
        Action: actions,
        Resource: ['*'], // TODO: 将 capabilities 重构为 RAM Resource 后收紧。
      }),
    ];
    return [policy];
  }

  private getActions(roleValue: unknown, superAdministrator: unknown): string[] {
    if (this.isTrue(superAdministrator)) return ['basic:*', 'identity:*'];

    const role = roleValue as UserRole | undefined;
    if (role && MANAGEMENT_ROLES.has(role)) return ['basic:*'];
    if (role === UserRole.Subscriber) {
      return [
        'basic:taxonomy.category.list',
        'basic:taxonomy.tag.list',
        'basic:taxonomy.list',
        'basic:taxonomy.list.byobjectid',
      ];
    }
    return [];
  }

  private isTrue(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
  }
}
