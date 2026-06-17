"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Check,
  X,
  Edit2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type SortDir = "asc" | "desc" | null;

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  editable?: boolean;
  width?: string;
  render?: (value: unknown) => React.ReactNode;
}

interface NormalizationTableProps<T extends Record<string, unknown>> {
  columns: Column[];
  data: T[];
  idKey: string;
  rawNameKey: string;
  normNameKey: string;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  onUpdate: (id: string, rawName: string, normName: string) => Promise<{ message: string }>;
  onLoadMore?: () => void;
  total: number;
  onSort?: (column: string, direction: "asc" | "desc" | null) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

const ROW_HEIGHT = 48;
const CHECKBOX_W = 40;
const ACTIONS_W = 80;
const MIN_COL_W = 80;
const REF_WIDTH = 1200;

export function NormalizationTable<T extends Record<string, unknown>>({
  columns,
  data,
  idKey,
  rawNameKey,
  normNameKey,
  isLoading,
  isFetchingMore,
  hasMore,
  onUpdate,
  onLoadMore,
  total,
  onSort,
  selectedIds,
  onSelectionChange,
}: NormalizationTableProps<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Independent column widths (pixels) ───────────────────────────────────
  const colKey = columns.map((c) => c.key).join(",");

  const defaultColWidths = useMemo(
    () =>
      columns.map((col) => {
        const pct = parseFloat(col.width ?? "0");
        return Math.round((pct / 100) * REF_WIDTH) || 140;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colKey]
  );

  const [colWidths, setColWidths] = useState<number[]>(defaultColWidths);

  useEffect(() => {
    setColWidths(defaultColWidths);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colKey]);

  // ── Column drag-resize ───────────────────────────────────────────────────
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, colIdx: number) => {
      e.preventDefault();
      const startX = e.clientX;
      const startW = colWidths[colIdx];

      const onMove = (ev: MouseEvent) => {
        const newW = Math.max(MIN_COL_W, startW + ev.clientX - startX);
        setColWidths((prev) => {
          const next = [...prev];
          next[colIdx] = newW;
          return next;
        });
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [colWidths]
  );

  // ── Selection ────────────────────────────────────────────────────────────
  const getRowId = useCallback(
    (row: T) => `${String(row[idKey])}-${String(row[rawNameKey])}`,
    [idKey, rawNameKey]
  );
  const allRowIds = useMemo(() => data.map(getRowId), [data, getRowId]);
  const allSelected =
    !!selectedIds && allRowIds.length > 0 && allRowIds.every((id) => selectedIds.has(id));
  const someSelected =
    !!selectedIds && !allSelected && allRowIds.some((id) => selectedIds.has(id));

  const toggleRow = useCallback(
    (row: T) => {
      if (!onSelectionChange || !selectedIds) return;
      const id = getRowId(row);
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange, getRowId]
  );

  const toggleAll = useCallback(() => {
    if (!onSelectionChange || selectedIds === undefined) return;
    const next = new Set(selectedIds);
    if (allSelected) allRowIds.forEach((id) => next.delete(id));
    else allRowIds.forEach((id) => next.add(id));
    onSelectionChange(next);
  }, [allSelected, allRowIds, selectedIds, onSelectionChange]);

  // ── Virtualizer ──────────────────────────────────────────────────────────
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalVirtualHeight = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalVirtualHeight - virtualItems[virtualItems.length - 1].end
      : 0;

  useEffect(() => {
    if (!hasMore || isFetchingMore || !onLoadMore || virtualItems.length === 0) return;
    const last = virtualItems[virtualItems.length - 1];
    if (last && last.index >= data.length - 20) onLoadMore();
  }, [virtualItems, data.length, hasMore, isFetchingMore, onLoadMore]);

  // ── Sort ─────────────────────────────────────────────────────────────────
  const handleSort = useCallback(
    (col: string) => {
      const column = columns.find((c) => c.key === col);
      if (!column?.sortable) return;
      let newDir: SortDir = null;
      if (sortCol === col) {
        if (sortDir === "asc") newDir = "desc";
        else if (sortDir === "desc") newDir = null;
        else newDir = "asc";
      } else {
        newDir = "asc";
      }
      setSortCol(newDir ? col : null);
      setSortDir(newDir);
      onSort?.(col, newDir);
    },
    [sortCol, sortDir, columns, onSort]
  );

  // ── Edit ─────────────────────────────────────────────────────────────────
  const startEdit = useCallback(
    (row: T, currentValue: string | null) => {
      setEditingRow(getRowId(row));
      setEditValue(currentValue || "");
    },
    [getRowId]
  );
  const cancelEdit = useCallback(() => {
    setEditingRow(null);
    setEditValue("");
  }, []);
  const saveEdit = useCallback(
    async (row: T) => {
      if (isUpdating) return;
      const id = String(row[idKey]);
      const rawName = String(row[rawNameKey]);
      const trimmed = editValue.trim();
      if (!trimmed) { toast.error("Normalized name cannot be empty"); return; }
      if (trimmed === row[normNameKey]) { cancelEdit(); return; }
      setIsUpdating(true);
      try {
        const res = await onUpdate(id, rawName, trimmed);
        toast.success(res.message || "Updated successfully");
        cancelEdit();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      } finally {
        setIsUpdating(false);
      }
    },
    [editValue, idKey, rawNameKey, normNameKey, onUpdate, cancelEdit, isUpdating]
  );

  const SortIcon = ({ col }: { col: string }) => {
    const column = columns.find((c) => c.key === col);
    if (!column?.sortable) return null;
    if (sortCol !== col)
      return <ChevronsUpDown className="inline h-3 w-3 ml-1 opacity-40 shrink-0" />;
    return sortDir === "asc"
      ? <ChevronUp className="inline h-3 w-3 ml-1 shrink-0" />
      : <ChevronDown className="inline h-3 w-3 ml-1 shrink-0" />;
  };

  const hasCheckbox = selectedIds !== undefined;
  const totalTableWidth =
    (hasCheckbox ? CHECKBOX_W : 0) +
    colWidths.reduce((s, w) => s + w, 0) +
    ACTIONS_W;

  // ── Header ───────────────────────────────────────────────────────────────
  const Header = (
    <div
      className="sticky top-0 z-10 bg-gray-50 border-b border-border-mid flex items-center shrink-0"
      style={{ width: totalTableWidth, minWidth: "100%" }}
    >
      {hasCheckbox && (
        <div className="flex items-center justify-center px-3 shrink-0" style={{ width: CHECKBOX_W }}>
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={toggleAll}
            className="data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700 data-[state=indeterminate]:bg-slate-700 data-[state=indeterminate]:border-slate-700"
          />
        </div>
      )}

      {columns.map((col, idx) => (
        <div
          key={col.key}
          className="relative flex items-center shrink-0"
          style={{ width: colWidths[idx] }}
        >
          <div
            onClick={() => handleSort(col.key)}
            className={`flex-1 flex items-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider overflow-hidden ${
              col.sortable ? "cursor-pointer select-none hover:text-text-primary" : ""
            }`}
          >
            <span className="truncate">{col.label}</span>
            <SortIcon col={col.key} />
          </div>

          {/* Drag resize handle */}
          <div
            onMouseDown={(e) => handleResizeStart(e, idx)}
            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize flex items-center justify-center group z-10"
            title="Drag to resize"
          >
            <div className="w-px h-5 bg-border-mid group-hover:bg-slate-400 transition-colors" />
          </div>
        </div>
      ))}

      <div
        className="flex items-center justify-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider shrink-0"
        style={{ width: ACTIONS_W }}
      >
        Actions
      </div>
    </div>
  );

  // ── Body row ──────────────────────────────────────────────────────────────
  const renderRow = (row: T, key: number) => {
    const rowId = getRowId(row);
    const isEditing = editingRow === rowId;
    const isSelected = selectedIds?.has(rowId);

    return (
      <div
        key={key}
        style={{ height: ROW_HEIGHT, width: totalTableWidth, minWidth: "100%" }}
        className={`flex items-center border-b border-border-subtle transition-colors ${
          isSelected ? "bg-blue-50/50" : "hover:bg-hover/50"
        }`}
      >
        {hasCheckbox && (
          <div className="flex items-center px-3 shrink-0" style={{ width: CHECKBOX_W }}>
            <Checkbox
              checked={!!isSelected}
              onCheckedChange={() => toggleRow(row)}
              className="data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700"
            />
          </div>
        )}

        {columns.map((col, idx) => {
          const value = row[col.key];
          const isEditableCell = col.editable && col.key === normNameKey;

          if (isEditing && isEditableCell) {
            return (
              <div key={col.key} className="px-4 shrink-0 overflow-hidden" style={{ width: colWidths[idx] }}>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(row);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                  disabled={isUpdating}
                  className="w-full px-2 py-1.5 border border-border-strong rounded text-sm text-text-primary outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>
            );
          }

          return (
            <div key={col.key} className="px-4 shrink-0 overflow-hidden" style={{ width: colWidths[idx] }}>
              <div className="truncate text-sm text-text-primary">
                {col.render
                  ? col.render(value)
                  : value === null || value === undefined
                    ? <span className="text-text-tertiary">—</span>
                    : String(value)}
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-center shrink-0" style={{ width: ACTIONS_W }}>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button onClick={() => saveEdit(row)} disabled={isUpdating} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50" title="Save">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={cancelEdit} disabled={isUpdating} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50" title="Cancel">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => startEdit(row, String(row[normNameKey] || ""))} className="p-1 text-text-tertiary hover:text-text-primary hover:bg-hover rounded transition-colors" title="Edit">
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Skeleton row ─────────────────────────────────────────────────────────
  const SkeletonRow = (i: number) => (
    <div key={i} style={{ height: ROW_HEIGHT }} className="flex items-center border-b border-border-subtle">
      {hasCheckbox && <div className="px-3 shrink-0" style={{ width: CHECKBOX_W }}><div className="h-4 w-4 bg-gray-100 rounded animate-pulse" /></div>}
      {columns.map((col) => (
        <div key={col.key} className="px-4 shrink-0 overflow-hidden" style={{ width: 140 }}>
          <div className="h-5 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
      <div className="shrink-0" style={{ width: ACTIONS_W }}><div className="h-5 w-12 bg-gray-100 rounded animate-pulse mx-auto" /></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-auto rounded-t-lg border border-border-mid"
      >
        {Header}

        {isLoading && data.length === 0 ? (
          <div className="bg-card">{Array.from({ length: 12 }).map((_, i) => SkeletonRow(i))}</div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-text-tertiary">
            No records found
          </div>
        ) : (
          <div className="bg-card">
            {paddingTop > 0 && <div style={{ height: paddingTop }} />}
            {virtualItems.map((vr) => renderRow(data[vr.index], vr.index))}
            {paddingBottom > 0 && <div style={{ height: paddingBottom }} />}
          </div>
        )}

        {isFetchingMore && (
          <div className="flex items-center justify-center gap-2 py-3 text-text-tertiary border-t border-border-subtle">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        )}
      </div>

      {!isLoading && data.length > 0 && (
        <div className="flex items-center px-4 py-2.5 bg-card border-x border-b border-border-mid rounded-b-lg shrink-0">
          <div className="text-xs text-text-secondary">
            Showing <span className="font-medium text-text-primary">{data.length.toLocaleString()}</span> of{" "}
            <span className="font-medium text-text-primary">{total.toLocaleString()}</span> records
          </div>
        </div>
      )}
    </div>
  );
}
