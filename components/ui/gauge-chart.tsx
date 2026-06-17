"use client";

import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface GaugeChartProps {
  value?: number;
  min?: number;
  max?: number;
  height?: number;
  className?: string;
  label?: string;
  showGradient?: boolean;
}

export function GaugeChart({ 
  value = 72, 
  min = 0,
  max = 100,
  height = 300, 
  className,
  label = "Performance",
  showGradient = true,
}: GaugeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    root._logo?.dispose();
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5radar.RadarChart.new(root, {
        panX: false,
        panY: false,
        startAngle: 180,
        endAngle: 360,
        innerRadius: am5.percent(80),
      })
    );

    // Create axis renderer
    const axisRenderer = am5radar.AxisRendererCircular.new(root, {
      innerRadius: -10,
      strokeOpacity: 0,
      minGridDistance: 30,
    });

    axisRenderer.labels.template.setAll({
      fontSize: 10,
      fill: am5.color("#6b7280"),
      radius: 15,
    });

    axisRenderer.grid.template.setAll({
      stroke: am5.color("#e5e7eb"),
      strokeOpacity: 0.3,
    });

    // Create axis
    const axis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0,
        min: min,
        max: max,
        strictMinMax: true,
        renderer: axisRenderer,
      })
    );

    // Create background band with gradient
    if (showGradient) {
      const rangeDataItem1 = axis.makeDataItem({ value: min, endValue: max * 0.33 });
      axis.createAxisRange(rangeDataItem1);
      rangeDataItem1.get("axisFill")?.setAll({
        visible: true,
        fill: am5.color("#F87171"),
        fillOpacity: 0.8,
      });

      const rangeDataItem2 = axis.makeDataItem({ value: max * 0.33, endValue: max * 0.66 });
      axis.createAxisRange(rangeDataItem2);
      rangeDataItem2.get("axisFill")?.setAll({
        visible: true,
        fill: am5.color("#FBBF24"),
        fillOpacity: 0.8,
      });

      const rangeDataItem3 = axis.makeDataItem({ value: max * 0.66, endValue: max });
      axis.createAxisRange(rangeDataItem3);
      rangeDataItem3.get("axisFill")?.setAll({
        visible: true,
        fill: am5.color("#34D399"),
        fillOpacity: 0.8,
      });
    }

    // Add clock hand
    const handDataItem = axis.makeDataItem({ value: value });
    
    const hand = handDataItem.set("bullet", am5xy.AxisBullet.new(root, {
      sprite: am5radar.ClockHand.new(root, {
        radius: am5.percent(90),
        innerRadius: am5.percent(0),
        pinRadius: 14,
        topWidth: 8,
        bottomWidth: 8,
      }),
    }));

    const clockHand = hand.get("sprite") as am5radar.ClockHand | undefined;
    if (clockHand) {
      clockHand.hand.setAll({
        fill: am5.color("#374151"),
        stroke: am5.color("#374151"),
      });

      clockHand.pin.setAll({
        fill: am5.color("#374151"),
        stroke: am5.color("#ffffff"),
        strokeWidth: 2,
      });
    }

    axis.createAxisRange(handDataItem);

    // Center value label
    chart.children.push(
      am5.Label.new(root, {
        text: `${value}`,
        fontSize: 32,
        fontWeight: "600",
        fill: am5.color("#374151"),
        centerX: am5.percent(50),
        centerY: am5.percent(50),
        x: am5.percent(50),
        y: am5.percent(65),
      })
    );

    // Label below value
    if (label) {
      chart.children.push(
        am5.Label.new(root, {
          text: label,
          fontSize: 12,
          fill: am5.color("#6b7280"),
          centerX: am5.percent(50),
          x: am5.percent(50),
          y: am5.percent(78),
        })
      );
    }

    // Animate hand on load
    handDataItem.animate({
      key: "value",
      from: min,
      to: value,
      duration: 1000,
      easing: am5.ease.out(am5.ease.cubic),
    });

    chart.appear(1000, 100);

    return () => root.dispose();
  }, [value, min, max, label, showGradient]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
