"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

/** Format large numbers with K / M / B suffixes */
function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "number") {
    if (Number.isNaN(val)) return "—";
    const abs = Math.abs(val);
    if (abs >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    // if (abs >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
    if (!Number.isInteger(val)) return val.toFixed(2);
    return val.toLocaleString();
  }
  return String(val);
}

type SortDir = "asc" | "desc" | null;

interface DataTableProps {
  columns: string[];
  data: Record<string, unknown>[];
  sortable?: boolean;
}

export function DataTable({ columns, data, sortable = true }: DataTableProps) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (col: string) => {
    if (!sortable) return;
    if (sortCol === col) {
      // Cycle: asc → desc → none
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortCol(null);
        setSortDir(null);
      }
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  // Find the actual data key for each display column
  const colKeyMap = useMemo(() => {
    if (data.length === 0) return {} as Record<string, string>;
    const dataKeys = Object.keys(data[0]);
    const map: Record<string, string> = {};
    for (const col of columns) {
      // Try exact match first, then case-insensitive, then partial match
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
      // Fallback — try to find a key that contains the column name words
      const words = col.toLowerCase().split(/\s+/);
      const partial = dataKeys.find((k) => {
        const kLower = k.toLowerCase();
        return words.every((w) => kLower.includes(w));
      });
      map[col] = partial ?? col;
    }
    return map;
  }, [columns, data]);

  const sortedData = useMemo(() => {
    if (!sortCol || !sortDir) return data;
    const key = colKeyMap[sortCol] ?? sortCol;
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir, colKeyMap]);

  const SortIcon = ({ col }: { col: string }) => {
    if (!sortable) return null;
    if (sortCol !== col)
      return <ChevronsUpDown className="inline h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-1" />
    );
  };

  return (
    <div className="overflow-auto rounded-lg border border-gray-200 h-full max-h-[400px]">
      <table className="w-full min-w-max text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                className={`px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${
                  sortable ? "cursor-pointer select-none hover:bg-gray-100" : ""
                }`}
              >
                {col}
                <SortIcon col={col} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedData.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="hover:bg-gray-50/80 transition-colors"
            >
              {columns.map((col) => {
                const key = colKeyMap[col] ?? col;
                const val = row[key];
                const isNumber = typeof val === "number";
                return (
                  <td
                    key={col}
                    className={`px-4 py-2.5 whitespace-nowrap text-gray-700 text-left ${
                      isNumber ? "tabular-nums font-medium" : ""
                    }`}
                  >
                    {formatValue(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400">
          No data available
        </div>
      )}
    </div>
  );
}
