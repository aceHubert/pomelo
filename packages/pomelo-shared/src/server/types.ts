// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AccountClaims {
  /**
   * User id.
   */
  sub: string;

  [key: string]: any;
}

export type RequestUser = AccountClaims & {
  /**
   * Request language.
   */
  lang?: string;
};

/**
 * Response success schema.
 */
export type ResponseSuccess<T extends Record<string, any>> = {
  success: true;
} & T;

/**
 * Response error schema.
 */
export type ResponseError = {
  success: false;
  statusCode?: number;
  message: string;
};

/**
 * Response schema.
 */
export type ResponseOf<T extends Record<string, any>> = ResponseSuccess<T> | ResponseError;

/**
 * Paged response success schema.
 */
export type PagedResponseSuccess<T> = ResponseSuccess<{
  rows: Array<T>;
  total: number;
}>;

/**
 * Paged response schema.
 */
export type PagedResponseOf<T> = PagedResponseSuccess<T> | ResponseError;
