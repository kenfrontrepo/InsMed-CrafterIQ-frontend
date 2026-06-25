import { format } from "date-fns";

export type SortDir = "asc" | "desc" | null;

export type DateFilter = { from: string; to: string };

export type RangeFilter = {
  min: number | null;
  max: number | null;
};

export type ColumnFilterType = "text" | "date" | "range";

/** Playpower report table column type detection */
export function isDateColumn(col: string): boolean {
  const normalized = col.toLowerCase().replace(/\s+/g, " ");
  return normalized.includes("date") || normalized.includes("last order");
}

export function parseDateValue(val: unknown): number | null {
  if (val === null || val === undefined || val === "" || val === "—") return null;
  const time = new Date(String(val)).getTime();
  return Number.isNaN(time) ? null : time;
}

export function parseNumericValue(val: unknown): number | null {
  if (val === null || val === undefined || val === "" || val === "—") return null;
  if (typeof val === "number") return val;

  const str = String(val).trim();
  if (!str || str.toLowerCase() === "new") return null;

  const pctMatch = str.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (pctMatch) return parseFloat(pctMatch[1]);

  const cleaned = str.replace(/[$,]/g, "");
  const numMatch = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*([KMB])?$/i);
  if (!numMatch) return null;

  let num = parseFloat(numMatch[1]);
  const suffix = numMatch[2]?.toUpperCase();
  if (suffix === "K") num *= 1_000;
  if (suffix === "M") num *= 1_000_000;
  if (suffix === "B") num *= 1_000_000_000;
  return num;
}

export function isNumericColumn(col: string): boolean {
  const normalized = col.toLowerCase();
  return (
    normalized.includes("revenue") ||
    normalized.includes("value") ||
    normalized.includes("prior year") ||
    normalized.includes("vs ")
  );
}

export function getColumnFilterType(col: string): ColumnFilterType {
  if (isDateColumn(col)) return "date";
  if (isNumericColumn(col)) return "range";
  return "text";
}

export function compareCellValues(a: unknown, b: unknown, col: string): number {
  if (isDateColumn(col)) {
    const aDate = parseDateValue(a);
    const bDate = parseDateValue(b);
    if (aDate === null && bDate === null) return 0;
    if (aDate === null) return 1;
    if (bDate === null) return -1;
    return aDate - bDate;
  }

  if (isNumericColumn(col)) {
    const aNum = parseNumericValue(a);
    const bNum = parseNumericValue(b);
    if (aNum !== null && bNum !== null) return aNum - bNum;
    if (aNum !== null) return -1;
    if (bNum !== null) return 1;
  }

  return String(a ?? "").localeCompare(String(b ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function buildColKeyMap(
  columns: string[],
  data: Record<string, unknown>[]
): Record<string, string> {
  if (data.length === 0) return {};
  const dataKeys = Object.keys(data[0]);
  const map: Record<string, string> = {};

  for (const col of columns) {
    const exact = dataKeys.find((k) => k === col);
    if (exact) {
      map[col] = exact;
      continue;
    }

    const lowerCol = col.toLowerCase().replace(/\s+/g, "_");
    const caseMatch = dataKeys.find(
      (k) => k.toLowerCase().replace(/\s+/g, "_") === lowerCol
    );
    if (caseMatch) {
      map[col] = caseMatch;
      continue;
    }

    const words = col.toLowerCase().split(/\s+/);
    const partial = dataKeys.find((k) => {
      const kLower = k.toLowerCase();
      return words.every((w) => kLower.includes(w));
    });
    map[col] = partial ?? col;
  }

  return map;
}

export function rowMatchesFilters(
  row: Record<string, unknown>,
  columns: string[],
  colKeyMap: Record<string, string>,
  dateFilters: Record<string, DateFilter>,
  textFilters: Record<string, string>,
  rangeFilters: Record<string, RangeFilter>
): boolean {
  for (const col of columns) {
    const key = colKeyMap[col] ?? col;
    const cellValue = String(row[key] ?? "").toLowerCase();

    if (isDateColumn(col)) {
      const filter = dateFilters[col];
      if (!filter?.from && !filter?.to) continue;

      const dateMs = parseDateValue(row[key]);
      if (filter.from) {
        const fromMs = new Date(`${filter.from}T00:00:00`).getTime();
        if (dateMs === null || dateMs < fromMs) return false;
      }
      if (filter.to) {
        const toMs = new Date(`${filter.to}T23:59:59`).getTime();
        if (dateMs === null || dateMs > toMs) return false;
      }
    }

    if (isNumericColumn(col)) {
      const filter = rangeFilters[col];
      if (
        !filter?.min &&
        filter?.min !== 0 &&
        !filter?.max &&
        filter?.max !== 0
      ) {
        continue;
      }

      const numValue = parseNumericValue(row[key]);
      if (filter?.min !== null && filter?.min !== undefined) {
        if (numValue === null || numValue < filter.min) return false;
      }
      if (filter?.max !== null && filter?.max !== undefined) {
        if (numValue === null || numValue > filter.max) return false;
      }
    }

    const textFilter = textFilters[col];
    if (textFilter && !cellValue.includes(textFilter.toLowerCase())) {
      return false;
    }
  }

  return true;
}

export function isColumnFilterActive(
  col: string,
  dateFilters: Record<string, DateFilter>,
  textFilters: Record<string, string>,
  rangeFilters: Record<string, RangeFilter>
): boolean {
  const dateFilter = dateFilters[col];
  const textFilter = textFilters[col];
  const rangeFilter = rangeFilters[col];
  const hasDateFilter = Boolean(dateFilter?.from || dateFilter?.to);
  const hasTextFilter = Boolean(textFilter);
  const hasRangeFilter = rangeFilter
    ? rangeFilter.min !== null || rangeFilter.max !== null
    : false;
  return hasDateFilter || hasTextFilter || hasRangeFilter;
}

export function getActiveFilterChips(
  columns: string[],
  dateFilters: Record<string, DateFilter>,
  textFilters: Record<string, string>,
  rangeFilters: Record<string, RangeFilter>
): Array<{ col: string; type: ColumnFilterType; value: string }> {
  const active: Array<{ col: string; type: ColumnFilterType; value: string }> =
    [];

  for (const col of columns) {
    const textFilter = textFilters[col];
    if (textFilter) {
      active.push({ col, type: "text", value: `${col}: "${textFilter}"` });
    }

    const dateFilter = dateFilters[col];
    if (dateFilter?.from || dateFilter?.to) {
      const from = dateFilter.from
        ? format(new Date(`${dateFilter.from}T00:00:00`), "MMM d")
        : "—";
      const to = dateFilter.to
        ? format(new Date(`${dateFilter.to}T00:00:00`), "MMM d")
        : "—";
      active.push({ col, type: "date", value: `${col}: ${from} to ${to}` });
    }

    const rangeFilter = rangeFilters[col];
    if (rangeFilter && (rangeFilter.min !== null || rangeFilter.max !== null)) {
      const min = rangeFilter.min !== null ? rangeFilter.min : "—";
      const max = rangeFilter.max !== null ? rangeFilter.max : "—";
      active.push({ col, type: "range", value: `${col}: ${min} to ${max}` });
    }
  }

  return active;
}
