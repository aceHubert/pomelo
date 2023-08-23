declare global {
  export type JwtPayload = {
    /*
     * (issuer)：签发人
     */
    iss?: string;
    /*
     *  (expiration time)：过期时间
     */
    exp?: number;
    /*
     * (Not Before)：生效时间
     */
    nbf?: number;
    /*
     *  (Issued At)：签发时间
     */
    iat?: number;
    /*
     * (JWT ID)：编号
     */
    jti?: string;
    /*
     * (subject)：主题
     */
    sub?: string;
    /*
     * (audience)：受众
     */
    aud?: string[];
    /*
     * (scope) 授权范围
     */
    scope?: string[];
    /**
     * (enterprise id) 企业id
     */
    eid?: string;
    /*
     * (role) 角色权限
     */
    role?: string | string[];
    /*
     * (ram) 授权策略
     */
    ram?: string[];
  };

  export type RequestUser = JwtPayload & {
    lang?: string;
  };

  export type ConnectionParams = {
    token?: string;
    lang?: string;
  };

  export type ResponseError = {
    success: false;
    statusCode?: number;
    message: string;
  };

  export type ResponseSuccess<T extends Record<string, any>> = {
    success: true;
  } & T;

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
  export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
}

// 注意: 修改"全局声明"必须在模块内部, 所以至少要有 export{}字样
// 不然会报错❌: 全局范围的扩大仅可直接嵌套在外部模块中或环境模块声明中
export {};
