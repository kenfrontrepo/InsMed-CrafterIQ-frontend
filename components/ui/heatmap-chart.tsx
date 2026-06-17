"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface HeatmapChartData {
  x: string;
  y: string;
  value: number;
}

interface HeatmapChartProps {
  data?: HeatmapChartData[];
  height?: number;
  className?: string;
  lowColor?: string;
  highColor?: string;
}

const defaultData: HeatmapChartData[] = [
  // Week days vs Hours
  { x: "Mon", y: "9AM", value: 20 },
  { x: "Mon", y: "12PM", value: 45 },
  { x: "Mon", y: "3PM", value: 60 },
  { x: "Mon", y: "6PM", value: 35 },
  { x: "Tue", y: "9AM", value: 30 },
  { x: "Tue", y: "12PM", value: 55 },
  { x: "Tue", y: "3PM", value: 70 },
  { x: "Tue", y: "6PM", value: 40 },
  { x: "Wed", y: "9AM", value: 25 },
  { x: "Wed", y: "12PM", value: 50 },
  { x: "Wed", y: "3PM", value: 80 },
  { x: "Wed", y: "6PM", value: 45 },
  { x: "Thu", y: "9AM", value: 35 },
  { x: "Thu", y: "12PM", value: 65 },
  { x: "Thu", y: "3PM", value: 75 },
  { x: "Thu", y: "6PM", value: 50 },
  { x: "Fri", y: "9AM", value: 40 },
  { x: "Fri", y: "12PM", value: 70 },
  { x: "Fri", y: "3PM", value: 55 },
  { x: "Fri", y: "6PM", value: 30 },
];

export function HeatmapChart({ 
  data = defaultData, 
  height = 400, 
  className,
  lowColor = "#e8f0fe",
  highColor = "#6A72D5",
}: HeatmapChartProps) {
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

    // Get unique x and y values
    const xCategories = [...new Set(data.map(d => d.x))];
    const yCategories = [...new Set(data.map(d => d.y))];

    // X Axis
    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "x",
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 30,
          cellStartLocation: 0.05,
          cellEndLocation: 0.95,
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
      am5xy.CategoryAxis.new(root, {
        categoryField: "y",
        renderer: am5xy.AxisRendererY.new(root, {
          minGridDistance: 20,
          cellStartLocation: 0.05,
          cellEndLocation: 0.95,
          inversed: true,
        }),
      })
    );

    yAxis.get("renderer").labels.template.setAll({
      fontSize: 12,
      fill: am5.color("#6b7280"),
    });
    yAxis.get("renderer").grid.template.set("visible", false);

    // Series
    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        categoryXField: "x",
        categoryYField: "y",
        valueField: "value",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{categoryX}, {categoryY}: {value}",
        }),
      })
    );

    series.columns.template.setAll({
      strokeOpacity: 0,
      cornerRadiusTL: 4,
      cornerRadiusTR: 4,
      cornerRadiusBL: 4,
      cornerRadiusBR: 4,
      width: am5.percent(90),
      height: am5.percent(90),
    });

    // Color based on value
    series.set("heatRules", [{
      target: series.columns.template,
      min: am5.color(lowColor),
      max: am5.color(highColor),
      dataField: "value",
      key: "fill",
    }]);

    series.columns.template.states.create("hover", {
      strokeWidth: 2,
      stroke: am5.color("#000000"),
      strokeOpacity: 0.3,
    });

    // Set axis data
    xAxis.data.setAll(xCategories.map(x => ({ x })));
    yAxis.data.setAll(yCategories.map(y => ({ y })));
    series.data.setAll(data);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, lowColor, highColor]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
