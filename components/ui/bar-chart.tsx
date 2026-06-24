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

interface BarChartData {
  category: string;
  value: number;
}

interface BarChartProps {
  data?: BarChartData[];
  height?: number;
  className?: string;
  xLabel?: string;
  yLabel?: string;
  compact?: boolean;
}

const defaultData: BarChartData[] = [
  { category: "Product A", value: 2400 },
  { category: "Product B", value: 1398 },
  { category: "Product C", value: 9800 },
  { category: "Product D", value: 3908 },
  { category: "Product E", value: 4800 },
  { category: "Product F", value: 3800 },
  { category: "Product G", value: 4300 },
];

const formatCompact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function BarChart({
  data = defaultData,
  height = 400,
  className,
  xLabel,
  yLabel,
  compact = false,
}: BarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);

    // Number formatter: K / M / B / T
    root.numberFormatter.set("bigNumberPrefixes", [
      { number: 1e3, suffix: "K" },
      { number: 1e6, suffix: "M" },
      { number: 1e9, suffix: "B" },
      { number: 1e12, suffix: "T" },
    ]);

    const maxLabelLen = data.reduce(
      (max, item) => Math.max(max, item.category.length),
      0
    );
    const shouldRotate = compact
      ? maxLabelLen > 8 || data.length > 4
      : data.length > 5;

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: shouldRotate ? (compact ? 36 : 24) : compact ? 16 : 8,
        paddingTop: compact ? 8 : 0,
      })
    );

    // Set color list for the chart
    chart.get("colors")?.set("colors", COLORS.map(c => am5.color(c)));

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
        // tooltip: am5.Tooltip.new(root, {}),
      })
    );

    // Rotate labels when there are many items or long category names
    xAxis.get("renderer").labels.template.setAll({
      fontSize: compact ? 10 : 11,
      fill: am5.color("#6b7280"),
      paddingTop: 5,
      maxWidth: shouldRotate ? (compact ? 72 : 90) : compact ? 96 : 120,
      oversizedBehavior: "truncate",
      rotation: shouldRotate ? -45 : 0,
      centerY: shouldRotate ? am5.percent(50) : am5.percent(0),
      centerX: shouldRotate ? am5.percent(100) : am5.percent(50),
    });
    xAxis.get("renderer").grid.template.set("visible", false);

    // X axis label
    if (xLabel) {
      xAxis.children.push(
        am5.Label.new(root, {
          text: xLabel,
          x: am5.percent(50),
          centerX: am5.percent(50),
          fontSize: 11,
          fill: am5.color("#9ca3af"),
          paddingTop: 8,
        })
      );
    }

    // Y Axis — compact number format (#.#a → 142M, 56.8M)
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        numberFormat: "#.#a",
        min: 0,
        renderer: am5xy.AxisRendererY.new(root, { strokeOpacity: 0 }),
      })
    );

    yAxis.get("renderer").labels.template.setAll({
      fontSize: 11,
      fill: am5.color("#6b7280"),
    });
    yAxis.get("renderer").grid.template.setAll({
      stroke: am5.color("#e5e7eb"),
      strokeOpacity: 0.5,
    });

    // Y axis label
    if (yLabel) {
      yAxis.children.unshift(
        am5.Label.new(root, {
          text: yLabel,
          rotation: -90,
          y: am5.percent(50),
          centerX: am5.percent(50),
          fontSize: 11,
          fill: am5.color("#9ca3af"),
          paddingBottom: 10,
        })
      );
    }

    // Series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Value",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        categoryXField: "category",
      })
    );

    //Tooltip with formatted value
    series.columns.template.set("tooltipText", "{categoryX}");
    series.columns.template.adapters.add("tooltipText", (_text: any, target: any) => {
      const value = target.dataItem?.get("valueY");
      const category = target.dataItem?.get("categoryX");
      if (value !== undefined && category) {
        return `${category}: ${formatCompact.format(value)}`;
      }
      return _text;
    });

    series.columns.template.setAll({
      cornerRadiusTL: 8,
      cornerRadiusTR: 8,
      strokeOpacity: 0,
      width: am5.percent(65),
      fillGradient: am5.LinearGradient.new(root, {
        stops: [
          { brighten: -0.1 },
          { brighten: 0.1 },
          { brighten: 0.4 },
        ],
        rotation: 90,
      }),
    });

    // Apply different colors to each column
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
      shadowBlur: 15,
      shadowColor: am5.color("#000000"),
      shadowOpacity: 0.15,
      shadowOffsetY: 5,
    });

    // Set data
    xAxis.data.setAll(data);
    series.data.setAll(data);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, xLabel, yLabel, compact]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
