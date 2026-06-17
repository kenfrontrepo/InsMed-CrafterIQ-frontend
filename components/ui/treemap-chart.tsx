"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5hierarchy from "@amcharts/amcharts5/hierarchy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

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

interface TreemapNode {
  name: string;
  value?: number;
  children?: TreemapNode[];
}

interface TreemapChartProps {
  data?: TreemapNode;
  height?: number;
  className?: string;
  showLabels?: boolean;
}

const defaultData: TreemapNode = {
  name: "Root",
  children: [
    {
      name: "Technology",
      children: [
        { name: "Software", value: 250 },
        { name: "Hardware", value: 180 },
        { name: "Services", value: 120 },
      ],
    },
    {
      name: "Finance",
      children: [
        { name: "Banking", value: 200 },
        { name: "Insurance", value: 150 },
        { name: "Investment", value: 100 },
      ],
    },
    {
      name: "Healthcare",
      children: [
        { name: "Pharma", value: 180 },
        { name: "Medical Devices", value: 120 },
        { name: "Services", value: 80 },
      ],
    },
    {
      name: "Retail",
      children: [
        { name: "E-commerce", value: 160 },
        { name: "Stores", value: 100 },
      ],
    },
  ],
};

export function TreemapChart({ 
  data = defaultData, 
  height = 400, 
  className,
  showLabels = true,
}: TreemapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);

    const container = root.container.children.push(
      am5.Container.new(root, {
        width: am5.percent(100),
        height: am5.percent(100),
        layout: root.verticalLayout,
      })
    );

    // Create series
    const series = container.children.push(
      am5hierarchy.Treemap.new(root, {
        valueField: "value",
        categoryField: "name",
        childDataField: "children",
        layoutAlgorithm: "squarify",
        nodePaddingOuter: 4,
        nodePaddingInner: 2,
      })
    );

    // Set colors
    series.get("colors")?.set("colors", COLORS.map(c => am5.color(c)));

    // Configure rectangles
    series.rectangles.template.setAll({
      strokeWidth: 2,
      stroke: am5.color("#ffffff"),
      cornerRadiusTL: 4,
      cornerRadiusTR: 4,
      cornerRadiusBL: 4,
      cornerRadiusBR: 4,
      tooltipText: "{name}: {value}",
    });

    series.rectangles.template.states.create("hover", {
      shadowBlur: 10,
      shadowColor: am5.color("#000000"),
      shadowOpacity: 0.2,
    });

    // Configure labels
    if (showLabels) {
      series.labels.template.setAll({
        fontSize: 11,
        fill: am5.color("#ffffff"),
        text: "{name}",
        oversizedBehavior: "truncate",
        maxWidth: 100,
      });
    } else {
      series.labels.template.set("visible", false);
    }

    // Set data
    series.data.setAll([data]);
    series.set("selectedDataItem", series.dataItems[0]);

    series.appear(1000, 100);

    return () => root.dispose();
  }, [data, showLabels]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
