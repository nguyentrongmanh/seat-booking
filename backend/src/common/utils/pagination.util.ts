import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants/app.constants';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginationOptions(query: PaginationQuery): { skip: number; take: number } {
  const page = Math.max(DEFAULT_PAGE, query.page || DEFAULT_PAGE);
  const take = Math.min(query.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  return { skip: (page - 1) * take, take };
}

export function paginate<T>(data: T[], total: number, query: PaginationQuery): PaginatedResult<T> {
  const page = Math.max(DEFAULT_PAGE, query.page || DEFAULT_PAGE);
  const limit = Math.min(query.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
