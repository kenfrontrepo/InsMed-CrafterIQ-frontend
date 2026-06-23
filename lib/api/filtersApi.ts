import { api } from "./axios";

/** GET /insmed/filters/all */
export interface FilterDimensionValues {
  status: boolean;
  dimension: string;
  display: string;
  column: string;
  values: (string | number)[];
  total: number;
}

export interface FiltersResponse {
  status: boolean;
  dimensions: Record<string, FilterDimensionValues>;
}

export async function fetchFilters(
  search: string,
  limit: number = 50
): Promise<FiltersResponse> {
  const params = new URLSearchParams({ search, limit: String(limit) });
  const res = await api.get<FiltersResponse>(`/insmed/filters/all?${params}`);
  return res.data;
}

/** GET /insmed/filters/dimensions */
export interface DimensionMeta {
  key: string;
  display: string;
  column: string;
}

export interface DimensionsListResponse {
  status: boolean;
  dimensions: DimensionMeta[];
  total: number;
}

export async function fetchDimensions(): Promise<DimensionsListResponse> {
  const res = await api.get<DimensionsListResponse>("/insmed/filters/dimensions");
  return res.data;
}

/** GET /insmed/filters/{dimension} */
export interface SingleDimensionFiltersResponse {
  status: boolean;
  dimension: string;
  display: string;
  column: string;
  values: (string | number)[];
  total: number;
}

export async function fetchFiltersByDimension(
  dimensionKey: string,
  search: string,
  limit: number = 50
): Promise<SingleDimensionFiltersResponse> {
  const params = new URLSearchParams({ search, limit: String(limit) });
  const res = await api.get<SingleDimensionFiltersResponse>(
    `/insmed/filters/${encodeURIComponent(dimensionKey)}?${params}`
  );
  return res.data;
}
