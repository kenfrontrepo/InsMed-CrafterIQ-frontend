"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import {
  applyValueAxisFormat,
  configureChartNumberFormatter,
  formatChartValue,
} from "@/components/ui/chart-value-axis";

const COLORS = [
  "#7BB5D8",
  "#7294D6",
  "#6A72D5",
  "#7D69D5",
  "#9B6BD5",
];

interface AreaChartData {
  category: string;
  value: number;
}

interface AreaChartProps {
  data?: AreaChartData[];
  height?: number;
  className?: string;
  color?: string;
  showBullets?: boolean;
  xLabel?: string;
  yLabel?: string;
}

const defaultData: AreaChartData[] = [
  { category: "Jan", value: 2400 },
  { category: "Feb", value: 1398 },
  { category: "Mar", value: 9800 },
  { category: "Apr", value: 3908 },
  { category: "May", value: 4800 },
  { category: "Jun", value: 3800 },
  { category: "Jul", value: 4300 },
];

export function AreaChart({ 
  data = defaultData, 
  height = 400, 
  className,
  color = COLORS[2],
  showBullets = false,
  xLabel,
  yLabel,
}: AreaChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);
    configureChartNumberFormatter(root);

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
      fontSize: 12,
      fill: am5.color("#6b7280"),
      paddingTop: 10,
      maxWidth: shouldRotate ? 90 : 120,
      oversizedBehavior: "truncate",
      rotation: shouldRotate ? -45 : 0,
      centerY: shouldRotate ? am5.percent(50) : am5.percent(0),
      centerX: shouldRotate ? am5.percent(100) : am5.percent(50),
    });
    xAxis.get("renderer").grid.template.set("visible", false);

    // X-axis label
    if (xLabel) {
      xAxis.children.push(
        am5.Label.new(root, {
          text: xLabel,
          x: am5.percent(50),
          centerX: am5.percent(50),
          fontSize: 12,
          fontWeight: "500",
          fill: am5.color("#374151"),
          paddingTop: 8,
        })
      );
    }

    // Y Axis
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        renderer: am5xy.AxisRendererY.new(root, { strokeOpacity: 0 }),
      })
    );

    applyValueAxisFormat(
      yAxis,
      data.map((item) => item.value),
      yLabel
    );

    yAxis.get("renderer").labels.template.setAll({
      fontSize: 12,
      fill: am5.color("#6b7280"),
    });
    yAxis.get("renderer").grid.template.setAll({
      stroke: am5.color("#e5e7eb"),
      strokeOpacity: 0.5,
    });

    // Y-axis label
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
          paddingRight: 8,
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
        fill: am5.color(color),
      })
    );

    // Format tooltip with large number formatting
    series.get("tooltip")?.adapters.add("labelText", (_text, target) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const cat = (dataItem as am5.DataItem<Record<string, unknown>>).get(
          "categoryX" as never
        );
        const val = (dataItem as am5.DataItem<Record<string, unknown>>).get(
          "valueY" as never
        ) as number;
        return `${cat}: ${formatChartValue(val, yLabel)}`;
      }
      return "{categoryX}: {valueY}";
    });

    series.strokes.template.setAll({
      strokeWidth: 2,
      stroke: am5.color(color),
    });

    // Fill area with gradient
    series.fills.template.setAll({
      visible: true,
      fillOpacity: 0.3,
      fillGradient: am5.LinearGradient.new(root, {
        stops: [
          { color: am5.color(color), opacity: 0.5 },
          { color: am5.color(color), opacity: 0.05 },
        ],
        rotation: 90,
      }),
    });

    // Add bullets
    if (showBullets) {
      series.bullets.push(() => {
        return am5.Bullet.new(root, {
          sprite: am5.Circle.new(root, {
            radius: 4,
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
