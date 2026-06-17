"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { getChartColors } from "./chart-theme";

const COLORS = [
  "#7BB5D8",
  "#7294D6",
  "#6A72D5",
  "#7D69D5",
  "#9B6BD5",
  "#BA6DD6",
  "#CD6FC9",
  "#CD6FA9",
  "#CD6F89",
  "#CD716C",
];

interface DonutChartData {
  category: string;
  value: number;
}

function formatLargeNumber(value: number, isCurrency: boolean = true): string {
  const abs = Math.abs(value);
  const prefix = isCurrency ? "" : "";
  if (abs >= 1e12) return prefix + (value / 1e12).toFixed(1).replace(/\.0/, "") + "T";
  if (abs >= 1e9) return prefix + (value / 1e9).toFixed(1).replace(/\.0/, "") + "B";
  if (abs >= 1e6) return prefix + (value / 1e6).toFixed(1).replace(/\.0/, "") + "M";
  if (abs >= 1e3) return prefix + (value / 1e3).toFixed(1).replace(/\.0/, "") + "K";
  return prefix + value.toLocaleString();
}

const MIN_LABEL_PERCENT = 5;

interface DonutChartProps {
  data?: DonutChartData[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  innerRadius?: number;
  centerLabel?: string;
  centerValue?: number;
  isCurrency?: boolean;
  isFullScreen?: boolean;
  onSliceClick?: (category: string, value: number, index: number) => void;
  onSliceRightClick?: (category: string, value: number, index: number, x: number, y: number) => void;
}

const defaultData: DonutChartData[] = [
  { category: "Lithuania", value: 501 },
  { category: "Czechia", value: 301 },
  { category: "Ireland", value: 201 },
  { category: "Germany", value: 165 },
  { category: "Australia", value: 139 },
  { category: "Austria", value: 128 },
];

export function DonutChart({ 
  data = defaultData, 
  height = 400, 
  className,
  showLegend = true,
  innerRadius = 50,
  isFullScreen = false,
  centerLabel,
  centerValue,
  isCurrency = true,
  onSliceClick,
  onSliceRightClick,
}: DonutChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const onSliceClickRef = useRef(onSliceClick);
  const onSliceRightClickRef = useRef(onSliceRightClick);
  onSliceClickRef.current = onSliceClick;
  onSliceRightClickRef.current = onSliceRightClick;

  useLayoutEffect(() => {
    if (!chartRef.current) return;
    const colors = getChartColors();

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: am5.percent(innerRadius),
        paddingLeft: 10,
        paddingRight: 10,
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "category",
        alignLabels: true,
      })
    );

    series.get("colors")?.set("colors", COLORS.map(c => am5.color(c)));

    // No gaps: zero stroke, adaptive corner radius
   series.slices.template.setAll({
      strokeOpacity: 0,
      cornerRadius: 5,
      toggleKey: "none" as any,
    });

    series.slices.template.states.create("hover", {
      scale: 1.05,
    });

    series.slices.template.states.create("active", {
      scale: 1.05,
      shiftRadius: 0.03,
    });

    if (onSliceClickRef.current || onSliceRightClickRef.current) {
      series.slices.template.set("cursorOverStyle", "pointer");
      
      // Left click handler
      if (onSliceClickRef.current) {
        series.slices.template.events.on("click", (ev) => {
          const dataItem = ev.target.dataItem as am5.DataItem<am5percent.IPieSeriesDataItem> | undefined;
          if (dataItem && onSliceClickRef.current) {
            const cat = dataItem.get("category") as string;
            const val = dataItem.get("value") as number;
            const idx = series.dataItems.indexOf(dataItem);
            onSliceClickRef.current(cat, val, idx);
          }
        });
      }
      
      // Right click handler
      if (onSliceRightClickRef.current) {
        series.slices.template.events.on("rightclick", (ev) => {
          const dataItem = ev.target.dataItem as am5.DataItem<am5percent.IPieSeriesDataItem> | undefined;
          if (dataItem && onSliceRightClickRef.current) {
            const cat = dataItem.get("category") as string;
            const val = dataItem.get("value") as number;
            const idx = series.dataItems.indexOf(dataItem);
            const originalEvent = ev.originalEvent as PointerEvent;
            onSliceRightClickRef.current(cat, val, idx, originalEvent.clientX, originalEvent.clientY);
          }
        });
      }
    }

    // Configure labels to appear outside with tick lines
    series.labels.template.setAll({
      fontSize: isFullScreen ? 14 : 10,
      fill: am5.color(colors.axisLabel),
      text: "{category}",
      textType: "circular",
      radius: isFullScreen ? 20 : 15,
      maxWidth: isFullScreen ? 150 : 100,
      oversizedBehavior: isFullScreen ? "truncate" : "wrap",
      ellipsis: isFullScreen ? "..." : undefined,
    });

    series.labels.template.adapters.add(
      "text",
      (_text: any, target: any) => {
        const category = target.dataItem?.get("category");
        if (category) {
          return `${category}`;
        }
        return _text;
      }
    );

    // Configure tick lines connecting slices to labels
    series.ticks.template.setAll({
      stroke: am5.color(colors.axisLabel),
      strokeWidth: 0.5,
      strokeOpacity: 0.3,
      length: 8,
    });

    // Tooltip
    series.slices.template.adapters.add(
      "tooltipText",
      (_text: any, target: any) => {
        const value = target.dataItem?.get("value");
        const category = target.dataItem?.get("category");
        const percent = target.dataItem?.get("valuePercentTotal");
        if (value && category && percent !== undefined) {
          const fv = formatLargeNumber(value, isCurrency);
          return `${category}\n${fv} (${percent.toFixed(1)}%)`;
        }
        return _text;
      }
    );

    // Center label
    if (centerLabel || centerValue != null) {
      const container = chart.seriesContainer.children.push(
        am5.Container.new(root, {
          centerX: am5.percent(50),
          centerY: am5.percent(50),
          x: am5.percent(0),
          y: am5.percent(0),
          layout: root.verticalLayout,
        })
      );

      if (centerLabel) {
        container.children.push(
          am5.Label.new(root, {
            text: centerLabel,
            centerX: am5.percent(50),
            x: am5.percent(50),
            fontSize: 12,
            fill: am5.color(colors.axisLabel),
            fontWeight: "400",
          })
        );
      }

      if (centerValue != null) {
        container.children.push(
          am5.Label.new(root, {
            text: formatLargeNumber(centerValue),
            centerX: am5.percent(50),
            x: am5.percent(50),
            fontSize: 20,
            fill: am5.color("#111827"),
            fontWeight: "600",
          })
        );
      }
    }

    if (showLegend) {
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          marginTop: 15,
          marginBottom: 15,
        })
      );
      
      legend.labels.template.setAll({
        fontSize: 13,
        fontWeight: "400",
        fill: am5.color(colors.legend),
      });
      
      legend.valueLabels.template.setAll({
        fontSize: 13,
        fontWeight: "500",
        fill: am5.color(colors.legend),
      });

      legend.markers.template.setAll({
        width: 12,
        height: 12,
      });

      legend.data.setAll(series.dataItems);
    }

    series.data.setAll(data);
    series.appear(1000, 100);

    return () => root.dispose();
  }, [data, showLegend, innerRadius, centerLabel, centerValue, isFullScreen, isCurrency]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}