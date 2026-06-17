"use client";

import { memo, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  MoreVertical,
  Maximize2,
  Download,
  GripVertical,
  X,
  Loader2,
  Check,
  Undo2,
  Bell,
} from "lucide-react";
import { ChatChart } from "@/components/chat/chat-chart";
import type { VisualSpec } from "@/stores/chat-store";
import { RefinePopover } from "./refine-popover";
import { AlertsPanel } from "./alerts-panel";
import { PinDetailsDialog } from "@/components/pins";
import type { PinItem } from "@/components/pins/types";
import {
  fetchReformatPreview,
  updateVisual as apiUpdateVisual,
} from "@/lib/api/boardsApi";
import { bulkUnassignPins } from "@/lib/api/pinsApi";

export type ChartType =
  | "bar"
  | "line"
  | "area"
  | "horizontal_bar"
  | "multi_line"
  | "grouped_bar"
  | "stacked_bar"
  | "combo"
  | "pie"
  | "donut"
  | "scatter"
  | "bubble"
  | "heatmap"
  | "funnel"
  | "waterfall"
  | "gauge"
  | "treemap"
  | "table"
  | "kpi_card";

export interface Pin {
  id: string;
  title: string;
  chartType: ChartType;
  trend: number;
  data: Array<{ category: string; value: number }>;
  /** Optional: for multi-series charts - when set, used instead of single value series */
  series?: Array<{ field: string; name: string; color?: string }>;
  /** Optional: raw VisualSpec from API - used when available (e.g. chat-sourced pins) */
  visualSpec?: VisualSpec;
  /** Axis labels from API */
  xLabel?: string;
  yLabel?: string;
  createdAt?: string;
  position?: number;
  size?: { width: number; height: number };
  /** Table data: column headers */
  tableColumns?: string[];
  /** Table data: rows as key-value records */
  tableData?: Record<string, unknown>[];
  /** Whether columns are sortable */
  tableSortable?: boolean;
}

/** Convert Pin data to VisualSpec for use with ChatChart */
function pinToVisualSpec(pin: Pin): VisualSpec {
  // Table pins — build a table VisualSpec
  if (pin.chartType === "table") {
    return {
      chart_type: "table",
      title: pin.title,
      x: [],
      x_label: "",
      y_label: "",
      is_visual: false,
      columns: pin.tableColumns,
      data: pin.tableData,
      sortable: pin.tableSortable,
    };
  }
  if (pin.visualSpec && "chart_type" in pin.visualSpec) {
    return pin.visualSpec as VisualSpec;
  }
  const x = pin.data.map((d) => d.category);
  const y = pin.data.map((d) => d.value);
  return {
    chart_type: pin.chartType,
    title: pin.title,
    x,
    y,
    x_label: pin.xLabel || "",
    y_label: pin.yLabel || "",
    is_visual: true,
  };
}

/** Minimal `PinItem` for `PinDetailsDialog` — API loads full markdown + visual by pin id */
function boardPinToPinItemStub(p: Pin): PinItem {
  const responseType: PinItem["response_type"] =
    p.chartType === "table" ? "note" : "chart";
  return {
    id: p.id,
    board_id: null,
    boards: [],
    conversation_id: "",
    message_id: "",
    response_type: responseType,
    title: p.title,
    is_refreshable: false,
    last_refreshed_at: "",
    refresh_count: 0,
    created_at: p.createdAt ?? "",
    pin_tags: null,
    schema_name: "",
  };
}

/* ── API helpers ─────────────────────────────────────────── */

async function fetchPreview(params: {
  boardId: string;
  userId: string;
  pin_id: string;
  chart_type: string;
}) {
  return fetchReformatPreview(params.boardId, params.userId, params.pin_id, params.chart_type);
}

async function updateVisual(params: {
  boardId: string;
  userId: string;
  pin_id: string;
  visual_spec: Record<string, unknown>;
}) {
  return apiUpdateVisual(params.boardId, params.userId, params.pin_id, params.visual_spec);
}

/* ── PinCard component ───────────────────────────────────── */

interface PinCardProps {
  pin: Pin;
  isWriteMode: boolean;
  boardId?: string;
  userId?: string;
  /** Computed chart height from the grid container (pixels) */
  chartHeight?: number;
}

export const PinCard = memo(function PinCard({
  pin,
  isWriteMode,
  boardId,
  userId,
  chartHeight,
}: PinCardProps) {
  const queryClient = useQueryClient();
  const visualSpec = useMemo(() => pinToVisualSpec(pin), [pin]);
  const [expanded, setExpanded] = useState(false);
  const [showPinDetails, setShowPinDetails] = useState(false);
  const [previewSpec, setPreviewSpec] = useState<VisualSpec | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    const el = chartContainerRef.current;
    if (!el) return;
    const toastId = toast.loading("Preparing export…");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `${pin.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Chart exported successfully", { id: toastId });
    } catch {
      toast.error("Export failed. Please try again.", { id: toastId });
    }
  }, [pin.title]);

  const handleExpand = useCallback(() => {
    if (userId) setShowPinDetails(true);
    else setExpanded(true);
  }, [userId]);

  const handleCloseExpanded = useCallback(() => setExpanded(false), []);

  // Preview mutation — fetches reformat/preview when user picks a chart type
  const previewMutation = useMutation({
    mutationFn: (chartType: string) =>
      fetchPreview({
        boardId: boardId!,
        userId: userId!,
        pin_id: pin.id,
        chart_type: chartType,
      }),
    onSuccess: (data) => {
      if (data.status && data.preview_spec) {
        setPreviewSpec(data.preview_spec as VisualSpec);
      }
    },
  });

  // Confirm mutation — persists the previewed visual spec
  const confirmMutation = useMutation({
    mutationFn: () =>
      updateVisual({
        boardId: boardId!,
        userId: userId!,
        pin_id: pin.id,
        visual_spec: previewSpec as unknown as Record<string, unknown>,
      }),
    onSuccess: () => {
      setPreviewSpec(null);
      queryClient.invalidateQueries({ queryKey: ["board-data"] });
    },
  });

  // Delete mutation — unassigns pin from the board
  const deleteMutation = useMutation({
    mutationFn: () =>
      bulkUnassignPins(userId!, boardId!, [pin.id]),
    onSuccess: () => {
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["board-data"] });
    },
  });

  const handleRefineSelect = useCallback(
    (chartType: string) => {
      previewMutation.mutate(chartType);
    },
    [previewMutation]
  );

  const handleDiscard = useCallback(() => {
    setPreviewSpec(null);
  }, []);

  const handleConfirm = useCallback(() => {
    confirmMutation.mutate();
  }, [confirmMutation]);

  const isPreviewing = previewSpec !== null;
  const displaySpec = previewSpec ?? visualSpec;

  const HEADER_HEIGHT = 52;
  const PADDING = 16;
  const computedChartHeight = chartHeight
    ? Math.max(chartHeight - HEADER_HEIGHT - PADDING, 150)
    : 350;

  return (
    <>
      <div
        className={`group h-full flex flex-col bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all ${
          isPreviewing
            ? "border-primary/50 ring-1 ring-primary/20"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {/* Header — acts as drag handle in write mode */}
        <div className={`drag-handle px-4 pt-4 pb-2 flex items-start justify-between shrink-0 ${isWriteMode ? "cursor-grab active:cursor-grabbing" : ""}`}>
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {isWriteMode && (
              <GripVertical className="h-4 w-4 mt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm truncate">
                {pin.title}
              </h3>
            </div>
          </div>

          {boardId && userId && (
            <div className="no-drag flex items-center gap-0.5">
              {isWriteMode && (
                <RefinePopover
                  boardId={boardId}
                  pinId={pin.id}
                  userId={userId}
                  currentChartType={pin.chartType}
                  onSelect={handleRefineSelect}
                />
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAlerts(true);
                }}
              >
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="no-drag opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleExpand}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Expand
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>

              {isWriteMode && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chart or Table — shows preview spec when available */}
        <div ref={chartContainerRef} className="px-4 py-2 relative flex-1 min-h-0 overflow-hidden">
          {previewMutation.isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <ChatChart visualSpec={displaySpec} bare height={computedChartHeight} />
        </div>

        {/* Discard / Confirm bar — shown during preview */}
        <AnimatePresence>
          {isPreviewing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-100 shrink-0"
            >
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscard}
                  disabled={confirmMutation.isPending}
                >
                  <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending}
                >
                  {confirmMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Confirm
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pin details (markdown + visual) — same as chat pinned insights */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showPinDetails && userId && (
              <PinDetailsDialog
                key={pin.id}
                pin={boardPinToPinItemStub(pin)}
                onClose={() => setShowPinDetails(false)}
              />
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Fallback: chart-only expand when user id unavailable */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8"
                onClick={handleCloseExpanded}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                  style={{ width: "80vw", height: "80vh" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900 truncate">
                      {pin.title}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleCloseExpanded}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    <ChatChart visualSpec={displaySpec} bare height={600} />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Delete Confirmation Dialog */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={() =>
                  !deleteMutation.isPending && setShowDeleteConfirm(false)
                }
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Delete pin?
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    This will remove{" "}
                    <span className="font-medium text-gray-700">
                      {pin.title}
                    </span>{" "}
                    from the board. This action cannot be undone.
                  </p>
                  <div className="flex items-center justify-end gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleteMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Delete
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Alerts Panel */}
      {boardId && userId && (
        <AlertsPanel
          open={showAlerts}
          onClose={() => setShowAlerts(false)}
          pinId={pin.id}
          boardId={boardId}
          userId={userId}
          pinTitle={pin.title}
        />
      )}
    </>
  );
});

// Skeleton for loading state
export function PinCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-3 w-16 mb-4" />
      <Skeleton className="h-[280px] w-full rounded-lg" />
    </div>
  );
}
