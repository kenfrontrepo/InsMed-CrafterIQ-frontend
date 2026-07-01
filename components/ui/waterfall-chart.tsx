"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import {
  applyValueAxisFormat,
  configureChartNumberFormatter,
} from "@/components/ui/chart-value-axis";

interface WaterfallChartData {
  category: string;
  value: number;
  type?: "positive" | "negative" | "total";
}

interface WaterfallChartProps {
  data?: WaterfallChartData[];
  height?: number;
  className?: string;
  positiveColor?: string;
  negativeColor?: string;
  totalColor?: string;
}

const defaultData: WaterfallChartData[] = [
  { category: "Starting", value: 1000, type: "total" },
  { category: "Product Sales", value: 500, type: "positive" },
  { category: "Service Revenue", value: 300, type: "positive" },
  { category: "Returns", value: -150, type: "negative" },
  { category: "Marketing", value: -200, type: "negative" },
  { category: "Operations", value: -100, type: "negative" },
  { category: "Other Income", value: 100, type: "positive" },
  { category: "Ending", value: 1450, type: "total" },
];

export function WaterfallChart({ 
  data = defaultData, 
  height = 400, 
  className,
  positiveColor = "#34D399",
  negativeColor = "#F87171",
  totalColor = "#7294D6",
}: WaterfallChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);
    configureChartNumberFormatter(root);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        paddingLeft: 0,
        paddingRight: 10,
      })
    );

    // Process data to calculate running totals
    let runningTotal = 0;
    const processedData = data.map((item, index) => {
      if (item.type === "total") {
        runningTotal = item.value;
        return {
          category: item.category,
          value: item.value,
          open: 0,
          close: item.value,
          color: totalColor,
        };
      } else {
        const open = runningTotal;
        runningTotal += item.value;
        return {
          category: item.category,
          value: item.value,
          open: open,
          close: runningTotal,
          color: item.value >= 0 ? positiveColor : negativeColor,
        };
      }
    });

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
      fontSize: 11,
      fill: am5.color("#6b7280"),
      paddingTop: 10,
      rotation: -45,
      centerX: am5.percent(100),
      centerY: am5.percent(50),
    });
    xAxis.get("renderer").grid.template.set("visible", false);

    // Y Axis
    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, { strokeOpacity: 0 }),
      })
    );

    applyValueAxisFormat(
      yAxis,
      processedData.flatMap((item) => [item.open, item.close, item.value]),
      undefined
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
      am5xy.ColumnSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "close",
        openValueYField: "open",
        categoryXField: "category",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{category}: {value}",
        }),
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 4,
      cornerRadiusTR: 4,
      strokeOpacity: 0,
      width: am5.percent(70),
    });

    // Set color from data
    series.columns.template.adapters.add("fill", (fill, target) => {
      const dataItem = target.dataItem;
      if (dataItem) {
        const data = dataItem.dataContext as { color: string };
        return am5.color(data.color);
      }
      return fill;
    });

    series.columns.template.states.create("hover", {
      shadowBlur: 10,
      shadowColor: am5.color("#000000"),
      shadowOpacity: 0.1,
    });

    xAxis.data.setAll(processedData);
    series.data.setAll(processedData);

    series.appear(1000);
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, positiveColor, negativeColor, totalColor]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
