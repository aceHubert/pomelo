/**
 * 默认资源前缀
 */
export const DEFAULT_RESOURCE_PREFIX = 'po';

/**
 * 构建资源前缀字符串
 * @param prefix 前缀，如 'po'
 * @returns 前缀字符串，如 'po:' 或空字符串
 */
export function buildPrefixString(prefix?: string): string {
  if (!prefix) return '';
  return `${prefix}:`;
}

/**
 * 匹配 Resource，支持通配符
 * 格式: <prefix>:<service-name>:<relative-id> 或 <service-name>:<relative-id>
 * 通配符: *, 如 "po:basic:*", "po:basic:user/*"
 *
 * @param pattern 策略中的 Resource 模式
 * @param resource 要检查的 Resource URN
 * @param prefix 资源前缀（默认 'po'）
 * @returns 是否匹配
 */
export function matchResource(pattern: string, resource: string, prefix: string = DEFAULT_RESOURCE_PREFIX): boolean {
  if (pattern === resource) return true;

  const prefixStr = buildPrefixString(prefix);
  const globalWildcards = ['*'];
  if (prefixStr) {
    globalWildcards.push(`${prefix}:*`, `${prefix}:*:*`);
  }

  if (globalWildcards.includes(pattern)) return true;

  // 处理末尾的 * 通配符（匹配任意字符包括 /）
  // 例如 po:basic:* 应该匹配 po:basic:user/123
  if (pattern.endsWith(':*')) {
    const patternPrefix = pattern.slice(0, -1); // 移除末尾的 *
    return resource.startsWith(patternPrefix);
  }

  // 处理路径中的 * 通配符（只匹配不包含 / 的部分）
  // 例如 po:basic:user/* 应该匹配 po:basic:user/123
  const regexPattern = pattern
    .replace(/\//g, '\\/')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');

  return new RegExp(`^${regexPattern}$`).test(resource);
}

/**
 * 检查 Resource 是否匹配任意一个模式
 *
 * @param patterns 策略中的 Resource 模式列表
 * @param resource 要检查的 Resource URN
 * @param prefix 资源前缀（默认 'po'）
 * @returns 是否匹配任意一个模式（空列表返回 true）
 */
export function matchAnyResource(
  patterns: string[] | undefined,
  resource: string,
  prefix: string = DEFAULT_RESOURCE_PREFIX,
): boolean {
  if (!patterns || patterns.length === 0) return true;
  return patterns.some((pattern) => matchResource(pattern, resource, prefix));
}

/**
 * 从资源模式中提取资源 ID
 *
 * @param patterns 策略中的 Resource 模式列表
 * @param serviceName 服务名称
 * @param resourceType 资源类型
 * @param prefix 资源前缀（默认 'po'）
 * @returns 提取的资源 ID 列表和是否包含通配符
 */
export function extractResourceIds(
  patterns: string[] | undefined,
  serviceName: string,
  resourceType: string,
  prefix: string = DEFAULT_RESOURCE_PREFIX,
): { ids: string[]; hasWildcard: boolean } {
  if (!patterns || patterns.length === 0) {
    return { ids: [], hasWildcard: false };
  }

  const prefixStr = buildPrefixString(prefix);
  const resourcePrefix = `${prefixStr}${serviceName}:${resourceType}/`;

  // 构建通配符模式列表
  const wildcardPatterns = [`${prefixStr}${serviceName}:${resourceType}/*`, `${prefixStr}${serviceName}:*`, '*'];
  if (prefixStr) {
    wildcardPatterns.push(`${prefix}:*`);
  }

  const ids: string[] = [];
  let hasWildcard = false;

  for (const pattern of patterns) {
    // 检查是否是通配符模式
    if (wildcardPatterns.includes(pattern) || pattern.includes('*')) {
      // 检查通配符是否适用于当前资源类型
      if (
        pattern === '*' ||
        (prefixStr && pattern === `${prefix}:*`) ||
        pattern === `${prefixStr}${serviceName}:*` ||
        pattern === `${prefixStr}${serviceName}:${resourceType}/*` ||
        (pattern.startsWith(`${prefixStr}${serviceName}:${resourceType}/`) && pattern.includes('*'))
      ) {
        hasWildcard = true;
      }
      continue;
    }

    // 提取具体的资源 ID
    if (pattern.startsWith(resourcePrefix)) {
      const id = pattern.slice(resourcePrefix.length);
      if (id) {
        ids.push(id);
      }
    }
  }

  return { ids, hasWildcard };
}

/**
 * 构建资源 URN
 *
 * @param serviceName 服务名称
 * @param resourceType 资源类型
 * @param resourceId 资源 ID
 * @param prefix 资源前缀（默认 'po'）
 * @returns 资源 URN
 */
export function buildResourceUrn(
  serviceName: string,
  resourceType: string,
  resourceId: string | number,
  prefix: string = DEFAULT_RESOURCE_PREFIX,
): string {
  const prefixStr = buildPrefixString(prefix);
  return `${prefixStr}${serviceName}:${resourceType}/${resourceId}`;
}
