import type * as am5xy from "@amcharts/amcharts5/xy";

/** Use whole-number ticks for small integer counts (e.g. project counts). */
export function shouldUseIntegerValueAxis(
  values: number[],
  axisLabel?: string
): boolean {
  if (values.length === 0) return false;

  const allIntegers = values.every(
    (v) => Number.isFinite(v) && Math.abs(v - Math.round(v)) < 1e-9
  );
  if (!allIntegers) return false;

  const max = Math.max(...values, 0);
  const label = (axisLabel ?? "").toLowerCase();
  const countLikeLabel =
    /\b(count|number|#|quantity|units|projects|items|total|employees|people|headcount)\b/.test(
      label
    );

  return countLikeLabel || max <= 50;
}

export function applyValueAxisFormat(
  axis: am5xy.ValueAxis<am5xy.AxisRenderer>,
  values: number[],
  axisLabel?: string
): void {
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
    return;
  }

  axis.setAll({
    numberFormat: "#.#a",
    maxPrecision: 1,
    min: 0,
    strictMinMax: false,
  });
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
  if (shouldUseIntegerValueAxis([value], axisLabel)) {
    return String(Math.round(value));
  }
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(1);
}
