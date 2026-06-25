"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Loader2,
  Printer,
  Share2,
} from "lucide-react";
import { useUserId } from "@/hooks/use-user-id";
import {
  fetchBrief,
  normalizeBriefData,
  type BriefData,
  type BriefDisplayStat,
  type BriefChartSection,
  type BriefLegacyChart,
  type BriefSection,
  type BriefTimelineItem,
} from "@/lib/api/briefsApi";
import { Button } from "@/components/ui/button";
import { FilterableDataTable } from "@/components/report/filterable-data-table";
import { DonutChart } from "@/components/ui/donut-chart";
import { BarChart } from "@/components/ui/bar-chart";
import { HorizontalBarChart } from "@/components/ui/horizontal-bar-chart";

function EmptyChartMessage({ message }: { message: string }) {
  return (
    <p className="text-xs text-text-tertiary py-8 text-center">{message}</p>
  );
}

function hasPositiveValues(values: number[] | undefined): boolean {
  if (!values?.length) return false;
  return values.some((value) => Number.isFinite(value) && value > 0);
}

function getBadgeClass(badge: string) {
  const lower = badge.toLowerCase();
  if (lower.includes("active") || lower.includes("growing")) {
    return "bg-[#e6f5ef] text-[#1a8c5b]";
  }
  if (lower.includes("declining") || lower.includes("risk")) {
    return "bg-[#fef2f2] text-[#dc2626]";
  }
  return "bg-[#e8edfc] text-[#2d5be3]";
}

function getBriefTypeLabel(briefType: string) {
  switch (briefType) {
    case "business_unit":
      return "Business Unit Brief";
    case "project":
      return "Project Brief";
    case "project_manager":
      return "Project Manager Brief";
    default:
      return "Brief";
  }
}

function formatHeaderExtraKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isProgressDonut(section: BriefChartSection): boolean {
  const title = section.title.toLowerCase();
  return (
    title.includes("completion") ||
    title.includes("progress") ||
    (section.center_label != null && section.center_value != null)
  );
}

function StatCard({ stat }: { stat: BriefDisplayStat }) {
  const direction = stat.direction || stat.trend || "";
  const arrow =
    direction === "up" ? "↑" : direction === "down" ? "↓" : direction === "flat" ? "→" : "";
  const dirClass =
    direction === "up"
      ? "text-[#1a8c5b]"
      : direction === "down"
        ? "text-[#dc2626]"
        : "text-text-tertiary";

  return (
    <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-[11px] font-semibold tracking-[0.8px] uppercase text-text-tertiary mb-2">
        {stat.label}
      </div>
      <div className="text-[26px] font-bold text-text-primary tracking-tight leading-none mb-1.5">
        {stat.value}
      </div>
      {stat.change ? (
        <div className={`text-xs font-medium flex items-center gap-1 ${dirClass}`}>
          {arrow} {stat.change}
        </div>
      ) : null}
    </div>
  );
}

function BriefTableSection({ section }: { section: BriefChartSection }) {
  const columns = section.columns ?? [];
  const rows = section.data ?? [];

  return (
    <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm mb-5">
      <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
        {section.title}
      </div>
      {!columns.length ? (
        <EmptyChartMessage message="No data available" />
      ) : (
        <FilterableDataTable
          columns={columns}
          data={rows}
          sortable={section.sortable ?? true}
        />
      )}
    </div>
  );
}

function BriefTimelineSection({ items }: { items: BriefTimelineItem[] }) {
  return (
    <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
      <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
        Timeline
      </div>
      {items.length > 0 ? (
        <div className="flex flex-col gap-0">
          {items.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              className={`flex items-center justify-between gap-4 py-3 ${
                i < items.length - 1 ? "border-b border-border-subtle" : ""
              }`}
            >
              <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                {item.label}
              </span>
              <span
                className={`text-[13px] font-medium text-right ${
                  item.alert ? "text-[#dc2626]" : "text-text-primary"
                }`}
              >
                {item.value || "—"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyChartMessage message="No timeline data available" />
      )}
    </div>
  );
}

function BriefDonutSection({ section }: { section: BriefChartSection }) {
  const keepZeroSlices = isProgressDonut(section);

  const donutData = useMemo(
    () =>
      (section.labels ?? [])
        .map((label, i) => ({
          category: label,
          value: section.values?.[i] ?? 0,
        }))
        .filter((item) => keepZeroSlices || item.value > 0),
    [section.labels, section.values, keepZeroSlices]
  );

  const hasChartStructure = (section.labels?.length ?? 0) > 0;

  return (
    <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
      <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
        {section.title}
      </div>
      {hasChartStructure && donutData.length > 0 ? (
        <DonutChart
          data={donutData}
          height={200}
          innerRadius={55}
          showLegend
          isCurrency={false}
          centerLabel={section.center_label ?? undefined}
          centerValue={section.center_value ?? undefined}
        />
      ) : (
        <EmptyChartMessage message="No breakdown data" />
      )}
    </div>
  );
}

function BriefHorizontalBarSection({ section }: { section: BriefChartSection }) {
  const chartData = useMemo(() => {
    if (section.x?.length && section.y?.length) {
      return section.y.map((label, i) => ({
        category: String(label),
        value: Number(section.x?.[i] ?? 0),
      }));
    }
    return (section.labels ?? []).map((label, i) => ({
      category: label,
      value: section.values?.[i] ?? 0,
    }));
  }, [section]);

  const hasValues = chartData.some((item) => item.value > 0);

  return (
    <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm mb-5">
      <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
        {section.title}
      </div>
      {hasValues ? (
        <HorizontalBarChart
          data={chartData}
          height={180}
          xLabel={section.x_label}
          yLabel={section.y_label}
        />
      ) : (
        <EmptyChartMessage message="No product data available" />
      )}
    </div>
  );
}

function LegacyChartBlock({ chart }: { chart: BriefLegacyChart }) {
  const chartType = chart.type.toLowerCase();
  const isTable = chartType === "table";

  const chartData = useMemo(
    () =>
      (chart.labels ?? []).map((label, i) => ({
        category: label,
        value: chart.values?.[i] ?? 0,
      })),
    [chart.labels, chart.values]
  );

  const donutData = useMemo(
    () => chartData.filter((item) => item.value > 0),
    [chartData]
  );

  const isDonut = chartType === "donut" || chartType === "pie";
  const isHorizontal =
    chartType === "horizontal_bar" || chartType === "horizontal";
  const hasLabels = chartData.length > 0;
  const hasValues = hasPositiveValues(chart.values);

  if (isTable) {
    const tableData = chart.data as
      | {
          columns?: string[];
          rows?: Record<string, unknown>[];
          data?: Record<string, unknown>[];
          sortable?: boolean;
        }
      | undefined;
    const columns = tableData?.columns ?? [];
    const rows = tableData?.rows ?? tableData?.data ?? [];

    return (
      <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm mb-5">
        <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
          {chart.title}
        </div>
        {!columns.length ? (
          <EmptyChartMessage message="No data available" />
        ) : (
          <FilterableDataTable
            columns={columns}
            data={rows}
            sortable={tableData?.sortable ?? true}
          />
        )}
      </div>
    );
  }

  let emptyMessage = "No data available";
  if (isHorizontal) emptyMessage = "No product data available";
  if (isDonut) emptyMessage = "No breakdown data";

  const showEmptyMessage =
    !hasLabels || ((isDonut || isHorizontal) && !hasValues);

  return (
    <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
      <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
        {chart.title}
      </div>
      {showEmptyMessage ? (
        <EmptyChartMessage message={emptyMessage} />
      ) : isDonut ? (
        <DonutChart
          data={donutData}
          height={200}
          innerRadius={55}
          showLegend
          isCurrency={false}
        />
      ) : isHorizontal ? (
        <HorizontalBarChart data={chartData} height={180} />
      ) : (
        <BarChart data={chartData} height={180} />
      )}
    </div>
  );
}

function LegacySections({ sections }: { sections: BriefSection[] }) {
  const allCharts = useMemo(
    () => sections.flatMap((section) => section.charts ?? []),
    [sections]
  );

  const visualCharts = allCharts.filter(
    (chart) => chart.type.toLowerCase() !== "table"
  );
  const tableCharts = allCharts.filter(
    (chart) => chart.type.toLowerCase() === "table"
  );

  const rows: BriefLegacyChart[][] = [];
  for (let i = 0; i < visualCharts.length; i += 2) {
    rows.push(visualCharts.slice(i, i + 2));
  }

  return (
    <>
      {sections.map((section, i) =>
        section.content?.trim() ? (
          <div
            key={`${section.title}-${i}`}
            className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm mb-5"
          >
            <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
              {section.title}
            </div>
            <div className="prose prose-sm max-w-none prose-p:text-[13.5px] prose-p:text-text-primary prose-p:leading-[1.7] prose-p:font-light prose-li:text-text-secondary prose-strong:text-text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.content}
              </ReactMarkdown>
            </div>
          </div>
        ) : null
      )}
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-2 gap-5 mb-5">
          {row.map((chart, chartIndex) => (
            <LegacyChartBlock
              key={`${chart.title}-${rowIndex}-${chartIndex}`}
              chart={chart}
            />
          ))}
        </div>
      ))}
      {tableCharts.map((chart, i) => (
        <LegacyChartBlock key={`table-${chart.title}-${i}`} chart={chart} />
      ))}
    </>
  );
}

function BriefContent({
  data: rawData,
  entityName,
  conversationId,
}: {
  data: BriefData;
  entityName: string;
  conversationId: string | null;
}) {
  const view = useMemo(
    () => normalizeBriefData(rawData, entityName),
    [rawData, entityName]
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = view.title;
    const text = `${title}${view.subtitle ? ` — ${view.subtitle}` : ""}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }, [view.title, view.subtitle]);

  const backToChatHref = conversationId
    ? `/chat?conversation_id=${conversationId}`
    : "/chat";

  return (
    <div className="max-w-[1100px] mx-auto p-10 animate-[fadeUp_0.3s_ease] print:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <Link
          href={backToChatHref}
          className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to chat
        </Link>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs border-border-mid"
            onClick={handleShare}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs border-border-mid"
            onClick={handlePrint}
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8 pb-7 border-b-2 border-border-mid print:border-border-mid">
        <div>
          <div className="text-[11px] font-semibold tracking-[1.2px] uppercase text-text-primary mb-1.5">
            {getBriefTypeLabel(view.briefType)}
          </div>
          <h1 className="text-[30px] font-extrabold text-text-primary tracking-tight leading-[1.15]">
            {view.title}
            {view.subtitle ? (
              <>
                <br />
                <span className="font-bold text-[22px]">{view.subtitle}</span>
              </>
            ) : null}
          </h1>
        </div>
        <div className="text-right text-xs text-text-tertiary leading-[1.8] shrink-0">
          {view.entityName ? (
            <div>
              <span className="text-text-tertiary font-normal">Entity:</span>{" "}
              <strong className="text-text-primary font-extrabold">
                {view.entityName}
              </strong>
            </div>
          ) : null}
          {Object.entries(view.headerExtra).map(([key, val]) => (
            <div key={key}>
              <span className="text-text-tertiary font-normal">
                {formatHeaderExtraKey(key)}:
              </span>{" "}
              <strong className="text-text-primary font-extrabold">
                {String(val)}
              </strong>
            </div>
          ))}
          {view.statusBadge ? (
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${getBadgeClass(view.statusBadge)}`}
              >
                {view.statusBadge}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {(view.aiSummaryParagraph || view.aiSummaryInsights.length > 0) && (
        <div className="relative bg-linear-to-br from-[#f0f4ff] to-[#f8f0ff] border border-[#d4d8ff] rounded-xl p-5 px-6 mb-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-text-primary to-[#8b5cf6]" />
          <div className="text-[10px] font-bold tracking-[1px] uppercase text-text-primary mb-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-text-primary animate-pulse" />
            {view.aiSummaryTitle}
          </div>
          {view.aiSummaryParagraph ? (
            <p className="text-[13.5px] text-text-primary leading-[1.7] font-light">
              {view.aiSummaryParagraph}
            </p>
          ) : null}
          {view.aiSummaryInsights.length > 0 ? (
            <div className="mt-3 flex flex-col gap-1.5">
              {view.aiSummaryInsights.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-[13px] text-text-secondary"
                >
                  <span className="text-text-primary font-bold shrink-0 mt-px">
                    →
                  </span>
                  {insight}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {view.stats.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
          {view.stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      ) : null}

      {(() => {
        const showTimelineBesideDonut =
          view.timeline.length > 0 && view.donutCharts.length === 1;

        if (showTimelineBesideDonut) {
          return (
            <div className="grid grid-cols-2 gap-5 mb-5">
              <BriefDonutSection section={view.donutCharts[0]} />
              <BriefTimelineSection items={view.timeline} />
            </div>
          );
        }

        const donutRows: BriefChartSection[][] = [];
        for (let i = 0; i < view.donutCharts.length; i += 2) {
          donutRows.push(view.donutCharts.slice(i, i + 2));
        }

        return (
          <>
            {donutRows.map((row, rowIndex) => (
              <div key={`donuts-${rowIndex}`} className="grid grid-cols-2 gap-5 mb-5">
                {row.map((section) => (
                  <BriefDonutSection key={section.title} section={section} />
                ))}
              </div>
            ))}
            {view.timeline.length > 0 ? (
              <div className="mb-5">
                <BriefTimelineSection items={view.timeline} />
              </div>
            ) : null}
          </>
        );
      })()}

      {view.horizontalBarCharts.map((section) => (
        <BriefHorizontalBarSection key={section.title} section={section} />
      ))}

      {view.tableSections.map((section) => (
        <BriefTableSection key={section.title} section={section} />
      ))}

      {view.legacySections.length > 0 ? (
        <LegacySections sections={view.legacySections} />
      ) : null}

      <div className="mt-10 pt-5 border-t border-border-mid flex items-center justify-between">
        <div className="text-xs font-bold text-text-tertiary">
          Powered by <span className="text-text-primary">CrafterIQ</span>
        </div>
        <div className="text-[11px] text-text-tertiary">For internal use</div>
      </div>
    </div>
  );
}

function BriefPageInner() {
  const searchParams = useSearchParams();
  const { userId } = useUserId();
  const briefId = searchParams.get("id");
  const conversationIdFromUrl = searchParams.get("conversation_id");

  const { data, isLoading, error } = useQuery({
    queryKey: ["brief", briefId, userId],
    queryFn: () => fetchBrief(briefId!, userId!),
    enabled: !!briefId && !!userId,
  });

  const conversationId =
    conversationIdFromUrl ?? data?.brief?.conversation_id ?? null;

  if (!briefId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-2">No brief ID provided</p>
          <Link href="/chat" className="text-xs text-text-primary underline">
            Back to chat
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto bg-page scrollbar-hide">
        <div className="max-w-[1100px] mx-auto p-10 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary mb-4" />
          <p className="text-sm text-text-tertiary">Loading brief…</p>
        </div>
      </div>
    );
  }

  if (error || !data?.status || !data.brief?.brief_data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-2">Failed to load brief</p>
          <p className="text-xs text-text-tertiary mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Link
            href={
              conversationId
                ? `/chat?conversation_id=${conversationId}`
                : "/chat"
            }
            className="text-xs text-text-primary underline"
          >
            Back to chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-page scrollbar-hide">
      <BriefContent
        data={data.brief.brief_data}
        entityName={data.brief.entity_name}
        conversationId={conversationId}
      />
    </div>
  );
}

export default function BriefPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full overflow-y-auto bg-page scrollbar-hide">
          <div className="max-w-[1100px] mx-auto p-10 flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="h-6 w-6 animate-spin text-text-tertiary mb-4" />
            <p className="text-sm text-text-tertiary">Loading brief…</p>
          </div>
        </div>
      }
    >
      <BriefPageInner />
    </Suspense>
  );
}
