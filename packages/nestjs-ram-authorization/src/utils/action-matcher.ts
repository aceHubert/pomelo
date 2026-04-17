/**
 * 匹配 Action，支持通配符
 * 格式: <service-name>:<action-name>
 * 通配符: *, 如 "basic:*", "basic:user.*", "*:*"
 *
 * @param pattern 策略中的 Action 模式
 * @param action 要检查的 Action
 * @returns 是否匹配
 */
export function matchAction(pattern: string, action: string): boolean {
  if (pattern === action) return true;
  if (pattern === '*' || pattern === '*:*') return true;

  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^:]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');

  return new RegExp(`^${regexPattern}$`).test(action);
}

/**
 * 检查 Action 是否匹配任意一个模式
 *
 * @param patterns 策略中的 Action 模式列表
 * @param action 要检查的 Action
 * @returns 是否匹配任意一个模式
 */
export function matchAnyAction(patterns: string[], action: string): boolean {
  return patterns.some((pattern) => matchAction(pattern, action));
}
