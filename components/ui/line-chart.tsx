"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const COLORS = [
  "#7BB5D8",
  "#7294D6",
  "#6A72D5",
  "#7D69D5",
  "#9B6BD5",
];

interface LineChartData {
  category: string;
  value: number;
}

function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(1);
}

interface LineChartProps {
  data?: LineChartData[];
  height?: number;
  className?: string;
  color?: string;
  showBullets?: boolean;
  xLabel?: string;
  yLabel?: string;
}

const defaultData: LineChartData[] = [
  { category: "Jan", value: 2400 },
  { category: "Feb", value: 1398 },
  { category: "Mar", value: 9800 },
  { category: "Apr", value: 3908 },
  { category: "May", value: 4800 },
  { category: "Jun", value: 3800 },
  { category: "Jul", value: 4300 },
];

export function LineChart({ 
  data = defaultData, 
  height = 400, 
  className,
  color = COLORS[0],
  showBullets = true,
  xLabel,
  yLabel,
}: LineChartProps) {
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
        panX: true,
        panY: false,
        paddingLeft: 0,
        paddingRight: 10,
      })
    );

    chart.set("cursor", am5xy.XYCursor.new(root, { 
      behavior: "zoomX",
      xAxis: undefined,
    }));

    // X Axis
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "category",
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 30,
        }),
      })
    );

    const shouldRotate = data.length > 5;
    xAxis.get("renderer").labels.template.setAll({
      fontSize: 11,
      fill: am5.color("#6b7280"),
      paddingTop: 5,
      maxWidth: shouldRotate ? 90 : 120,
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
        numberFormat: "#.#a",
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

    // Series
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Value",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "value",
        categoryXField: "category",
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    // Formatted tooltip
    series.get("tooltip")?.adapters.add("labelText", (_text, target) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const cat = dataItem.get("categoryX" as any) as string;
        const val = dataItem.get("valueY" as any) as number;
        if (cat && val !== undefined) {
          return `${cat}: ${formatLargeNumber(val)}`;
        }
      }
      return _text ?? "";
    });

    series.strokes.template.setAll({
      strokeWidth: 3,
      stroke: am5.color(color),
    });

    // Add bullets (data points)
    if (showBullets) {
      series.bullets.push(() => {
        return am5.Bullet.new(root, {
          sprite: am5.Circle.new(root, {
            radius: 5,
            fill: am5.color(color),
            stroke: am5.color("#ffffff"),
            strokeWidth: 2,
          }),
        });
      });
    }

    xAxis.data.setAll(data);
    series.data.setAll(data);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, color, showBullets, xLabel, yLabel]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
