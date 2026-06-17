"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const COLORS = [
  "#7BB5D8",
  "#7294D6",
  "#6A72D5",
  "#7D69D5",
  "#9B6BD5",
  "#BA6DD6",
  "#CD6FC9",
  "#CD6FA9",
  "#CD6F89",
  "#CD716C",
];

const LIGHT_FONT = "#333942";
const MIN_LABEL_PERCENT = 4;

function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(1);
}

interface PieChartData {
  category: string;
  value: number;
}

interface PieChartProps {
  data?: PieChartData[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  showLabels?: boolean;
}

const defaultData: PieChartData[] = [
  { category: "Electronics", value: 35 },
  { category: "Clothing", value: 25 },
  { category: "Home", value: 20 },
  { category: "Sports", value: 12 },
  { category: "Other", value: 8 },
];

export function PieChart({
  data = defaultData,
  height = 400,
  className,
  showLegend = true,
  showLabels = true,
}: PieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);

    // Number formatter with B for billions
    root.numberFormatter.set("bigNumberPrefixes", [
      { number: 1e3, suffix: "K" },
      { number: 1e6, suffix: "M" },
      { number: 1e9, suffix: "B" },
      { number: 1e12, suffix: "T" },
    ]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: 0,
        radius: am5.percent(80),
      })
    );

    // Series
    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "category",
        alignLabels: true,
      })
    );

    // ── Colors (per-slice via adapter) ────────────────────────
    series.slices.template.adapters.add("fill", (_fill, target) => {
      const index = series.dataItems.indexOf(target.dataItem as any);
      return am5.color(COLORS[index % COLORS.length]);
    });

    // ── Slices ────────────────────────────────────────────────
    series.slices.template.setAll({
      strokeOpacity: 0,
      cornerRadius: 5,
    });

    series.slices.template.states.create("hover", {
      scale: 1.05,
    });

    series.slices.template.states.create("active", {
      shiftRadius: 0.03,
    });

    // ── Tooltip (formatted value) ─────────────────────────────
    series.slices.template.adapters.add(
      "tooltipText",
      (_text: any, target: any) => {
        const value = target.dataItem?.get("value");
        const category = target.dataItem?.get("category");
        const percent = target.dataItem?.get("valuePercentTotal");

        if (value && category && percent !== undefined) {
          const fv = formatLargeNumber(value);
          return `[bold {fill}]●[/] ${category}: $${fv} (${percent.toFixed(1)}%)`;
        }
        return _text;
      }
    );

    // ── Labels ────────────────────────────────────────────────
    // Make label & tick containers fully transparent to pointer events
    // so they never block hover/click on slices underneath
    series.labelsContainer.set("forceInactive", true);
    series.ticksContainer.set("forceInactive", true);

    if (showLabels) {
      series.labels.template.setAll({
        fontSize: 10,
        fill: am5.color(LIGHT_FONT),
        text: "{category}",
      });

      // Rich label with formatted value + percent; hide for tiny slices
      series.labels.template.adapters.add(
        "text",
        (_text: any, target: any) => {
          const value = target.dataItem?.get("value");
          const percent = target.dataItem?.get("valuePercentTotal");
          const category = target.dataItem?.get("category");

          if (value && percent !== undefined && category) {
            if (percent < MIN_LABEL_PERCENT) return "";

            const fv = formatLargeNumber(value);

            let cat = category as string;
            if (cat.length > 20) {
              const mid = Math.floor(cat.length / 2);
              cat = `${cat.substring(0, mid)}\n[normal {fill}]${cat.substring(mid)}`;
            }

            return `[normal {fill}]${cat}\n[normal {fill}]$${fv} (${percent.toFixed(1)}%)[/]`;
          }
          return _text;
        }
      );

      // ── Ticks ───────────────────────────────────────────────
      series.ticks.template.setAll({
        strokeWidth: 1,
        strokeOpacity: 0.5,
        stroke: am5.color("#808080"),
      });

      // Hide ticks for tiny slices
      series.ticks.template.adapters.add(
        "visible",
        (_visible: any, target: any) => {
          const percent = target.dataItem?.get("valuePercentTotal");
          if (percent !== undefined) return percent >= MIN_LABEL_PERCENT;
          return _visible;
        }
      );
    } else {
      series.labels.template.set("visible", false);
      series.ticks.template.set("visible", false);
    }

    // ── Legend ─────────────────────────────────────────────────
    if (showLegend) {
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          marginTop: 15,
        })
      );
      legend.data.setAll(series.dataItems);
    }

    series.data.setAll(data);
    series.appear(1000, 100);

    return () => root.dispose();
  }, [data, showLegend, showLabels]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
