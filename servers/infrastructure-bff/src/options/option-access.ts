import { OptionPresetKeys, RequestUser, UserRole } from '@ace-pomelo/shared/server';

const RoleWeights: Record<Exclude<UserRole, UserRole.None>, number> = {
  [UserRole.Subscriber]: 1,
  [UserRole.Contributor]: 2,
  [UserRole.Author]: 3,
  [UserRole.Editor]: 4,
  [UserRole.Administrator]: 5,
};

type ProtectedUserRole = keyof typeof RoleWeights;

const OptionPresetKeySet = new Set<string>(Object.values(OptionPresetKeys));

const PublicOptionPresetKeys = new Set<OptionPresetKeys>([
  OptionPresetKeys.SiteUrl,
  OptionPresetKeys.Home,
  OptionPresetKeys.BlogName,
  OptionPresetKeys.BlogDescription,
  OptionPresetKeys.BlogCharset,
  OptionPresetKeys.SiteIcon,
]);

export function isOptionPresetKey(optionName: string): optionName is OptionPresetKeys {
  return OptionPresetKeySet.has(optionName);
}

export function getOptionPresetKeyMinRole(optionName: string): ProtectedUserRole | undefined {
  if (!isOptionPresetKey(optionName) || PublicOptionPresetKeys.has(optionName)) {
    return undefined;
  }

  return UserRole.Administrator;
}

export function getRequestUserRole(requestUser?: RequestUser): UserRole {
  const role = requestUser?.role ?? requestUser?.capabilities;

  return Object.values(UserRole).includes(role) ? role : UserRole.None;
}

export function canAccessOptionPresetKey(optionName: string, requestUser?: RequestUser): boolean {
  if (!isOptionPresetKey(optionName) || PublicOptionPresetKeys.has(optionName)) {
    return true;
  }

  const minRole = getOptionPresetKeyMinRole(optionName)!;
  const userRole = getRequestUserRole(requestUser);

  if (userRole === UserRole.None) {
    return false;
  }

  return RoleWeights[userRole] >= RoleWeights[minRole];
}

export function filterAccessibleOptionNames<T extends { optionName: string }>(
  options: T[],
  requestUser?: RequestUser,
): T[] {
  return options.filter(({ optionName }) => canAccessOptionPresetKey(optionName, requestUser));
}

export function filterAccessibleOptionValues<T extends Record<string, string>>(
  options: T,
  requestUser?: RequestUser,
): T {
  return Object.entries(options).reduce((prev, [optionName, optionValue]) => {
    if (canAccessOptionPresetKey(optionName, requestUser)) {
      prev[optionName as keyof T] = optionValue as T[keyof T];
    }

    return prev;
  }, {} as T);
}
