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

interface ComboChartData {
  category: string;
  bars: number;
  line: number;
}

interface ComboChartProps {
  data?: ComboChartData[];
  height?: number;
  className?: string;
  barColor?: string;
  lineColor?: string;
  showLegend?: boolean;
}

const defaultData: ComboChartData[] = [
  { category: "Jan", bars: 2400, line: 1800 },
  { category: "Feb", bars: 1398, line: 1200 },
  { category: "Mar", bars: 5800, line: 4500 },
  { category: "Apr", bars: 3908, line: 3200 },
  { category: "May", bars: 4800, line: 4000 },
  { category: "Jun", bars: 3800, line: 3100 },
  { category: "Jul", bars: 4300, line: 3600 },
];

export function ComboChart({ 
  data = defaultData, 
  height = 400, 
  className,
  barColor = COLORS[0],
  lineColor = COLORS[3],
  showLegend = true,
}: ComboChartProps) {
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
        paddingRight: 10,
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

    xAxis.get("renderer").labels.template.setAll({
      fontSize: 12,
      fill: am5.color("#6b7280"),
      paddingTop: 10,
    });
    xAxis.get("renderer").grid.template.set("visible", false);

    // Y Axis
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, { strokeOpacity: 0 }),
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

    // Bar Series
    const barSeries = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Revenue",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "bars",
        categoryXField: "category",
        tooltip: am5.Tooltip.new(root, { labelText: "{name}: {valueY}" }),
      })
    );

    barSeries.columns.template.setAll({
      cornerRadiusTL: 4,
      cornerRadiusTR: 4,
      strokeOpacity: 0,
      fill: am5.color(barColor),
      width: am5.percent(60),
    });

    // Line Series
    const lineSeries = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "Target",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "line",
        categoryXField: "category",
        tooltip: am5.Tooltip.new(root, { labelText: "{name}: {valueY}" }),
      })
    );

    lineSeries.strokes.template.setAll({
      strokeWidth: 3,
      stroke: am5.color(lineColor),
    });

    lineSeries.bullets.push(() => {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: am5.color(lineColor),
          stroke: am5.color("#ffffff"),
          strokeWidth: 2,
        }),
      });
    });

    // Legend
    if (showLegend) {
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          y: am5.percent(100),
          dy: 10,
        })
      );
      legend.data.setAll(chart.series.values);
    }

    xAxis.data.setAll(data);
    barSeries.data.setAll(data);
    lineSeries.data.setAll(data);

    barSeries.appear(1000);
    lineSeries.appear(1000);
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, barColor, lineColor, showLegend]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
