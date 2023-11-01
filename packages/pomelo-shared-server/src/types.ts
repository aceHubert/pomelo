// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserPayload {
  /**
   * User id.
   */
  sub?: string;

  [key: string]: any;
}

export type RequestUser = UserPayload & {
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
