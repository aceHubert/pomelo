declare module '@ace-pomelo/shared-server' {
  export interface AccountClaims {
    // extend the payload
    /**
     * Role
     */
    role?: string;
  }
}

// 注意: 修改"全局声明"必须在模块内部, 所以至少要有 export{}字样
// 不然会报错❌: 全局范围的扩大仅可直接嵌套在外部模块中或环境模块声明中
export {};
