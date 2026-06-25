"use client";

import { Suspense, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useUserId } from "@/hooks/use-user-id";
import {
  fetchReport,
  type ReportData,
  type ReportStat,
  type ReportChartSection,
  type ReportActivity,
} from "@/lib/api/reportsApi";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Trophy,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Printer,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterableDataTable } from "@/components/report/filterable-data-table";
import { BarChart } from "@/components/ui/bar-chart";
import { HorizontalBarChart } from "@/components/ui/horizontal-bar-chart";
import { DonutChart } from "@/components/ui/donut-chart";

function StatCard({ stat }: { stat: ReportStat }) {
  const arrow = stat.direction === "up" ? "↑" : stat.direction === "down" ? "↓" : "→";
  const dirClass =
    stat.direction === "up"
      ? "text-[#1a8c5b]"
      : stat.direction === "down"
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
      {stat.change && (
        <div className={`text-xs font-medium flex items-center gap-1 ${dirClass}`}>
          {arrow} {stat.change}
        </div>
      )}
    </div>
  );
}

function ReportTable({ section }: { section: ReportChartSection }) {
  if (!section.columns?.length) {
    return (
      <p className="text-xs text-text-tertiary py-4 text-center">
        No data available
      </p>
    );
  }

  return (
    <FilterableDataTable
      columns={section.columns}
      data={section.data ?? []}
      sortable={section.sortable ?? true}
    />
  );
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  lightbulb: Lightbulb,
  trending_up: TrendingUp,
  warning: AlertTriangle,
};

function ActivityCard({ title, items }: { title: string; items: ReportActivity[] }) {
  return (
    <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
      <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
        {title}
      </div>
      <div className="flex flex-col">
        {items.map((activity, i) => {
          const IconComp = ACTIVITY_ICONS[activity.icon] || Lightbulb;
          return (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-b-0">
              <div className="w-8 h-8 rounded-lg bg-hover flex items-center justify-center shrink-0">
                <IconComp className="h-4 w-4 text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-text-primary">{activity.title}</div>
                <div className="text-[11px] text-text-tertiary">{activity.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getBadgeClass(badge: string) {
  const lower = badge.toLowerCase();
  if (lower.includes("active") || lower.includes("growing")) return "bg-[#e6f5ef] text-[#1a8c5b]";
  if (lower.includes("declining") || lower.includes("risk")) return "bg-[#fef2f2] text-[#dc2626]";
  return "bg-[#e8edfc] text-[#2d5be3]";
}

function ReportContent({ report }: { report: ReportData }) {
  const { header, ai_summary, stats, monthly_trend } = report;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = header.title;
    const text = `${title}${header.period ? ` — ${header.period}` : ""}`;
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
  }, [header.title, header.period]);

  const trendChartData = useMemo(() => {
    if (!monthly_trend?.x) return [];
    return (monthly_trend.x as string[]).map((label, i) => ({
      category: label,
      value: (monthly_trend.y as number[])?.[i] ?? 0,
    }));
  }, [monthly_trend]);

  const productMixData = useMemo(() => {
    if (!report.product_mix?.x || !report.product_mix?.y) return [];
    const xArr = report.product_mix.x as number[];
    const yArr = report.product_mix.y as string[];
    return yArr.map((label, i) => ({
      category: label,
      value: xArr[i] ?? 0,
    }));
  }, [report.product_mix]);

  const donutData = useMemo(() => {
    const bd = report.customer_breakdown;
    if (!bd?.labels || !bd?.values) return [];
    return bd.labels.map((label, i) => ({
      category: label,
      value: bd.values![i] ?? 0,
    })).filter((d) => d.value > 0);
  }, [report.customer_breakdown]);

  const yoyData = useMemo(() => {
    if (!report.yoy_revenue?.x || !report.yoy_revenue?.y) return [];
    const xArr = report.yoy_revenue.x as number[];
    const yArr = report.yoy_revenue.y as string[];
    return yArr.map((label, i) => ({
      category: label,
      value: xArr[i] ?? 0,
    }));
  }, [report.yoy_revenue]);

  return (
    <div className="max-w-[1100px] mx-auto p-10 animate-[fadeUp_0.3s_ease] print:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <Link href="/chat" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors">
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

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 pb-7 border-b-2 border-border-mid print:border-border-mid">
        <div>
          <div className="text-[11px] font-semibold tracking-[1.2px] uppercase text-text-primary mb-1.5">
            {report.report_type === "rep" ? "Rep Performance Report" : "Customer Report"}
          </div>
          <h1 className="text-[30px] font-extrabold text-text-primary tracking-tight leading-[1.15]">
            {header.title}
            {header.subtitle && <><br /><span className="font-bold text-[22px]">{header.subtitle}</span></>}
          </h1>
        </div>
        <div className="text-right text-xs text-text-tertiary leading-[1.8] shrink-0">
          {header.extra && Object.entries(header.extra).map(([key, val]) => (
            <div key={key}>
              <span className="text-text-tertiary font-normal">{key}:</span>{" "}
              <strong className="text-text-primary font-extrabold">{String(val)}</strong>
            </div>
          ))}
          {/* <div><strong className="text-text-secondary font-medium">Period</strong> {header.period}</div> */}
          {header.status_badge && (
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${getBadgeClass(header.status_badge)}`}>
                {header.status_badge}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {ai_summary && (
        <div className="relative bg-linear-to-br from-[#f0f4ff] to-[#f8f0ff] border border-[#d4d8ff] rounded-xl p-5 px-6 mb-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-text-primary to-[#8b5cf6]" />
          <div className="text-[10px] font-bold tracking-[1px] uppercase text-text-primary mb-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-text-primary animate-pulse" />
            {ai_summary.title || "CrafterIQ Analysis"}
          </div>
          <p className="text-[13.5px] text-text-primary leading-[1.7] font-light">
            {ai_summary.paragraph}
          </p>
          {ai_summary.insights?.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {ai_summary.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-[13px] text-text-secondary">
                  <span className="text-text-primary font-bold shrink-0 mt-px">→</span>
                  {insight}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {stats?.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-7">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      )}

      {/* Monthly Trend + Product Mix */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {monthly_trend?.x && (
          <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
            <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
              {monthly_trend.title || "Monthly Revenue"}
            </div>
            <BarChart
              data={trendChartData}
              height={180}
              xLabel={monthly_trend.x_label}
              yLabel={monthly_trend.y_label}
            />
          </div>
        )}

        {report.product_mix && (
          <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
            <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
              {report.product_mix.title || "Revenue by Product Category"}
            </div>
            {productMixData.length > 0 ? (
              <HorizontalBarChart
                data={productMixData}
                height={180}
                xLabel={report.product_mix.x_label}
                yLabel={report.product_mix.y_label}
              />
            ) : (
              <p className="text-xs text-text-tertiary py-8 text-center">No product data available</p>
            )}
          </div>
        )}
      </div>

      {/* Customer Portfolio (rep report) */}
      {report.customer_portfolio && (
        <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-bold text-text-primary tracking-[0.3px]">
              {report.customer_portfolio.title}
            </div>
            {report.customer_portfolio.note && (
              <span className="text-[11px] text-text-tertiary">{report.customer_portfolio.note}</span>
            )}
          </div>
          <ReportTable section={report.customer_portfolio} />
        </div>
      )}

      {/* Order History */}
      {report.order_history && (
        <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm mb-5">
          <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
            {report.order_history.title}
          </div>
          <ReportTable section={report.order_history} />
        </div>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Customer Breakdown (rep report) */}
        {report.customer_breakdown && (
          <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
            <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
              {report.customer_breakdown.title || "Customer Breakdown"}
            </div>
            {donutData.length > 0 ? (
              <DonutChart
                data={donutData}
                height={200}
                innerRadius={55}
                showLegend={true}
                centerLabel={report.customer_breakdown.center_label || "Total"}
                centerValue={report.customer_breakdown.center_value ?? 0}
              />
            ) : (
              <p className="text-xs text-text-tertiary py-8 text-center">No breakdown data</p>
            )}
          </div>
        )}

        {/* YoY Revenue (customer report) */}
        {report.yoy_revenue && (
          <div className="bg-card border border-border-subtle rounded-xl p-5 shadow-sm">
            <div className="text-[13px] font-bold text-text-primary tracking-[0.3px] mb-4">
              {report.yoy_revenue.title || "Year-over-Year Revenue"}
            </div>
            {yoyData.length > 0 ? (
              <HorizontalBarChart
                data={yoyData}
                height={180}
                xLabel={report.yoy_revenue.x_label}
                yLabel={report.yoy_revenue.y_label}
              />
            ) : (
              <p className="text-xs text-text-tertiary py-8 text-center">No YoY data</p>
            )}
          </div>
        )}

        {/* Recent Activity (customer report) */}
        {report.recent_activity && report.recent_activity.length > 0 && (
          <ActivityCard title="Recent Activity" items={report.recent_activity} />
        )}

        {report.relationship_timeline && report.relationship_timeline.length > 0 && (
          <ActivityCard title="Relationship Timeline" items={report.relationship_timeline} />
        )}
      </div>

      {/* Footer */}
      <div className="mt-10 pt-5 border-t border-border-mid flex items-center justify-between">
        <div className="text-xs font-bold text-text-tertiary">
          Powered by <span className="text-text-primary">CrafterIQ</span>
        </div>
        <div className="text-[11px] text-text-tertiary">
          For internal use
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportPageContent />
    </Suspense>
  );
}

function ReportPageContent() {
  const searchParams = useSearchParams();
  const { userId } = useUserId();
  const reportId = searchParams.get("id");

  const { data, isLoading, error } = useQuery({
    queryKey: ["report", reportId, userId],
    queryFn: () => fetchReport(reportId!, userId!),
    enabled: !!reportId && !!userId,
  });

  if (!reportId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-2">No report ID provided</p>
          <Link href="/chat" className="text-xs text-text-primary underline">Back to chat</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-[1100px] mx-auto p-10 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-text-tertiary mb-4" />
          <p className="text-sm text-text-tertiary">Loading report…</p>
        </div>
      </div>
    );
  }

  if (error || !data?.report) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary text-sm mb-2">Failed to load report</p>
          <p className="text-xs text-text-tertiary mb-4">{error instanceof Error ? error.message : "Unknown error"}</p>
          <Link href="/chat" className="text-xs text-text-primary underline">Back to chat</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-page scrollbar-hide">
      <ReportContent report={data.report} />
    </div>
  );
}
