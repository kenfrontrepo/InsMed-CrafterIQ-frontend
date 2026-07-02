import type * as am5 from "@amcharts/amcharts5";
import type * as am5xy from "@amcharts/amcharts5/xy";

/** Disable K/M/m adaptive axis labels (e.g. 800m, 100M) on value axes. */
export function configureChartNumberFormatter(root: am5.Root): void {
  root.numberFormatter.set("bigNumberPrefixes", []);
  root.numberFormatter.set("smallNumberPrefixes", []);
  root.numberFormatter.set("numberFormat", "#");
}

export function mergeFormatContext(
  ...parts: (string | undefined | null)[]
): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
}

function allValuesAreIntegers(values: number[]): boolean {
  return values.every(
    (v) => Number.isFinite(v) && Math.abs(v - Math.round(v)) < 1e-9
  );
}

function labelContext(
  formatContext?: string,
  seriesLabel?: string
): string {
  return mergeFormatContext(formatContext, seriesLabel).toLowerCase();
}

/** Counts, percentages, and other non-currency metrics — never prefix with $. */
export function isCountLikeLabel(
  formatContext?: string,
  seriesLabel?: string
): boolean {
  const label = labelContext(formatContext, seriesLabel);
  if (!label) return false;
  return /\b(count|number|#|quantity|units|projects?|items|employees|people|headcount|quarter|year|status|percent|%|rate|ratio|off track)\b/.test(
    label
  );
}

/** Budget, spend, and other currency metrics — show $ prefix. */
export function isCurrencyLikeLabel(
  formatContext?: string,
  seriesLabel?: string
): boolean {
  const label = labelContext(formatContext, seriesLabel);
  if (!label) return false;

  return /\b(budget|cost|costs|price|revenue|revenues|spend|spending|amount|fee|fees|salary|salaries|wage|investment|capital|expense|expenses|dollar|usd|savings|funding|allocation|financial|money|payment|payments|requested)\b/.test(
    label
  );
}

/** Use whole-number ticks for counts and small integer series (e.g. quarters 1–4). */
export function shouldUseIntegerValueAxis(
  values: number[],
  formatContext?: string,
  seriesLabel?: string
): boolean {
  if (values.length === 0) return false;

  const allIntegers = allValuesAreIntegers(values);
  if (!allIntegers) return false;

  const max = Math.max(...values, 0);
  if (isCountLikeLabel(formatContext, seriesLabel)) return true;

  return max <= 500;
}

function formatPlainNumber(value: number, asInteger: boolean): string {
  if (asInteger) {
    return Math.round(value).toLocaleString("en-US");
  }

  if (Number.isInteger(value)) {
    return value.toLocaleString("en-US");
  }

  return value
    .toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
    .replace(/\.?0+$/, "");
}

function bindPlainAxisLabels(
  axis: am5xy.ValueAxis<am5xy.AxisRenderer>,
  formatContext?: string
): void {
  axis.get("renderer").labels.template.adapters.add("text", (text, target) => {
    const dataItem = target.dataItem as
      | am5.DataItem<am5xy.IValueAxisDataItem>
      | undefined;
    if (dataItem) {
      const value = dataItem.get("value");
      if (typeof value === "number" && Number.isFinite(value)) {
        return formatChartValue(value, formatContext);
      }
    }
    return text;
  });
}

export function applyValueAxisFormat(
  axis: am5xy.ValueAxis<am5xy.AxisRenderer>,
  values: number[],
  formatContext?: string
): void {
  if (values.length === 0) {
    axis.setAll({ numberFormat: "#", min: 0, maxPrecision: 0 });
    bindPlainAxisLabels(axis, formatContext);
    return;
  }

  if (shouldUseIntegerValueAxis(values, formatContext)) {
    const max = Math.max(...values, 0);
    const axisMax = Math.max(Math.ceil(max), 1);
    axis.setAll({
      numberFormat: "#",
      maxPrecision: 0,
      min: 0,
      max: axisMax,
      strictMinMax: true,
    });
    bindPlainAxisLabels(axis, formatContext);
    return;
  }

  if (allValuesAreIntegers(values)) {
    axis.setAll({
      numberFormat: "#",
      maxPrecision: 0,
      min: 0,
      strictMinMax: false,
    });
    bindPlainAxisLabels(axis, formatContext);
    return;
  }

  axis.setAll({
    numberFormat: "#.##",
    maxPrecision: 2,
    min: 0,
    strictMinMax: false,
  });
  bindPlainAxisLabels(axis, formatContext);
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

export function formatChartValue(
  value: number,
  formatContext?: string,
  seriesLabel?: string
): string {
  if (!Number.isFinite(value)) return "";

  const context = mergeFormatContext(formatContext, seriesLabel);
  const asInteger =
    shouldUseIntegerValueAxis([value], context) ||
    allValuesAreIntegers([value]);
  const plain = formatPlainNumber(value, asInteger);

  if (isCurrencyLikeLabel(context)) {
    return `$${plain}`;
  }

  return plain;
}