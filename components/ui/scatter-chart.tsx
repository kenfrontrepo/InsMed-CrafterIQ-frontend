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

interface ScatterChartData {
  x: number;
  y: number;
}

interface ScatterChartProps {
  data?: ScatterChartData[];
  height?: number;
  className?: string;
  color?: string;
  xLabel?: string;
  yLabel?: string;
}

const defaultData: ScatterChartData[] = [
  { x: 10, y: 14 },
  { x: 15, y: 20 },
  { x: 20, y: 25 },
  { x: 25, y: 22 },
  { x: 30, y: 35 },
  { x: 35, y: 30 },
  { x: 40, y: 45 },
  { x: 45, y: 40 },
  { x: 50, y: 55 },
  { x: 55, y: 48 },
  { x: 60, y: 65 },
  { x: 65, y: 58 },
  { x: 70, y: 72 },
  { x: 75, y: 68 },
  { x: 80, y: 85 },
];

export function ScatterChart({ 
  data = defaultData, 
  height = 400, 
  className,
  color = COLORS[2],
  xLabel = "X Value",
  yLabel = "Y Value",
}: ScatterChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelY: "zoomXY",
        paddingLeft: 0,
        paddingRight: 10,
      })
    );

    chart.set("cursor", am5xy.XYCursor.new(root, { 
      behavior: "zoomXY",
      snapToSeries: [],
    }));

    // X Axis
    const xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 50,
        }),
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    xAxis.get("renderer").labels.template.setAll({
      fontSize: 12,
      fill: am5.color("#6b7280"),
    });
    xAxis.get("renderer").grid.template.setAll({
      stroke: am5.color("#e5e7eb"),
      strokeOpacity: 0.5,
    });

    // Y Axis
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, { strokeOpacity: 0 }),
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    yAxis.get("renderer").labels.template.setAll({
      fontSize: 12,
      fill: am5.color("#6b7280"),
    });
    yAxis.get("renderer").grid.template.setAll({
      stroke: am5.color("#e5e7eb"),
      strokeOpacity: 0.5,
    });

    // Series
    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Data",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "y",
        valueXField: "x",
        tooltip: am5.Tooltip.new(root, { 
          labelText: `${xLabel}: {valueX}\n${yLabel}: {valueY}`,
        }),
      })
    );

    // Hide line, show only points
    series.strokes.template.set("visible", false);

    series.bullets.push(() => {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 6,
          fill: am5.color(color),
          fillOpacity: 0.7,
          stroke: am5.color(color),
          strokeWidth: 2,
        }),
      });
    });

    series.data.setAll(data);
    series.appear(1000);
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, color, xLabel, yLabel]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
