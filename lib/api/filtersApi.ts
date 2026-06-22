export interface FilterDimension {
  success: boolean;
  dimension: string;
  display: string;
  column: string;
  values: (string | number)[];
  total: number;
}

export interface FiltersResponse {
  status: boolean;
  success: boolean;
  dimensions: Record<string, FilterDimension>;
  dimension_count: number;
}

// Legacy ClickHouse filter APIs — disabled until Insmed filter endpoints are available.
// export async function fetchFilters(
//   search: string,
//   limit: number = 50
// ): Promise<FiltersResponse> {
//   const params = new URLSearchParams({ search, limit: String(limit) });
//   const res = await api.get(`/crafteriq/clickhouse/filters?${params}`, {
//     headers: { accept: "application/json" },
//   });
//   return res.data;
// }

/** Metadata for each filterable dimension (board filter UI) */
export interface DimensionMeta {
  key: string;
  display: string;
  column: string;
}

export interface DimensionsListResponse {
  status: boolean;
  dimensions: DimensionMeta[];
  count: number;
}

// Legacy ClickHouse dimensions API — disabled per product request.
// export async function fetchDimensions(): Promise<DimensionsListResponse> {
//   const res = await api.get(`/crafteriq/clickhouse/dimensions`, {
//     headers: { accept: "application/json" },
//   });
//   return res.data;
// }

/** Single-dimension filter values (e.g. /filters/brand?search=a&limit=10) */
export interface SingleDimensionFiltersResponse {
  status: boolean;
  success: boolean;
  dimension: string;
  display: string;
  column: string;
  values: (string | number)[];
  total: number;
}

// Legacy ClickHouse per-dimension filter API — disabled until Insmed filter endpoints are available.
// export async function fetchFiltersByDimension(
//   dimensionKey: string,
//   search: string,
//   limit: number = 15
// ): Promise<SingleDimensionFiltersResponse> {
//   const params = new URLSearchParams({ search, limit: String(limit) });
//   const res = await api.get(
//     `/crafteriq/clickhouse/filters/${encodeURIComponent(dimensionKey)}?${params}`,
//     {
//       headers: { accept: "application/json" },
//     }
//   );
//   return res.data;
// }
