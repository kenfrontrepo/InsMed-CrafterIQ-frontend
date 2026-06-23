"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye, Pencil, X } from "lucide-react";
import { useUserId } from "@/hooks/use-user-id";
import { SearchPopover } from "@/components/boards/search-popover";
import { FilterPopover, type BoardFilters } from "@/components/boards/filter-popover";
import { AddPinsDialog } from "@/components/boards/add-pins-dialog";
import {
  BoardDetailHeader,
  SummarySection,
  PinGrid,
  KpiCardsStrip,
  type Pin,
  type ChartType,
} from "@/components/boards";

import {
  fetchBoardData as apiFetchBoardData,
  saveBoardLayout,
  type BoardDataResponse,
  type BoardPinData,
} from "@/lib/api/boardsApi";

async function fetchBoardData(
  boardId: string,
  userId: string,
  filters: BoardFilters = {}
): Promise<BoardDataResponse> {
  return apiFetchBoardData(boardId, userId, filters);
}

async function saveLayout(
  boardId: string,
  userId: string,
  pins: Array<{ pin_id: string; position: number; size: { width: number; height: number } }>
) {
  return saveBoardLayout(boardId, userId, pins);
}

// ── Transform API pin → local Pin type ─────────────────────
// Data format normalization is handled by prepareChartData in ChatChart,
// so we just pass the raw visual_spec through as visualSpec.
function transformPin(apiPin: BoardPinData): Pin | null {
  const spec = apiPin.visual_spec;
  if (!spec || !spec.chart_type) return null;

  const chartType = spec.chart_type as ChartType;
  const title = (spec.title as string) || apiPin.title || "Untitled";

  return {
    id: apiPin.id,
    title,
    chartType,
    trend: 0,
    data: [],
    visualSpec: spec as unknown as import("@/stores/chat-store").VisualSpec,
    xLabel: (spec.x_label as string) || "",
    yLabel: (spec.y_label as string) || "",
    createdAt: apiPin.last_refreshed_at ?? "",
    position: apiPin.position,
    size: apiPin.size ?? { width: 1, height: 1 },
    ...(chartType === "table" && {
      tableColumns: (spec.columns as string[]) || [],
      tableData: (spec.data as Record<string, unknown>[]) || [],
      tableSortable: (spec.sortable as boolean) ?? true,
    }),
  };
}

function BoardDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useUserId();

  const boardId = searchParams.get("id");
  const boardName = searchParams.get("name");

  const [isWriteMode, setIsWriteMode] = useState(searchParams.get("mode") === "edit");
  const [showBanner, setShowBanner] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [showSearchFilter, setShowSearchFilter] = useState(true);
  const [activeFilters, setActiveFilters] = useState<BoardFilters>({});
  const [showAddPins, setShowAddPins] = useState(false);

  // ── Fetch board data (re-fetches when filters change) ──
  const { data: boardData, isLoading } = useQuery({
    queryKey: ["board-data", boardId, activeFilters],
    queryFn: () => fetchBoardData(boardId!, userId!, activeFilters),
    enabled: !!boardId && !!userId,
  });

  const handleRemoveFilter = useCallback((key: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  const handleSearchSelect = useCallback((searchFilters: BoardFilters) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      for (const [key, entry] of Object.entries(searchFilters)) {
        const existing = next[key];
        if (existing) {
          const merged = [...new Set([...existing.values, ...entry.values])];
          next[key] = { ...existing, values: merged };
        } else {
          next[key] = entry;
        }
      }
      return next;
    });
  }, []);

  // ── Transform API pins into local Pin type ─────────────
  const pins = useMemo(() => {
    if (!boardData?.pins_data?.length) return [];
    return boardData.pins_data
      .map(transformPin)
      .filter((p): p is Pin => p !== null);
  }, [boardData]);

  // Auto-enter edit mode when board has no pins
  useEffect(() => {
    if (!isLoading && boardData && pins.length === 0 && !isWriteMode) {
      setIsWriteMode(true);
    }
  }, [isLoading, boardData, pins.length, isWriteMode]);

  const kpiPins = useMemo(() => pins.filter((p) => p.chartType === "kpi_card"), [pins]);
  const gridPins = useMemo(() => pins.filter((p) => p.chartType !== "kpi_card"), [pins]);

  const displayName = boardData?.name || boardName || "";

  const handleBack = useCallback(() => {
    router.push("/Boards");
  }, [router]);

  const handleModeChange = useCallback((writeMode: boolean) => {
    setIsWriteMode(writeMode);
    if (writeMode) setShowBanner(true);
  }, []);

  const handleToggleSummary = useCallback(() => {
    setShowSummary((prev) => !prev);
  }, []);

  const handleToggleSearchFilter = useCallback(() => {
    setShowSearchFilter((prev) => !prev);
  }, []);

  const handleAddPinsSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["board-data", boardId, activeFilters],
    });
  }, [queryClient, boardId, activeFilters]);

  const handleLayoutSave = useCallback(
    (
      layoutPins: Array<{
        pin_id: string;
        position: number;
        size: { width: number; height: number };
      }>
    ) => {
      if (!boardId || !userId) return;
      saveLayout(boardId, userId, layoutPins).catch((err) =>
        console.error("Layout save failed:", err)
      );
    },
    [boardId, userId]
  );

  useEffect(() => {
    if (!showBanner) return;
    const timer = setTimeout(() => setShowBanner(false), 5000);
    return () => clearTimeout(timer);
  }, [showBanner]);

  if (!boardId) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Eye className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Board not found
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          The board you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Boards
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <main className="flex-1 overflow-auto">
        <div className="w-full scrollbar-hide">
          <BoardDetailHeader
            boardName={displayName}
            pinCount={pins.length}
            isWriteMode={isWriteMode}
            showSummary={showSummary}
            showSearchFilter={showSearchFilter}
            onBack={handleBack}
            onModeChange={handleModeChange}
            onToggleSummary={handleToggleSummary}
            onToggleSearchFilter={handleToggleSearchFilter}
            onAddPins={() => setShowAddPins(true)}
          />
          <AnimatePresence>
            {isWriteMode && showBanner && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-amber-50 border-b border-amber-200 overflow-hidden"
              >
                <div className="px-4 py-2 max-w-7xl mx-auto flex text-start">
                  
                  <span className="text-xs font-medium text-amber-700">
                    Edit mode — You can delete or rearrange pins
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          

            <div className={showSummary ? "p-4" : "hidden " }>
              <SummarySection boardId={boardId} userId={userId ?? ""} isWriteMode={isWriteMode} />
            </div>

            <div className="px-4">
            

            <div className={`flex items-center justify-center gap-3 mb-4${showSearchFilter ? "" : " hidden"}`}>
              <SearchPopover onSelect={handleSearchSelect} />
              <FilterPopover
                filters={activeFilters}
                onApply={setActiveFilters}
              />
            </div>

            {/* Active filter chips */}
            {Object.keys(activeFilters).length > 0 && (
              <div className={`flex items-center flex-wrap gap-2 mb-4${showSearchFilter ? "" : " hidden"}`}>
                <span className="text-xs text-gray-500">Filters:</span>
                {Object.entries(activeFilters).map(([key, entry]) => {
                  const catDisplay =
                    key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
                  const opLabel =
                    entry.operator === "notEquals"
                      ? "≠"
                      : entry.operator === "notContains"
                        ? "not contains"
                        : entry.operator === "contains"
                          ? "contains"
                          : "=";
                  return (
                    <button
                      key={key}
                      onClick={() => handleRemoveFilter(key)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-text-primary/10 text-text-primary rounded-full hover:bg-text-primary/20 transition-colors"
                    >
                      {catDisplay} {opLabel} {entry.values.join(", ")}
                      <X className="h-3 w-3" />
                    </button>
                  );
                })}
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-text-tertiary hover:text-text-primary underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
            
            {/* kpi cards */}
            {isLoading && kpiPins.length === 0 ? (
              <div className="flex flex-row gap-4 overflow-x-auto pb-3 scrollbar-hide mb-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 min-w-[200px] rounded-xl border bg-white px-5 py-6 flex flex-col gap-2"
                  >
                    <Skeleton className="h-3 w-20" />
                    <div className="flex items-baseline gap-2 mt-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : kpiPins.length > 0 ? (
              <div className="mb-4">
                <KpiCardsStrip
                  pins={kpiPins}
                  isWriteMode={isWriteMode}
                  boardId={boardId}
                  userId={userId ?? undefined}
                />
              </div>
            ) : null}

            {/* pins cards */}

            <PinGrid
              pins={gridPins}
              isWriteMode={isWriteMode}
              isLoading={isLoading}
              boardId={boardId ?? undefined}
              userId={userId ?? undefined}
              onLayoutSave={handleLayoutSave}
            />
          </div>
        </div>
      </main>

      <AddPinsDialog
        open={showAddPins}
        boardId={boardId}
        boardName={displayName}
        userId={userId ?? ""}
        existingPinIds={boardData?.pins?.map((p) => p.id) ?? boardData?.pins_data?.map((p) => p.id) ?? []}
        onClose={() => setShowAddPins(false)}
        onSuccess={handleAddPinsSuccess}
      />
    </div>
  );
}

function BoardDetailSkeleton() {
  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div>
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border p-4 mb-6">
            <div className="flex justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded" />
                <Skeleton className="h-7 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-16 mb-4" />
                <Skeleton className="h-[180px] w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BoardDetailPage() {
  return (
    <Suspense fallback={<BoardDetailSkeleton />}>
      <BoardDetailContent />
    </Suspense>
  );
}
