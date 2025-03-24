export type NonAbstract<T> = { [P in keyof T]: T[P] };
/**
 * Type helper for making certain fields of an object optional.
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
