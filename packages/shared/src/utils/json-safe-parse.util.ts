/**
 * Safe json parse
 */
export function jsonSafeParse<V = any>(...args: Parameters<typeof JSON.parse>): V | undefined {
  let value: V;
  let isValid = false;
  try {
    value = JSON.parse(...args);
    isValid = true;
  } catch {}

  return isValid ? value! : undefined;
}
