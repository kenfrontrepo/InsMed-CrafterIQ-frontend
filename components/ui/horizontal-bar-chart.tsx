"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const COLORS = [
  "#7BB5D8", // Light Blue
  "#7294D6", // Blue
  "#6A72D5", // Indigo
  "#7D69D5", // Purple
  "#9B6BD5", // Violet
  "#BA6DD6", // Magenta
  "#CD6FC9", // Pink
  "#CD6FA9", // Rose
  "#CD6F89", // Coral
  "#CD716C", // Salmon
];

interface HorizontalBarChartData {
  category: string;
  value: number;
}

interface HorizontalBarChartProps {
  data?: HorizontalBarChartData[];
  height?: number;
  className?: string;
  xLabel?: string;
  yLabel?: string;
}

const defaultData: HorizontalBarChartData[] = [
  { category: "Product A", value: 2400 },
  { category: "Product B", value: 1398 },
  { category: "Product C", value: 9800 },
  { category: "Product D", value: 3908 },
  { category: "Product E", value: 4800 },
];

function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(1);
}

export function HorizontalBarChart({ 
  data = defaultData, 
  height = 400, 
  className,
  xLabel,
  yLabel,
}: HorizontalBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        paddingLeft: 0,
        paddingRight: 20,
      })
    );

    chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));

    // Y Axis (Categories)
    const yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "category",
        renderer: am5xy.AxisRendererY.new(root, {
          minGridDistance: 20,
          cellStartLocation: 0.1,
          cellEndLocation: 0.9,
          inversed: true,
        }),
      })
    );

    yAxis.get("renderer").labels.template.setAll({
      fontSize: 11,
      fill: am5.color("#6b7280"),
      paddingRight: 10,
      maxWidth: 180,
      oversizedBehavior: "truncate",
    });
    yAxis.get("renderer").grid.template.set("visible", false);

    // X Axis (Values)
    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, { 
          strokeOpacity: 0,
          minGridDistance: 80,
        }),
        min: 0,
        numberFormat: "#.#a",
      })
    );

    // Number formatter
    root.numberFormatter.set("bigNumberPrefixes", [
      { number: 1e3, suffix: "K" },
      { number: 1e6, suffix: "M" },
      { number: 1e9, suffix: "B" },
      { number: 1e12, suffix: "T" },
    ]);

    xAxis.get("renderer").labels.template.setAll({
      fontSize: 11,
      fill: am5.color("#6b7280"),
    });
    xAxis.get("renderer").grid.template.setAll({
      stroke: am5.color("#e5e7eb"),
      strokeOpacity: 0.5,
    });

    // ── Axis Labels ──────────────────────────────────────────
    // X-axis label (values axis - bottom)
    if (xLabel) {
      xAxis.children.push(
        am5.Label.new(root, {
          text: xLabel,
          x: am5.percent(50),
          centerX: am5.percent(50),
          fontSize: 12,
          fontWeight: "500",
          fill: am5.color("#374151"),
          paddingTop: 10,
        })
      );
    }

    // Y-axis label (categories axis - left)
    if (yLabel) {
      yAxis.children.unshift(
        am5.Label.new(root, {
          text: yLabel,
          rotation: -90,
          y: am5.percent(50),
          centerX: am5.percent(50),
          fontSize: 12,
          fontWeight: "500",
          fill: am5.color("#374151"),
          paddingRight: 10,
        })
      );
    }

    // Series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Value",
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "value",
        categoryYField: "category",
        tooltip: am5.Tooltip.new(root, { 
          pointerOrientation: "horizontal",
        }),
      })
    );

    series.columns.template.setAll({
      cornerRadiusTR: 6,
      cornerRadiusBR: 6,
      strokeOpacity: 0,
      height: am5.percent(65),
    });

    // Apply colors
    series.columns.template.adapters.add("fill", (fill, target) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const index = series.dataItems.indexOf(dataItem);
        return am5.color(COLORS[index % COLORS.length]);
      }
      return fill;
    });

    // Hover state
    series.columns.template.states.create("hover", {
      shadowBlur: 10,
      shadowColor: am5.color("#000000"),
      shadowOpacity: 0.1,
      shadowOffsetX: 3,
    });

    // Tooltip with formatted numbers
    series.columns.template.adapters.add("tooltipText", (_text, target) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const cat = dataItem.get("categoryY" as any) as string;
        const val = dataItem.get("valueX" as any) as number;
        if (cat && val !== undefined) {
          return `${cat}: ${formatLargeNumber(val)}`;
        }
      }
      return _text ?? "";
    });

    yAxis.data.setAll(data);
    series.data.setAll(data);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, xLabel, yLabel]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
