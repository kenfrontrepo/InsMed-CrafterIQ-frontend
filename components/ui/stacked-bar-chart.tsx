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

function formatLargeNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(1);
}

interface StackedBarChartData {
  category: string;
  [key: string]: string | number;
}

interface SeriesConfig {
  field: string;
  name: string;
  color?: string;
}

interface StackedBarChartProps {
  data?: StackedBarChartData[];
  series?: SeriesConfig[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  horizontal?: boolean;
  xLabel?: string;
  yLabel?: string;
}

const defaultData: StackedBarChartData[] = [
  { category: "2020", direct: 2400, organic: 1800, referral: 1200, social: 800 },
  { category: "2021", direct: 1398, organic: 2200, referral: 1600, social: 1100 },
  { category: "2022", direct: 9800, organic: 7500, referral: 5500, social: 3200 },
  { category: "2023", direct: 3908, organic: 4200, referral: 3100, social: 2400 },
  { category: "2024", direct: 4800, organic: 5100, referral: 3800, social: 2900 },
];

const defaultSeries: SeriesConfig[] = [
  { field: "direct", name: "Direct" },
  { field: "organic", name: "Organic" },
  { field: "referral", name: "Referral" },
  { field: "social", name: "Social" },
];

export function StackedBarChart({ 
  data = defaultData, 
  series: seriesConfig = defaultSeries,
  height = 400, 
  className,
  showLegend = true,
  horizontal = false,
  xLabel,
  yLabel,
}: StackedBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);

    // Configure number formatter for K/M/B
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

    let xAxis: am5xy.CategoryAxis<am5xy.AxisRenderer> | am5xy.ValueAxis<am5xy.AxisRenderer>;
    let yAxis: am5xy.CategoryAxis<am5xy.AxisRenderer> | am5xy.ValueAxis<am5xy.AxisRenderer>;

    if (horizontal) {
      // Horizontal stacked bar
      yAxis = chart.yAxes.push(
        am5xy.CategoryAxis.new(root, {
          categoryField: "category",
          renderer: am5xy.AxisRendererY.new(root, {
            minGridDistance: 20,
            cellStartLocation: 0.1,
            cellEndLocation: 0.9,
            inversed: true,
          }),
        })
      );

      xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererX.new(root, { strokeOpacity: 0 }),
          min: 0,
          numberFormat: "#.#a",
        })
      );

      yAxis.get("renderer").labels.template.setAll({
        fontSize: 12,
        fill: am5.color("#6b7280"),
      });
      yAxis.get("renderer").grid.template.set("visible", false);

      xAxis.get("renderer").labels.template.setAll({
        fontSize: 12,
        fill: am5.color("#6b7280"),
      });
      xAxis.get("renderer").grid.template.setAll({
        stroke: am5.color("#e5e7eb"),
        strokeOpacity: 0.5,
      });
    } else {
      // Vertical stacked bar
      xAxis = chart.xAxes.push(
        am5xy.CategoryAxis.new(root, {
          categoryField: "category",
          renderer: am5xy.AxisRendererX.new(root, {
            minGridDistance: 30,
            cellStartLocation: 0.1,
            cellEndLocation: 0.9,
          }),
        })
      );

      yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: am5xy.AxisRendererY.new(root, { strokeOpacity: 0 }),
          min: 0,
          numberFormat: "#.#a",
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

      yAxis.get("renderer").labels.template.setAll({
        fontSize: 12,
        fill: am5.color("#6b7280"),
      });
      yAxis.get("renderer").grid.template.setAll({
        stroke: am5.color("#e5e7eb"),
        strokeOpacity: 0.5,
      });

      // Axis labels
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
    }

    // Create stacked series
    seriesConfig.forEach((config, index) => {
      const barColor = config.color || COLORS[index % COLORS.length];
      
      const seriesSettings: am5xy.IColumnSeriesSettings = {
        name: config.name,
        xAxis: xAxis as am5xy.CategoryAxis<am5xy.AxisRenderer> | am5xy.ValueAxis<am5xy.AxisRenderer>,
        yAxis: yAxis as am5xy.CategoryAxis<am5xy.AxisRenderer> | am5xy.ValueAxis<am5xy.AxisRenderer>,
        stacked: true,
        tooltip: am5.Tooltip.new(root, {}),
      };

      if (horizontal) {
        seriesSettings.valueXField = config.field;
        seriesSettings.categoryYField = "category";
      } else {
        seriesSettings.valueYField = config.field;
        seriesSettings.categoryXField = "category";
      }

      const series = chart.series.push(
        am5xy.ColumnSeries.new(root, seriesSettings)
      );

      series.columns.template.setAll({
        strokeOpacity: 0,
        fill: am5.color(barColor),
        ...(horizontal 
          ? { cornerRadiusTR: index === seriesConfig.length - 1 ? 4 : 0, cornerRadiusBR: index === seriesConfig.length - 1 ? 4 : 0 }
          : { cornerRadiusTL: index === seriesConfig.length - 1 ? 4 : 0, cornerRadiusTR: index === seriesConfig.length - 1 ? 4 : 0 }
        ),
      });

      series.columns.template.states.create("hover", {
        shadowBlur: 5,
        shadowColor: am5.color("#000000"),
        shadowOpacity: 0.1,
      });

      // Format tooltip with large number formatting
      const valueField = horizontal ? "valueX" : "valueY";
      series.get("tooltip")?.adapters.add("labelText", (_text, target) => {
        const dataItem = target.dataItem as am5.DataItem<am5xy.IColumnSeriesDataItem> | undefined;
        if (dataItem) {
          const val = dataItem.get(valueField as "valueY") as number;
          return `${config.name}: ${formatLargeNumber(val)}`;
        }
        return `${config.name}: {${valueField}}`;
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
      legend.labels.template.setAll({
        fontSize: 12,
        fill: am5.color("#374151"),
      });
      legend.valueLabels.template.set("forceHidden", true);
      legend.data.setAll(chart.series.values);
    }

    if (horizontal) {
      (yAxis as am5xy.CategoryAxis<am5xy.AxisRenderer>).data.setAll(data);
    } else {
      (xAxis as am5xy.CategoryAxis<am5xy.AxisRenderer>).data.setAll(data);
    }
    
    chart.appear(1000, 100);

    return () => root.dispose();
  }, [data, seriesConfig, showLegend, horizontal, xLabel, yLabel]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
