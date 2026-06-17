import { api } from "./axios";

export interface ReportStat {
  label: string;
  value: string;
  raw_value: number;
  change?: string;
  direction: "up" | "down" | "flat";
}

export interface ReportHeader {
  title: string;
  subtitle: string;
  period: string;
  status_badge: string;
  extra?: Record<string, string>;
}

export interface ReportAISummary {
  title: string;
  paragraph: string;
  insights: string[];
}

export interface ReportChartSection {
  chart_type: string;
  title: string;
  x?: (string | number)[];
  y?: (string | number)[];
  x_label?: string;
  y_label?: string;
  columns?: string[];
  data?: Record<string, unknown>[];
  labels?: string[];
  values?: number[];
  center_label?: string;
  center_value?: number;
  sortable?: boolean;
  note?: string;
}

export interface ReportActivity {
  title: string;
  subtitle: string;
  icon: string;
}

export interface ReportData {
  report_type: string;
  header: ReportHeader;
  ai_summary: ReportAISummary;
  stats: ReportStat[];
  monthly_trend: ReportChartSection;
  product_mix?: ReportChartSection;
  customer_portfolio?: ReportChartSection;
  customer_breakdown?: ReportChartSection;
  order_history?: ReportChartSection;
  yoy_revenue?: ReportChartSection;
  recent_activity?: ReportActivity[];
  relationship_timeline?: ReportActivity[];
  report_id: string;
}

export interface ReportResponse {
  status: boolean;
  report: ReportData;
}

export async function fetchReport(
  reportId: string,
  userId: string
): Promise<ReportResponse> {
  const res = await api.get(`/crafteriq/reports/${reportId}/${userId}`);
  return res.data;
}
