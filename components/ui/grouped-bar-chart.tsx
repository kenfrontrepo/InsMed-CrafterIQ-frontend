"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import {
  applyValueAxisFormat,
  extractSeriesValues,
  formatChartValue,
} from "@/components/ui/chart-value-axis";

const COLORS = [
  "#7BB5D8",
  "#7294D6",
  "#6A72D5",
  "#7D69D5",
  "#9B6BD5",
  "#BA6DD6",
];

function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(1);
}

interface GroupedBarChartData {
  category: string;
  [key: string]: string | number;
}

interface SeriesConfig {
  field: string;
  name: string;
  color?: string;
}

interface GroupedBarChartProps {
  data?: GroupedBarChartData[];
  series?: SeriesConfig[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  xLabel?: string;
  yLabel?: string;
}

const defaultData: GroupedBarChartData[] = [
  { category: "Q1", product_a: 2400, product_b: 1800, product_c: 1200 },
  { category: "Q2", product_a: 1398, product_b: 2200, product_c: 1600 },
  { category: "Q3", product_a: 9800, product_b: 7500, product_c: 5500 },
  { category: "Q4", product_a: 3908, product_b: 4200, product_c: 3100 },
];

const defaultSeries: SeriesConfig[] = [
  { field: "product_a", name: "Product A" },
  { field: "product_b", name: "Product B" },
  { field: "product_c", name: "Product C" },
];

export function GroupedBarChart({ 
  data = defaultData, 
  series: seriesConfig = defaultSeries,
  height = 400, 
  className,
  showLegend = true,
  xLabel,
  yLabel,
}: GroupedBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);

    // Number formatter
    root.numberFormatter.set("bigNumberPrefixes", [
      { number: 1e3, suffix: "K" },
      { number: 1e6, suffix: "M" },
      { number: 1e9, suffix: "B" },
      { number: 1e12, suffix: "T" },
    ]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        paddingLeft: 0,
        paddingRight: 10,
        paddingBottom: 10,
        layout: root.verticalLayout,
      })
    );

    chart.set("cursor", am5xy.XYCursor.new(root, { behavior: "none" }));

    // X Axis
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "category",
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 30,
          cellStartLocation: 0.1,
          cellEndLocation: 0.9,
        }),
      })
    );

    const shouldRotate = data.length > 6;
    xAxis.get("renderer").labels.template.setAll({
      fontSize: 11,
      fill: am5.color("#6b7280"),
      paddingTop: 5,
      maxWidth: shouldRotate ? 80 : 120,
      oversizedBehavior: "truncate",
      rotation: shouldRotate ? -45 : 0,
      centerY: shouldRotate ? am5.percent(50) : am5.percent(0),
      centerX: shouldRotate ? am5.percent(100) : am5.percent(50),
    });
    xAxis.get("renderer").grid.template.set("visible", false);

    // Y Axis
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, { strokeOpacity: 0 }),
        min: 0,
      })
    );

    applyValueAxisFormat(
      yAxis,
      extractSeriesValues(
        data,
        seriesConfig.map((config) => config.field)
      ),
      yLabel
    );

    yAxis.get("renderer").labels.template.setAll({
      fontSize: 11,
      fill: am5.color("#6b7280"),
    });
    yAxis.get("renderer").grid.template.setAll({
      stroke: am5.color("#e5e7eb"),
      strokeOpacity: 0.5,
    });

    // ── Axis Labels ──────────────────────────────────────────
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

    // Create grouped series
    seriesConfig.forEach((config, index) => {
      const barColor = config.color || COLORS[index % COLORS.length];
      
      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: config.name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: config.field,
          categoryXField: "category",
          tooltip: am5.Tooltip.new(root, {}),
        })
      );

      // Formatted tooltip
      series.get("tooltip")?.adapters.add("labelText", (_text, target) => {
        const dataItem = target.dataItem;
        if (dataItem) {
          const val = dataItem.get("valueY" as any) as number;
          if (val !== undefined) {
            return `${config.name}: ${formatLargeNumber(val)}`;
          }
        }
        return _text ?? "";
      });

      series.columns.template.setAll({
        cornerRadiusTL: 4,
        cornerRadiusTR: 4,
        strokeOpacity: 0,
        fill: am5.color(barColor),
      });

      series.columns.template.states.create("hover", {
        shadowBlur: 10,
        shadowColor: am5.color("#000000"),
        shadowOpacity: 0.1,
      });

      series.data.setAll(data);
      series.appear(1000);
    });

    // Legend
    if (showLegend) {
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          marginTop: 10,
        })
      );
      legend.data.setAll(chart.series.values);
    }

    xAxis.data.setAll(data);
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, seriesConfig, showLegend, xLabel, yLabel]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
