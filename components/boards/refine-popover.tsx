"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  BarChart3,
  LineChart,
  AreaChart,
  BarChartHorizontal,
  PieChart,
  CircleDot,
  Table,
  ScatterChart,
  Activity,
  LayoutGrid,
  TrendingDown,
  Gauge,
  TreePine,
  Layers,
  GitBranch,
  type LucideIcon,
} from "lucide-react";
import type { ChartType } from "./pin-card";

/* ── Chart type metadata (icon + display label) ──────────── */
const CHART_TYPE_META: Record<
  string,
  { icon: LucideIcon; label: string }
> = {
  bar: { icon: BarChart3, label: "Bar chart" },
  line: { icon: LineChart, label: "Line chart" },
  area: { icon: AreaChart, label: "Area chart" },
  horizontal_bar: { icon: BarChartHorizontal, label: "Horizontal bar" },
  multi_line: { icon: LineChart, label: "Multi-line" },
  grouped_bar: { icon: BarChart3, label: "Grouped bar" },
  stacked_bar: { icon: Layers, label: "Stacked bar" },
  combo: { icon: Activity, label: "Combo chart" },
  pie: { icon: PieChart, label: "Pie chart" },
  donut: { icon: CircleDot, label: "Donut chart" },
  scatter: { icon: ScatterChart, label: "Scatter chart" },
  bubble: { icon: ScatterChart, label: "Bubble chart" },
  heatmap: { icon: LayoutGrid, label: "Heatmap" },
  funnel: { icon: TrendingDown, label: "Funnel chart" },
  waterfall: { icon: GitBranch, label: "Waterfall" },
  gauge: { icon: Gauge, label: "Gauge" },
  treemap: { icon: TreePine, label: "Treemap" },
  table: { icon: Table, label: "Table" },
  kpi_card: { icon: LayoutGrid, label: "KPI card" },
};

function getChartMeta(type: string) {
  return CHART_TYPE_META[type] ?? { icon: BarChart3, label: type };
}

/* ── Fetch function ──────────────────────────────────────── */
import { fetchChartOptions as apiFetchChartOptions } from "@/lib/api/boardsApi";

async function fetchChartOptions(
  boardId: string,
  pinId: string,
  userId: string
): Promise<string[]> {
  const data = await apiFetchChartOptions(boardId, pinId, userId);
  if (data.status && Array.isArray(data.compatible_charts)) {
    return data.compatible_charts;
  }
  return [];
}

/* ── Component ───────────────────────────────────────────── */

interface RefinePopoverProps {
  boardId: string;
  pinId: string;
  userId: string;
  currentChartType: ChartType;
  onSelect: (chartType: string) => void;
}

export function RefinePopover({
  boardId,
  pinId,
  userId,
  currentChartType,
  onSelect,
}: RefinePopoverProps) {
  const [open, setOpen] = useState(false);

  const {
    data: chartOptions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["chart-options", boardId, pinId, userId],
    queryFn: () => fetchChartOptions(boardId, pinId, userId),
    enabled: open,
  });

  const handleSelect = useCallback(
    (chartType: string) => {
      onSelect(chartType);
      setOpen(false);
    },
    [onSelect]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-72 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-text-tertiary" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              Charts &amp; graphs
            </p>
            <p className="text-xs text-text-tertiary">
              Change visualization type
            </p>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="text-center py-4">
            <p className="text-xs text-red-500 mb-2">
              Could not load chart options
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Chart options grid */}
        {!isLoading && !error && chartOptions.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {chartOptions.map((type) => {
              const meta = getChartMeta(type);
              const Icon = meta.icon;
              const isActive = type === currentChartType;

              return (
                <button
                  key={type}
                  onClick={() => handleSelect(type)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border text-xs transition-all ${
                    isActive
                      ? "border-text-primary bg-text-primary/5 text-text-primary font-medium"
                      : "border-border-mid text-text-secondary hover:border-border-strong hover:bg-hover"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-tight text-center">
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && chartOptions.length === 0 && (
          <p className="text-xs text-text-tertiary text-center py-4">
            No compatible chart types available.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
