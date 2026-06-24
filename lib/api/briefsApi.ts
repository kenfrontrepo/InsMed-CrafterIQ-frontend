import { api } from "./axios";

export type BriefTrend = "up" | "down" | "flat" | "";

export interface BriefDisplayStat {
  label: string;
  value: string;
  change?: string;
  direction?: BriefTrend;
  trend?: BriefTrend;
}

export interface BriefChartSection {
  chart_type: string;
  title: string;
  labels?: string[];
  values?: number[];
  x?: (string | number)[];
  y?: (string | number)[];
  x_label?: string;
  y_label?: string;
  center_label?: string | null;
  center_value?: number | null;
  columns?: string[];
  data?: Record<string, unknown>[];
  sortable?: boolean;
}

export interface BriefHeader {
  title: string;
  subtitle: string;
  entity_type?: string;
  status_badge?: string;
  extra?: Record<string, string>;
}

export interface BriefAISummary {
  title?: string;
  paragraph?: string;
  insights?: string[];
}

/** Legacy section-based brief shape */
export interface BriefLegacyChart {
  type: string;
  title: string;
  labels?: string[];
  values?: number[];
  data?: unknown;
}

export interface BriefSection {
  title: string;
  content: string;
  charts?: BriefLegacyChart[];
}

/** Report-style brief (current Insmed API) */
export interface BriefReportData {
  brief_type: string;
  header: BriefHeader;
  ai_summary?: BriefAISummary;
  stats?: BriefDisplayStat[];
  status_distribution?: BriefChartSection;
  health_distribution?: BriefChartSection;
  budget_by_project?: BriefChartSection;
  projects_list?: BriefChartSection;
  brief_id?: string;
}

/** Legacy brief shape from earlier Insmed API */
export interface BriefLegacyData {
  brief_type: string;
  entity_name?: string;
  title?: string;
  subtitle?: string;
  executive_summary?: string;
  key_insights?: string[];
  stats?: BriefDisplayStat[];
  sections?: BriefSection[];
  brief_id?: string;
}

export type BriefData = BriefReportData | BriefLegacyData;

export interface BriefViewModel {
  briefType: string;
  entityName: string;
  title: string;
  subtitle: string;
  statusBadge?: string;
  headerExtra: Record<string, string>;
  aiSummaryTitle: string;
  aiSummaryParagraph?: string;
  aiSummaryInsights: string[];
  stats: BriefDisplayStat[];
  donutCharts: BriefChartSection[];
  horizontalBarCharts: BriefChartSection[];
  tableSections: BriefChartSection[];
  legacySections: BriefSection[];
}

export function isReportStyleBrief(data: BriefData): data is BriefReportData {
  return "header" in data && data.header != null;
}

export function normalizeBriefData(
  data: BriefData,
  entityName = ""
): BriefViewModel {
  if (isReportStyleBrief(data)) {
    const donutCharts = [data.status_distribution, data.health_distribution].filter(
      (chart): chart is BriefChartSection => Boolean(chart)
    );
    const horizontalBarCharts = [data.budget_by_project].filter(
      (chart): chart is BriefChartSection => Boolean(chart)
    );
    const tableSections = [data.projects_list].filter(
      (chart): chart is BriefChartSection => Boolean(chart)
    );

    return {
      briefType: data.brief_type,
      entityName,
      title: data.header.title,
      subtitle: data.header.subtitle,
      statusBadge: data.header.status_badge,
      headerExtra: data.header.extra ?? {},
      aiSummaryTitle: data.ai_summary?.title ?? "CrafterIQ Analysis",
      aiSummaryParagraph: data.ai_summary?.paragraph,
      aiSummaryInsights: data.ai_summary?.insights ?? [],
      stats: data.stats ?? [],
      donutCharts,
      horizontalBarCharts,
      tableSections,
      legacySections: [],
    };
  }

  return {
    briefType: data.brief_type,
    entityName: data.entity_name ?? entityName,
    title: data.title ?? "",
    subtitle: data.subtitle ?? "",
    statusBadge: undefined,
    headerExtra: {},
    aiSummaryTitle: "CrafterIQ Analysis",
    aiSummaryParagraph: data.executive_summary,
    aiSummaryInsights: data.key_insights ?? [],
    stats: data.stats ?? [],
    donutCharts: [],
    horizontalBarCharts: [],
    tableSections: [],
    legacySections: (data.sections ?? []).map((section) => ({
      ...section,
      charts: section.charts ?? [],
    })),
  };
}

export interface SavedBrief {
  id: string;
  user_id: string;
  brief_type: string;
  entity_name: string;
  summary: string;
  conversation_id: string | null;
  message_id: string | null;
  created_at: string;
  brief_data: BriefData;
}

export interface BriefResponse {
  status: boolean;
  brief?: SavedBrief;
  error?: string;
}

export interface BriefHistoryItem {
  id: string;
  brief_type: string;
  entity_name: string;
  title: string;
  created_at: string;
}

export interface BriefHistoryResponse {
  status: boolean;
  briefs?: BriefHistoryItem[];
  total?: number;
  error?: string;
}

/** GET /insmed/briefs/{BriefId}/{UserId} */
export async function fetchBrief(
  briefId: string,
  userId: string
): Promise<BriefResponse> {
  const res = await api.get(`/insmed/briefs/${briefId}/${userId}`);
  return res.data;
}

/** GET /insmed/briefs/history/{UserId} */
export async function fetchBriefHistory(
  userId: string
): Promise<BriefHistoryResponse> {
  const res = await api.get(`/insmed/briefs/history/${userId}`);
  return res.data;
}
