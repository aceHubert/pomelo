import { get } from 'lodash-es';

/**
 * 从对象中获取值
 * @param key key from obj
 * @param defaultValue default value
 * @param obj object, 默认值： process.env
 */
export const getEnv = <R = any>(key: string, defaultValue: R, obj: object = process.env): R => {
  return get(obj || {}, key, defaultValue);
};
