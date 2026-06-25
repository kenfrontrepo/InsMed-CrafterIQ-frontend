"use client";

import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ReportColumnHeaderMenu } from "@/components/report/report-column-header-menu";
import {
  buildColKeyMap,
  compareCellValues,
  getActiveFilterChips,
  getColumnFilterType,
  isColumnFilterActive,
  rowMatchesFilters,
  type DateFilter,
  type RangeFilter,
  type SortDir,
} from "@/components/report/table-filter-utils";

interface FilterableDataTableProps {
  columns: string[];
  data: Record<string, unknown>[];
  sortable?: boolean;
  emptyMessage?: string;
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
    if (!sortable) return;
    setSortCol(col);
    setSortDir(dir);
  }, [sortable]);

  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    return data.filter((row) =>
      rowMatchesFilters(
        row,
        columns,
        colKeyMap,
        dateFilters,
        textFilters,
        rangeFilters
      )
    );
  }, [data, columns, dateFilters, textFilters, rangeFilters, colKeyMap]);

  const displayData = useMemo(() => {
    if (!sortCol || !sortDir) return filteredData;
    const key = colKeyMap[sortCol] ?? sortCol;
    return [...filteredData].sort((a, b) => {
      const cmp = compareCellValues(a[key], b[key], sortCol);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortCol, sortDir, colKeyMap]);

  if (!columns.length) {
    return (
      <p className="text-xs text-text-tertiary py-4 text-center">{emptyMessage}</p>
    );
  }

  const activeFilters = getActiveFilterChips(
    columns,
    dateFilters,
    textFilters,
    rangeFilters
  );

  return (
    <div className="flex flex-col gap-4">
      {activeFilters.length > 0 && (
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
      )}

      <div className="overflow-auto max-h-[400px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {columns.map((col) => {
                const filterType = getColumnFilterType(col);
                const filterActive = isColumnFilterActive(
                  col,
                  dateFilters,
                  textFilters,
                  rangeFilters
                );

                return (
                  <th
                    key={col}
                    className="text-[10px] font-bold tracking-[0.8px] uppercase text-text-tertiary px-3 py-2 text-left border-b border-border-mid sticky top-0 bg-card z-[1] select-none hover:bg-hover transition-colors"
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {col}
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
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-xs text-text-tertiary text-center"
                >
                  {emptyMessage}
                </td>
              </tr>
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
