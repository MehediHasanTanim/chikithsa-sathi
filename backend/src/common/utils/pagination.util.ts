export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export type OffsetPagination = {
  page: number;
  limit: number;
  skip: number;
  take: number;
};

export function toOffsetPagination(page = 1, limit = DEFAULT_PAGE_SIZE): OffsetPagination {
  const normalizedPage = Math.max(1, Math.floor(page));
  const normalizedLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(limit)));
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
    take: normalizedLimit,
  };
}

export function offsetPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}
