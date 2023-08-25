import { JwtPayload } from 'jsonwebtoken';
import { ResponseSuccess, ResponseError } from '@pomelo/shared';

declare global {
  export type ConnectionParams = {
    token?: string;
    lang?: string;
  };

  export type PagedResponseSuccess<T> = ResponseSuccess<{
    rows: Array<T>;
    total: number;
  }>;

  export type ResponseOf<T extends Record<string, any>> = ResponseSuccess<T> | ResponseError;
  export type PagedResponseOf<T> = PagedResponseSuccess<T> | ResponseError;

  export type Dictionary<T> = Record<string, T>;
  /**
   * Type helper for making certain fields of an object optional.
   */
  // export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
}

declare module '@pomelo/shared' {
  export interface UserPayload extends JwtPayload {
    // extend the payload
    /**
     * Role
     */
    role: string;
  }
}

// 注意: 修改"全局声明"必须在模块内部, 所以至少要有 export{}字样
// 不然会报错❌: 全局范围的扩大仅可直接嵌套在外部模块中或环境模块声明中
export {};
