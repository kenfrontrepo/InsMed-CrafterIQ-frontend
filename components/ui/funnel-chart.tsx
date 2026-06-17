"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const COLORS = [
  "#7BB5D8",
  "#7294D6",
  "#6A72D5",
  "#7D69D5",
  "#9B6BD5",
  "#BA6DD6",
];

interface FunnelChartData {
  category: string;
  value: number;
}

interface FunnelChartProps {
  data?: FunnelChartData[];
  height?: number;
  className?: string;
  showLabels?: boolean;
  showLegend?: boolean;
  orientation?: "vertical" | "horizontal";
}

const defaultData: FunnelChartData[] = [
  { category: "Visitors", value: 10000 },
  { category: "Leads", value: 5000 },
  { category: "Prospects", value: 2500 },
  { category: "Opportunities", value: 1200 },
  { category: "Customers", value: 600 },
];

export function FunnelChart({ 
  data = defaultData, 
  height = 400, 
  className,
  showLabels = true,
  showLegend = true,
  orientation = "vertical",
}: FunnelChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5percent.SlicedChart.new(root, {
        layout: root.verticalLayout,
      })
    );

    // Series
    const series = chart.series.push(
      am5percent.FunnelSeries.new(root, {
        valueField: "value",
        categoryField: "category",
        orientation: orientation,
        bottomRatio: 0.3,
        tooltip: am5.Tooltip.new(root, {
          labelText: "{category}: {value} ({valuePercentTotal.formatNumber('#.0')}%)",
        }),
      })
    );

    // Set colors
    series.get("colors")?.set("colors", COLORS.map(c => am5.color(c)));

    // Configure slices
    series.slices.template.setAll({
      strokeWidth: 2,
      stroke: am5.color("#ffffff"),
    });

    series.slices.template.states.create("hover", {
      scale: 1.02,
      shadowBlur: 10,
      shadowColor: am5.color("#000000"),
      shadowOpacity: 0.15,
    });

    // Labels
    if (showLabels) {
      series.labels.template.setAll({
        fontSize: 12,
        fill: am5.color("#374151"),
        text: "{category}: {value}",
      });
    } else {
      series.labels.template.set("visible", false);
      series.ticks.template.set("visible", false);
    }

    // Legend
    if (showLegend) {
      const legend = chart.children.push(
        am5.Legend.new(root, {
          centerX: am5.percent(50),
          x: am5.percent(50),
          marginTop: 15,
        })
      );
      legend.data.setAll(series.dataItems);
    }

    series.data.setAll(data);
    series.appear(1000, 100);

    return () => root.dispose();
  }, [data, showLabels, showLegend, orientation]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
