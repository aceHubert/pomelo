export function normalizePagedQuery<T extends { offset?: number; limit?: number }>(query: T): T {
  return {
    ...query,
    offset: query.offset === undefined ? 0 : Number(query.offset),
    limit: query.limit === undefined ? 20 : Number(query.limit),
  };
}
