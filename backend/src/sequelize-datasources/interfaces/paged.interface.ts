export interface PagedArgs {
  /**
   * Offset
   * @default: 0
   */
  offset?: number;
  /**
   * Page size
   * @defaule 20
   */
  limit?: number;
}

export interface Paged<T> {
  /**
   * Records
   */
  rows: T[];
  /**
   *  Total row count
   */
  total: number;
}
