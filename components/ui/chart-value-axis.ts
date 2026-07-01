import type * as am5 from "@amcharts/amcharts5";
import type * as am5xy from "@amcharts/amcharts5/xy";

/** Disable K/M/m adaptive axis labels (e.g. 800m, 100M) on value axes. */
export function configureChartNumberFormatter(root: am5.Root): void {
  root.numberFormatter.set("bigNumberPrefixes", []);
  root.numberFormatter.set("smallNumberPrefixes", []);
  root.numberFormatter.set("numberFormat", "#");
}

function allValuesAreIntegers(values: number[]): boolean {
  return values.every(
    (v) => Number.isFinite(v) && Math.abs(v - Math.round(v)) < 1e-9
  );
}

/** Use whole-number ticks for counts and small integer series (e.g. quarters 1–4). */
export function shouldUseIntegerValueAxis(
  values: number[],
  axisLabel?: string
): boolean {
  if (values.length === 0) return false;

  const allIntegers = allValuesAreIntegers(values);
  if (!allIntegers) return false;

  const max = Math.max(...values, 0);
  const label = (axisLabel ?? "").toLowerCase();
  const countLikeLabel =
    /\b(count|number|#|quantity|units|projects?|items|total|employees|people|headcount|quarter|year|status)\b/.test(
      label
    );

  return countLikeLabel || max <= 500;
}

function bindPlainAxisLabels(
  axis: am5xy.ValueAxis<am5xy.AxisRenderer>,
  axisLabel?: string
): void {
  axis.get("renderer").labels.template.adapters.add("text", (text, target) => {
    const dataItem = target.dataItem as
      | am5.DataItem<am5xy.IValueAxisDataItem>
      | undefined;
    if (dataItem) {
      const value = dataItem.get("value");
      if (typeof value === "number" && Number.isFinite(value)) {
        return formatChartValue(value, axisLabel);
      }
    }
    return text;
  });
}

export function applyValueAxisFormat(
  axis: am5xy.ValueAxis<am5xy.AxisRenderer>,
  values: number[],
  axisLabel?: string
): void {
  if (values.length === 0) {
    axis.setAll({ numberFormat: "#", min: 0, maxPrecision: 0 });
    bindPlainAxisLabels(axis, axisLabel);
    return;
  }

  if (shouldUseIntegerValueAxis(values, axisLabel)) {
    const max = Math.max(...values, 0);
    const axisMax = Math.max(Math.ceil(max), 1);
    axis.setAll({
      numberFormat: "#",
      maxPrecision: 0,
      min: 0,
      max: axisMax,
      strictMinMax: true,
    });
    bindPlainAxisLabels(axis, axisLabel);
    return;
  }

  if (allValuesAreIntegers(values)) {
    axis.setAll({
      numberFormat: "#",
      maxPrecision: 0,
      min: 0,
      strictMinMax: false,
    });
    bindPlainAxisLabels(axis, axisLabel);
    return;
  }

  axis.setAll({
    numberFormat: "#.##",
    maxPrecision: 2,
    min: 0,
    strictMinMax: false,
  });
  bindPlainAxisLabels(axis, axisLabel);
}

export function extractSeriesValues(
  data: Record<string, string | number>[],
  fields: string[]
): number[] {
  const values: number[] = [];
  for (const row of data) {
    for (const field of fields) {
      const value = row[field];
      if (typeof value === "number" && Number.isFinite(value)) {
        values.push(value);
      }
    }
  }
  return values;
}

export function formatChartValue(value: number, axisLabel?: string): string {
  if (!Number.isFinite(value)) return "";
  if (shouldUseIntegerValueAxis([value], axisLabel)) {
    return String(Math.round(value));
  }
  if (allValuesAreIntegers([value])) {
    return String(Math.round(value));
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
