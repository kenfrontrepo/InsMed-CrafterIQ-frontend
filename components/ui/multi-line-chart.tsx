"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import {
  applyValueAxisFormat,
  configureChartNumberFormatter,
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
  "#CD6FC9",
];

interface MultiLineChartData {
  category: string;
  [key: string]: string | number;
}

interface SeriesConfig {
  field: string;
  name: string;
  color?: string;
}

interface MultiLineChartProps {
  data?: MultiLineChartData[];
  series?: SeriesConfig[];
  height?: number;
  className?: string;
  showBullets?: boolean;
  showLegend?: boolean;
  xLabel?: string;
  yLabel?: string;
}

const defaultData: MultiLineChartData[] = [
  { category: "Jan", sales: 2400, revenue: 1800, profit: 1200 },
  { category: "Feb", sales: 1398, revenue: 1200, profit: 800 },
  { category: "Mar", sales: 9800, revenue: 7500, profit: 4500 },
  { category: "Apr", sales: 3908, revenue: 3200, profit: 2100 },
  { category: "May", sales: 4800, revenue: 4000, profit: 2800 },
  { category: "Jun", sales: 3800, revenue: 3100, profit: 2000 },
  { category: "Jul", sales: 4300, revenue: 3600, profit: 2400 },
];

const defaultSeries: SeriesConfig[] = [
  { field: "sales", name: "Sales" },
  { field: "revenue", name: "Revenue" },
  { field: "profit", name: "Profit" },
];

export function MultiLineChart({ 
  data = defaultData, 
  series: seriesConfig = defaultSeries,
  height = 500, 
  className,
  showBullets = true,
  showLegend = true,
  xLabel,
  yLabel,
}: MultiLineChartProps) {
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
        paddingBottom: 10,
        layout: root.verticalLayout,
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

    const shouldRotate = data.length > 6;
    xAxis.get("renderer").labels.template.setAll({
      fontSize: 12,
      fill: am5.color("#6b7280"),
      paddingTop: 10,
      maxWidth: shouldRotate ? 80 : 120,
      oversizedBehavior: "truncate",
      rotation: shouldRotate ? -45 : 0,
      centerY: shouldRotate ? am5.percent(50) : am5.percent(0),
      centerX: shouldRotate ? am5.percent(100) : am5.percent(50),
    });
    xAxis.get("renderer").grid.template.set("visible", false);

    // X Axis Label
    if (xLabel) {
      xAxis.children.push(
        am5.Label.new(root, {
          text: xLabel,
          x: am5.percent(50),
          centerX: am5.percent(50),
          fontSize: 12,
          fontWeight: "500",
          fill: am5.color("#374151"),
          paddingTop: shouldRotate ? 30 : 15,
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
      extractSeriesValues(
        data,
        seriesConfig.map((s) => s.field)
      ),
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

    // Y Axis Label
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

    // Create multiple series
    seriesConfig.forEach((config, index) => {
      const lineColor = config.color || COLORS[index % COLORS.length];
      
      const series = chart.series.push(
        am5xy.LineSeries.new(root, {
          name: config.name,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: config.field,
          categoryXField: "category",
          tooltip: am5.Tooltip.new(root, {}),
        })
      );

      // Format tooltip with large numbers
      series.get("tooltip")?.adapters.add("labelText", (_text, target) => {
        const dataItem = target.dataItem as am5.DataItem<am5xy.ILineSeriesDataItem> | undefined;
        if (dataItem) {
          const val = dataItem.get("valueY") as number;
          return `${config.name}: ${formatChartValue(val, yLabel)}`;
        }
        return `${config.name}: {valueY}`;
      });

      series.strokes.template.setAll({
        strokeWidth: 2,
        stroke: am5.color(lineColor),
      });

      if (showBullets) {
        series.bullets.push(() => {
          return am5.Bullet.new(root, {
            sprite: am5.Circle.new(root, {
              radius: 4,
              fill: am5.color(lineColor),
              stroke: am5.color("#ffffff"),
              strokeWidth: 2,
            }),
          });
        });
      }

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
      legend.labels.template.setAll({
        fontSize: 12,
        fill: am5.color("#374151"),
      });
      legend.valueLabels.template.set("forceHidden", true);
      legend.data.setAll(chart.series.values);
    }

    xAxis.data.setAll(data);
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, seriesConfig, showBullets, showLegend, xLabel, yLabel]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
