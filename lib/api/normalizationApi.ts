import { api } from "./axios";

export interface SalesRepFilters {
  page?: number;
  limit?: number;
  search?: string | null;
  sort_by?: "SalesPersonID" | "SalesPersonName" | "NormSalesPersonName" | "PY Revenue" | "Last Txn Date" | null;
  sort_order?: "asc" | "desc";
  sales_person_id?: string[] | null;
  sales_person_name?: string | null;
  norm_sales_person_name?: string | null;
  has_norm?: boolean | null;
  confidence_label?: string[] | null;
  py_revenue_min?: number | null;
  py_revenue_max?: number | null;
  last_txn_date_from?: string | null;
  last_txn_date_to?: string | null;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string | null;
  sort_by?: "CustomerID" | "CustomerName" | "NormCustomerName" | "PY Revenue" | "Last Txn Date" | null;
  sort_order?: "asc" | "desc";
  customer_id?: string[] | null;
  customer_name?: string | null;
  norm_customer_name?: string | null;
  has_norm?: boolean | null;
  confidence_label?: string[] | null;
  py_revenue_min?: number | null;
  py_revenue_max?: number | null;
  last_txn_date_from?: string | null;
  last_txn_date_to?: string | null;
}

export interface SalesRepRecord extends Record<string, unknown> {
  SalesPersonID: string;
  SalesPersonName: string;
  NormSalesPersonName: string | null;
}

export interface CustomerRecord extends Record<string, unknown> {
  CustomerID: string;
  CustomerName: string;
  NormCustomerName: string | null;
}

export interface RepAgencyFilters {
  page?: number;
  limit?: number;
  search?: string | null;
  sort_by?: string | null;
  sort_order?: "asc" | "desc";
  confidence_label?: string[] | null;
  rep_agency?: string | null;
  norm_rep_agency?: string | null;
  has_norm?: boolean | null;
  py_revenue_min?: number | null;
  py_revenue_max?: number | null;
  last_txn_date_from?: string | null;
  last_txn_date_to?: string | null;
}

export interface RepAgencyRecord extends Record<string, unknown> {
  RepAgency: string;
  NormRepAgency: string | null;
  NormRepAgencyConfidence: number | null;
  NormRepAgencyConfidenceLabel: string | null;
}

export interface PaginatedResponse<T> {
  status: boolean;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: T[];
}

export interface UpdateResponse {
  status: boolean;
  message: string;
  updated?: number;
}

export async function fetchSalesReps(
  filters: SalesRepFilters = {}
): Promise<PaginatedResponse<SalesRepRecord>> {
  const res = await api.post(`/crafteriq/normalization/salesrep`, {
    page: 1,
    limit: 100,
    sort_order: "asc",
    ...filters,
  });
  return res.data;
}

export async function fetchCustomers(
  filters: CustomerFilters = {}
): Promise<PaginatedResponse<CustomerRecord>> {
  const res = await api.post(`/crafteriq/normalization/customer`, {
    page: 1,
    limit: 100,
    sort_order: "asc",
    ...filters,
  });
  return res.data;
}

export async function updateSalesRepNorm(
  raw_name: string,
  norm_name: string
): Promise<UpdateResponse> {
  const res = await api.put(`/crafteriq/normalization/salesrep`, {
    items: [{ raw_name, norm_name }],
  });
  return res.data;
}

export async function bulkUpdateSalesRepNorm(
  items: Array<{ raw_name: string; norm_name: string }>
): Promise<UpdateResponse> {
  const res = await api.put(`/crafteriq/normalization/salesrep`, {
    items,
  });
  return res.data;
}

export async function updateCustomerNorm(
  raw_name: string,
  norm_name: string
): Promise<UpdateResponse> {
  const res = await api.put(`/crafteriq/normalization/customer`, {
    items: [{ raw_name, norm_name }],
  });
  return res.data;
}

export async function bulkUpdateCustomerNorm(
  items: Array<{ raw_name: string; norm_name: string }>
): Promise<UpdateResponse> {
  const res = await api.put(`/crafteriq/normalization/customer`, {
    items,
  });
  return res.data;
}

export async function fetchRepAgencies(
  filters: RepAgencyFilters = {}
): Promise<PaginatedResponse<RepAgencyRecord>> {
  const res = await api.post(`/crafteriq/normalization/repagency`, {
    page: 1,
    limit: 100,
    sort_order: "asc",
    ...filters,
  });
  return res.data;
}

export async function updateRepAgencyNorm(
  raw_name: string,
  norm_name: string
): Promise<UpdateResponse> {
  const res = await api.put(`/crafteriq/normalization/repagency`, {
    items: [{ raw_name, norm_name }],
  });
  return res.data;
}

export async function bulkUpdateRepAgencyNorm(
  items: Array<{ raw_name: string; norm_name: string }>
): Promise<UpdateResponse> {
  const res = await api.put(`/crafteriq/normalization/repagency`, {
    items,
  });
  return res.data;
}
