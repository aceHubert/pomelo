/* eslint-disable no-var */

declare global {
  // Global variables on window, e.g. window._ENV
  // must declare with var
  // env inject
  var _ENV: Record<string, any>;

  /**
   * short alias for Record<string, T>
   */
  type Dictionary<T> = Record<string, T>;
  type ValueOf<T> = T[keyof T];
  /**
   * Type helper for making certain fields of an object optional.
   */
  type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
}

// 注意: 修改"全局声明"必须在模块内部, 所以至少要有 export{}字样
// 不然会报错❌: 全局范围的扩大仅可直接嵌套在外部模块中或环境模块声明中
export {};
