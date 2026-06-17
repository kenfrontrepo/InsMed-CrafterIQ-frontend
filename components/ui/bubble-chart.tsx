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
  "#BA6DD6",
];

interface BubbleChartData {
  x: number;
  y: number;
  size: number;
  category?: string;
}

interface BubbleChartProps {
  data?: BubbleChartData[];
  height?: number;
  className?: string;
  xLabel?: string;
  yLabel?: string;
}

const defaultData: BubbleChartData[] = [
  { x: 10, y: 20, size: 15, category: "Product A" },
  { x: 25, y: 35, size: 25, category: "Product B" },
  { x: 40, y: 25, size: 40, category: "Product C" },
  { x: 55, y: 50, size: 20, category: "Product D" },
  { x: 70, y: 40, size: 35, category: "Product E" },
  { x: 85, y: 60, size: 30, category: "Product F" },
  { x: 30, y: 55, size: 18, category: "Product G" },
  { x: 60, y: 30, size: 28, category: "Product H" },
];

export function BubbleChart({ 
  data = defaultData, 
  height = 400, 
  className,
  xLabel = "Revenue",
  yLabel = "Growth",
}: BubbleChartProps) {
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
        valueField: "size",
        tooltip: am5.Tooltip.new(root, { 
          labelText: "{category}\n" + xLabel + ": {valueX}\n" + yLabel + ": {valueY}\nSize: {value}",
        }),
      })
    );

    series.strokes.template.set("visible", false);

    series.bullets.push((root, series, dataItem) => {
      const data = dataItem.dataContext as BubbleChartData;
      const index = series.dataItems.indexOf(dataItem);
      
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: data.size / 2,
          fill: am5.color(COLORS[index % COLORS.length]),
          fillOpacity: 0.6,
          stroke: am5.color(COLORS[index % COLORS.length]),
          strokeWidth: 2,
          tooltipText: "{category}",
        }),
      });
    });

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
