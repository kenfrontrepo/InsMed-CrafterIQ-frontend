"use client";

import { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import type { VisualSpec } from "@/stores/chat-store";
import { DataTable } from "@/components/ui/data-table";
import { KpiCard, type KpiMetric } from "@/components/ui/kpi-card";

// Chart loading skeleton
function ChartSkeleton() {
  return (
    <div className="h-[350px] bg-gray-50 rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-gray-400">Loading chart...</span>
    </div>
  );
}

// Dynamically import all chart components (best practice 2.4 - dynamic imports for heavy components)
const BarChart = dynamic(
  () => import("@/components/ui/bar-chart").then((m) => m.BarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const HorizontalBarChart = dynamic(
  () =>
    import("@/components/ui/horizontal-bar-chart").then(
      (m) => m.HorizontalBarChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const LineChart = dynamic(
  () => import("@/components/ui/line-chart").then((m) => m.LineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const AreaChart = dynamic(
  () => import("@/components/ui/area-chart").then((m) => m.AreaChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const MultiLineChart = dynamic(
  () =>
    import("@/components/ui/multi-line-chart").then((m) => m.MultiLineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const GroupedBarChart = dynamic(
  () =>
    import("@/components/ui/grouped-bar-chart").then((m) => m.GroupedBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const StackedBarChart = dynamic(
  () =>
    import("@/components/ui/stacked-bar-chart").then((m) => m.StackedBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const ComboChart = dynamic(
  () => import("@/components/ui/combo-chart").then((m) => m.ComboChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const PieChart = dynamic(
  () => import("@/components/ui/pie-chart").then((m) => m.PieChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const DonutChart = dynamic(
  () => import("@/components/ui/donut-chart").then((m) => m.DonutChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const ScatterChart = dynamic(
  () => import("@/components/ui/scatter-chart").then((m) => m.ScatterChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const BubbleChart = dynamic(
  () => import("@/components/ui/bubble-chart").then((m) => m.BubbleChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const HeatmapChart = dynamic(
  () => import("@/components/ui/heatmap-chart").then((m) => m.HeatmapChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const FunnelChart = dynamic(
  () => import("@/components/ui/funnel-chart").then((m) => m.FunnelChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const WaterfallChart = dynamic(
  () =>
    import("@/components/ui/waterfall-chart").then((m) => m.WaterfallChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const GaugeChart = dynamic(
  () => import("@/components/ui/gauge-chart").then((m) => m.GaugeChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const TreemapChart = dynamic(
  () => import("@/components/ui/treemap-chart").then((m) => m.TreemapChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

interface ChatChartProps {
  visualSpec: VisualSpec;
  /** When true, renders only the chart (no card wrapper, title, or labels) */
  bare?: boolean;
  /** Override chart height (default 350) */
  height?: number;
}

export const ChatChart = memo(function ChatChart({
  visualSpec,
  bare = false,
  height = 350,
}: ChatChartProps) {
  // Transform data based on chart type
  // Supports both direct `y` array format and `series` format
  const chartData = useMemo(() => {
    const { chart_type, x, y, series } = visualSpec;

    // Check if using direct y array format (simple single-series)
    const hasDirectY = y && Array.isArray(y) && y.length > 0;
    const hasSeries = series && Array.isArray(series) && series.length > 0;

    switch (chart_type) {
      // Multi-series charts (require series format)
      case "multi_line":
      case "grouped_bar":
      case "stacked_bar":
      case "combo":
        if (!hasSeries) return [];
        return x.map((label, idx) => {
          const point: Record<string, string | number> = { category: label };
          series!.forEach((s) => {
            point[s.name] = s.data[idx] || 0;
          });
          return point;
        });

      // Horizontal bar - special case: x=values, y=categories
      case "horizontal_bar":
        // Check if x contains numbers and y contains strings (reversed format)
        if (
          hasDirectY &&
          typeof y![0] === "string" &&
          typeof x[0] === "number"
        ) {
          // API format: x=values (numbers), y=categories (strings)
          return y!.map((label, idx) => ({
            category: String(label),
            value: Number(x[idx]) || 0,
          }));
        } else if (hasDirectY) {
          // Standard format: x=categories, y=values
          return x.map((label, idx) => ({
            category: String(label),
            value: Number(y![idx]) || 0,
          }));
        } else if (hasSeries) {
          return x.map((label, idx) => ({
            category: String(label),
            value: series![0].data[idx] || 0,
          }));
        }
        return [];

      // Single series charts - support both y array and series format
      case "bar":
      case "line":
      case "area":
      case "waterfall":
        if (hasDirectY) {
          // Direct y array format
          return x.map((label, idx) => ({
            category: String(label),
            value: Number(y![idx]) || 0,
          }));
        } else if (hasSeries) {
          // Series format
          return x.map((label, idx) => ({
            category: String(label),
            value: series![0].data[idx] || 0,
          }));
        }
        return [];

      // Pie/donut/funnel - support both formats
      case "pie":
      case "donut":
      case "funnel":
        if (hasDirectY) {
          // Direct format: x = categories, y = values
          return x.map((label, idx) => ({
            category: label,
            value: y![idx] || 0,
          }));
        } else if (
          visualSpec.labels &&
          visualSpec.labels.length > 0 &&
          visualSpec.values &&
          visualSpec.values.length > 0
        ) {
          // Alternative format: labels + values arrays (common for donut/pie)
          return visualSpec.labels.map((label, idx) => ({
            category: label,
            value: visualSpec.values![idx] || 0,
          }));
        } else if (hasSeries) {
          // Series format: aggregate by series name
          return series!.map((s) => ({
            category: s.name,
            value: s.data.reduce((sum, v) => sum + v, 0),
          }));
        }
        return [];

      // Scatter/bubble - need x, y coordinates (series format only)
      case "scatter":
      case "bubble":
        if (hasSeries && series!.length >= 2) {
          return x.map((_, idx) => ({
            x: series![0].data[idx] || 0,
            y: series![1].data[idx] || 0,
            value: series![2]?.data[idx] || 10, // For bubble size
          }));
        }
        return [];

      // Heatmap - matrix format (series format only)
      case "heatmap":
        if (!hasSeries) return [];
        const heatmapData: { x: string; y: string; value: number }[] = [];
        series!.forEach((s) => {
          x.forEach((xLabel, idx) => {
            heatmapData.push({
              x: String(xLabel),
              y: s.name,
              value: s.data[idx] || 0,
            });
          });
        });
        return heatmapData;

      // Treemap - hierarchical
      case "treemap":
        if (hasDirectY) {
          return x.map((label, idx) => ({
            name: String(label),
            value: Number(y![idx]) || 0,
          }));
        } else if (hasSeries) {
          return series!.map((s) => ({
            name: s.name,
            value: s.data.reduce((sum, v) => sum + v, 0),
          }));
        }
        return [];

      // Gauge - single value
      case "gauge":
        if (hasDirectY) {
          return y![0] || 0;
        } else if (hasSeries && series![0].data.length > 0) {
          return series![0].data[0];
        }
        return 0;

      // KPI card — API may send `metric` (object or array) or `metrics` (array)
      case "kpi_card": {
        const raw = visualSpec.metrics ?? visualSpec.metric;
        if (!raw) return [];
        return Array.isArray(raw) ? raw : [raw];
      }

      default:
        // Default: try direct y first, then series
        if (hasDirectY) {
          return x.map((label, idx) => ({
            category: label,
            value: y![idx] || 0,
          }));
        } else if (hasSeries) {
          return x.map((label, idx) => {
            const point: Record<string, string | number> = { category: label };
            series!.forEach((s) => {
              point[s.name] = s.data[idx] || 0;
            });
            return point;
          });
        }
        return [];
    }
  }, [visualSpec]);

  // Get series config for multi-series charts
  const seriesConfig = useMemo(
    () =>
      visualSpec.series?.map((s) => ({
        field: s.name,
        name: s.name,
      })) || [],
    [visualSpec.series]
  );

  // Get series names
  const seriesNames = useMemo(
    () => visualSpec.series?.map((s) => s.name) || [],
    [visualSpec.series]
  );

  // Render the appropriate chart
  const renderChart = () => {
    switch (visualSpec.chart_type) {
      case "bar":
        return (
          <BarChart
            data={chartData as any[]}
            height={height}
            xLabel={visualSpec.x_label}
            yLabel={visualSpec.y_label}
          />
        );

      case "horizontal_bar":
        return (
          <HorizontalBarChart
            data={chartData as any[]}
            height={height}
            xLabel={visualSpec.x_label}
            yLabel={visualSpec.y_label}
          />
        );

      case "line":
        return (
          <LineChart
            data={chartData as any[]}
            height={height}
            xLabel={visualSpec.x_label}
            yLabel={visualSpec.y_label}
          />
        );

      case "area":
        return (
          <AreaChart
            data={chartData as any[]}
            height={height}
            xLabel={visualSpec.x_label}
            yLabel={visualSpec.y_label}
          />
        );

      case "multi_line":
        return (
          <MultiLineChart
            data={chartData as any[]}
            series={seriesConfig}
            height={height}
            showLegend
            xLabel={visualSpec.x_label}
            yLabel={visualSpec.y_label}
          />
        );

      case "grouped_bar":
        return (
          <GroupedBarChart
            data={chartData as any[]}
            series={seriesConfig}
            height={height}
            xLabel={visualSpec.x_label}
            yLabel={visualSpec.y_label}
          />
        );

      case "stacked_bar":
        return (
          <StackedBarChart
            data={chartData as any[]}
            series={seriesConfig}
            height={height}
            xLabel={visualSpec.x_label}
            yLabel={visualSpec.y_label}
          />
        );

      case "combo":
        // ComboChart expects { category, bars, line } format
        const comboData = (chartData as any[]).map((d) => ({
          category: d.category,
          bars: d[seriesNames[0]] || 0,
          line: d[seriesNames[1]] || 0,
        }));
        return <ComboChart data={comboData} height={height} showLegend />;

      case "pie":
        return <PieChart data={chartData as any[]} height={height} />;

      case "donut":
        const donutData = (chartData as any[]).map((d: any) => ({
          category: String(d.category),
          value: Number(d.value),
        }));
        return (
          <DonutChart
            data={donutData}
            height={height}
            centerLabel={visualSpec.center_label}
            centerValue={visualSpec.center_value}
          />
        );

      case "scatter":
        return <ScatterChart data={chartData as any[]} height={height} />;

      case "bubble":
        return <BubbleChart data={chartData as any[]} height={height} />;

      case "heatmap":
        return <HeatmapChart data={chartData as any[]} height={height} />;

      case "funnel":
        return <FunnelChart data={chartData as any[]} height={height} />;

      case "waterfall":
        return <WaterfallChart data={chartData as any[]} height={height} />;

      case "gauge":
        return (
          <GaugeChart value={chartData as number} max={100} height={height} />
        );

      case "treemap":
        // TreemapChart expects { name, children: [{ name, value }] } format
        const treemapData = {
          name: visualSpec.title || "Root",
          children: (chartData as any[]).map((d) => ({
            name: d.name,
            value: d.value,
          })),
        };
        return <TreemapChart data={treemapData} height={height} />;

      case "table":
        return (
          <DataTable
            columns={visualSpec.columns ?? []}
            data={visualSpec.data ?? []}
            sortable={visualSpec.sortable ?? true}
          />
        );

      case "kpi_card":
        return <KpiCard metrics={chartData as KpiMetric[]} />;

      default:
        // Default to multi-line for unknown types
        return (
          <MultiLineChart
            data={chartData as any[]}
            series={seriesConfig}
            height={height}
            showLegend
          />
        );
    }
  };

  if (bare) {
    return <>{renderChart()}</>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        {visualSpec.title}
      </h3>
      {renderChart()}
    </div>
  );
});
