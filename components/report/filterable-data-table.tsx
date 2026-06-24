"use client";

import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { ReportColumnHeaderMenu } from "@/components/report/report-column-header-menu";

type SortDir = "asc" | "desc" | null;

type DateFilter = { from: string; to: string };

type RangeFilter = {
  min: number | null;
  max: number | null;
};

interface FilterableDataTableProps {
  columns: string[];
  data: Record<string, unknown>[];
  sortable?: boolean;
  emptyMessage?: string;
}

function isDateColumn(col: string): boolean {
  const normalized = col.toLowerCase().replace(/\s+/g, " ");
  return (
    normalized.includes("date") ||
    normalized.includes("last order") ||
    normalized.includes("target end") ||
    normalized.endsWith(" end")
  );
}

function parseDateValue(val: unknown): number | null {
  if (val === null || val === undefined || val === "" || val === "—") return null;
  const time = new Date(String(val)).getTime();
  return Number.isNaN(time) ? null : time;
}

function parseNumericValue(val: unknown): number | null {
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

function isNumericColumn(col: string): boolean {
  const normalized = col.toLowerCase();
  return (
    normalized.includes("revenue") ||
    normalized.includes("value") ||
    normalized.includes("prior year") ||
    normalized.includes("vs ") ||
    normalized.includes("budget") ||
    normalized.includes("complete") ||
    normalized.includes("%")
  );
}

function compareCellValues(a: unknown, b: unknown, col: string): number {
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

function buildColKeyMap(
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

export function FilterableDataTable({
  columns,
  data,
  sortable = true,
  emptyMessage = "No data available",
}: FilterableDataTableProps) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [dateFilters, setDateFilters] = useState<Record<string, DateFilter>>({});
  const [textFilters, setTextFilters] = useState<Record<string, string>>({});
  const [rangeFilters, setRangeFilters] = useState<Record<string, RangeFilter>>({});

  const colKeyMap = useMemo(() => buildColKeyMap(columns, data), [columns, data]);

  const handleSort = useCallback((col: string, dir: "asc" | "desc") => {
    setSortCol(col);
    setSortDir(dir);
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
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
          if (!filter) continue;
          const hasMin = filter.min !== null;
          const hasMax = filter.max !== null;
          if (!hasMin && !hasMax) continue;

          const numValue = parseNumericValue(row[key]);
          if (hasMin && (numValue === null || numValue < filter.min!)) {
            return false;
          }
          if (hasMax && (numValue === null || numValue > filter.max!)) {
            return false;
          }
        }

        const textFilter = textFilters[col];
        if (textFilter && !cellValue.includes(textFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [data, columns, dateFilters, textFilters, rangeFilters, colKeyMap]);

  const displayData = useMemo(() => {
    if (!sortCol || !sortDir) return filteredData;
    const key = colKeyMap[sortCol] ?? sortCol;
    return [...filteredData].sort((a, b) => {
      const cmp = compareCellValues(a[key], b[key], sortCol);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortCol, sortDir, colKeyMap]);

  if (!columns.length || !data.length) {
    return (
      <p className="text-xs text-text-tertiary py-4 text-center">{emptyMessage}</p>
    );
  }

  const getFilterType = (col: string): "text" | "date" | "range" | null => {
    if (!sortable) return null;
    if (isDateColumn(col)) return "date";
    if (isNumericColumn(col)) return "range";
    return "text";
  };

  const isFilterActive = (col: string): boolean => {
    const dateFilter = dateFilters[col];
    const textFilter = textFilters[col];
    const rangeFilter = rangeFilters[col];
    const hasDateFilter = Boolean(dateFilter?.from || dateFilter?.to);
    const hasTextFilter = Boolean(textFilter);
    const hasRangeFilter = rangeFilter
      ? rangeFilter.min !== null || rangeFilter.max !== null
      : false;
    return hasDateFilter || hasTextFilter || hasRangeFilter;
  };

  const activeFilters = columns.flatMap((col) => {
    const items: Array<{ col: string; type: "text" | "date" | "range"; value: string }> = [];

    const textFilter = textFilters[col];
    if (textFilter) {
      items.push({ col, type: "text", value: `${col}: "${textFilter}"` });
    }

    const dateFilter = dateFilters[col];
    if (dateFilter?.from || dateFilter?.to) {
      const from = dateFilter.from
        ? format(new Date(`${dateFilter.from}T00:00:00`), "MMM d")
        : "—";
      const to = dateFilter.to
        ? format(new Date(`${dateFilter.to}T00:00:00`), "MMM d")
        : "—";
      items.push({ col, type: "date", value: `${col}: ${from} to ${to}` });
    }

    const rangeFilter = rangeFilters[col];
    if (rangeFilter && (rangeFilter.min !== null || rangeFilter.max !== null)) {
      const min = rangeFilter.min !== null ? rangeFilter.min : "—";
      const max = rangeFilter.max !== null ? rangeFilter.max : "—";
      items.push({ col, type: "range", value: `${col}: ${min} to ${max}` });
    }

    return items;
  });

  return (
    <div className="flex flex-col gap-4">
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 px-3 py-3 bg-hover rounded-lg border border-border-subtle">
          <span className="text-xs font-semibold text-text-secondary">
            Active filters:
          </span>
          {activeFilters.map((filter, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (filter.type === "text") {
                  setTextFilters((prev) => {
                    const next = { ...prev };
                    delete next[filter.col];
                    return next;
                  });
                } else if (filter.type === "date") {
                  setDateFilters((prev) => {
                    const next = { ...prev };
                    delete next[filter.col];
                    return next;
                  });
                } else if (filter.type === "range") {
                  setRangeFilters((prev) => {
                    const next = { ...prev };
                    delete next[filter.col];
                    return next;
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-card border border-border-mid rounded-md text-xs text-text-primary hover:bg-hover transition-colors group cursor-pointer"
            >
              <span>{filter.value}</span>
              <X className="h-3 w-3 text-text-tertiary group-hover:text-text-primary transition-colors" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="overflow-auto max-h-[400px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => {
                const filterType = getFilterType(col);
                const filterActive = isFilterActive(col);

                return (
                  <th
                    key={col}
                    className="text-[10px] font-bold tracking-[0.8px] uppercase text-text-tertiary px-3 py-2 text-left border-b border-border-mid sticky top-0 bg-card z-[1] select-none hover:bg-hover transition-colors"
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {col}
                      {filterType ? (
                        <ReportColumnHeaderMenu
                          columnLabel={col}
                          filterType={filterType}
                          filterValue={
                            filterType === "date"
                              ? (dateFilters[col] ?? { from: "", to: "" })
                              : filterType === "range"
                                ? (rangeFilters[col] ?? { min: null, max: null })
                                : (textFilters[col] ?? null)
                          }
                          isActive={filterActive}
                          onSort={(dir) => handleSort(col, dir)}
                          onFilter={(value) => {
                            if (filterType === "text") {
                              setTextFilters((prev) => ({
                                ...prev,
                                [col]: value || "",
                              }));
                            }
                          }}
                          onDateChange={(from, to) => {
                            setDateFilters((prev) => ({
                              ...prev,
                              [col]: { from, to },
                            }));
                          }}
                          onRangeChange={(min, max) => {
                            setRangeFilters((prev) => ({
                              ...prev,
                              [col]: { min, max },
                            }));
                          }}
                          onClearFilter={() => {
                            if (filterType === "date") {
                              setDateFilters((prev) => {
                                const next = { ...prev };
                                delete next[col];
                                return next;
                              });
                            } else if (filterType === "range") {
                              setRangeFilters((prev) => {
                                const next = { ...prev };
                                delete next[col];
                                return next;
                              });
                            } else {
                              setTextFilters((prev) => {
                                const next = { ...prev };
                                delete next[col];
                                return next;
                              });
                            }
                          }}
                        />
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayData.length > 0 ? (
              displayData.map((row, i) => (
                <tr key={i} className="hover:bg-hover transition-colors">
                  {columns.map((col) => {
                    const key = colKeyMap[col] ?? col;
                    return (
                      <td
                        key={col}
                        className="px-3 py-2.5 text-[13px] text-text-primary border-b border-border-subtle"
                      >
                        {String(row[key] ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-xs text-text-tertiary text-center"
                >
                  No rows match the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
