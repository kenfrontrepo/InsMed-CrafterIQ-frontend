"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X, SlidersHorizontal, ChevronDown, CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  fetchRepAgencies,
  updateRepAgencyNorm,
  bulkUpdateRepAgencyNorm,
  type RepAgencyFilters,
} from "@/lib/api/normalizationApi";
import { toast } from "sonner";
import { NormalizationTable } from "./normalization-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { useNormalizationFiltersStore } from "@/stores/normalization-filters-store";

const COLUMNS = [
  { key: "Brand", label: "Brand", sortable: true, width: "14%" },
  { key: "RepAgency", label: "Original Name", sortable: true, width: "22%" },
  { key: "NormRepAgency", label: "Normalized Name", sortable: true, editable: true, width: "22%" },
  {
    key: "PY Revenue", label: "PY Revenue", sortable: true, width: "14%",
    render: (value: unknown) => {
      if (value === null || value === undefined) return <span className="text-text-tertiary">—</span>;
      const n = parseFloat(String(value));
      if (isNaN(n)) return <span className="text-text-tertiary">—</span>;
      return <span>${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    },
  },
  {
    key: "Last Txn Date", label: "Last Transaction", sortable: true, width: "14%",
    render: (value: unknown) => {
      if (value === null || value === undefined) return <span className="text-text-tertiary">—</span>;
      const d = new Date(String(value));
      if (isNaN(d.getTime())) return <span>{String(value)}</span>;
      return <span>{d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>;
    },
  },
  {
    key: "NormRepAgencyConfidenceLabel", label: "Confidence", sortable: false, width: "14%",
    render: (value: unknown) => {
      if (value === null || value === undefined || value === "") return <span className="text-text-tertiary">-</span>;
      const label = String(value);
      const cls = label === "high" ? "bg-green-100 text-green-700" : label === "medium" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
      return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${cls}`}>{label}</span>;
    },
  },
];

export function RepAgencyNormalization() {
  const queryClient = useQueryClient();
  const { filters: { repagency: f }, setFilter, resetFilter } = useNormalizationFiltersStore();
  const { normFilter, confidenceFilter, sortBy, sortOrder, searchQuery, revenueMin, revenueMax, dateFrom, dateTo } = f;
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkNormName, setBulkNormName] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingNormFilter, setPendingNormFilter] = useState<"all" | "normalized" | "pending">("all");
  const [pendingConfidenceFilter, setPendingConfidenceFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [pendingRevMin, setPendingRevMin] = useState("");
  const [pendingRevMax, setPendingRevMax] = useState("");
  const [pendingDateFrom, setPendingDateFrom] = useState("");
  const [pendingDateTo, setPendingDateTo] = useState("");
  const [dateFromPickerOpen, setDateFromPickerOpen] = useState(false);
  const [dateToPickerOpen, setDateToPickerOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const baseFilters: Omit<RepAgencyFilters, "page"> = {
    limit: 150,
    search: debouncedSearch || null,
    sort_by: sortBy as RepAgencyFilters["sort_by"],
    sort_order: sortOrder,
    has_norm: normFilter === "normalized" ? true : normFilter === "pending" ? false : null,
    confidence_label: confidenceFilter !== "all" ? [confidenceFilter] : null,
    py_revenue_min: revenueMin,
    py_revenue_max: revenueMax,
    last_txn_date_from: dateFrom,
    last_txn_date_to: dateTo,
  };

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["repagencies", baseFilters],
    queryFn: ({ pageParam = 1 }) => fetchRepAgencies({ ...baseFilters, page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30_000,
  });

  const allData = useMemo(() => data?.pages.flatMap((p) => p.data) || [], [data]);
  const total = data?.pages[0]?.total || 0;

  const handleUpdate = useCallback(async (_id: string, rawName: string, normName: string) => {
    const response = await updateRepAgencyNorm(rawName, normName);
    queryClient.invalidateQueries({ queryKey: ["repagencies"] });
    return response;
  }, [queryClient]);

  const handleSort = useCallback((column: string, direction: "asc" | "desc" | null) => {
    if (direction === null) { setFilter("repagency", { sortBy: null, sortOrder: "asc" }); }
    else { setFilter("repagency", { sortBy: column, sortOrder: direction }); }
  }, [setFilter]);

  const handleFiltersOpen = useCallback((open: boolean) => {
    if (open) {
      setPendingNormFilter(normFilter);
      setPendingConfidenceFilter(confidenceFilter);
      setPendingRevMin(revenueMin != null ? String(revenueMin) : "");
      setPendingRevMax(revenueMax != null ? String(revenueMax) : "");
      setPendingDateFrom(dateFrom ?? "");
      setPendingDateTo(dateTo ?? "");
    }
    setFiltersOpen(open);
  }, [normFilter, confidenceFilter, revenueMin, revenueMax, dateFrom, dateTo]);

  const applyAllFilters = useCallback(() => {
    setFilter("repagency", {
      normFilter: pendingNormFilter,
      confidenceFilter: pendingConfidenceFilter,
      revenueMin: pendingRevMin !== "" ? parseFloat(pendingRevMin) : null,
      revenueMax: pendingRevMax !== "" ? parseFloat(pendingRevMax) : null,
      dateFrom: pendingDateFrom || null,
      dateTo: pendingDateTo || null,
    });
    setFiltersOpen(false);
  }, [setFilter, pendingNormFilter, pendingConfidenceFilter, pendingRevMin, pendingRevMax, pendingDateFrom, pendingDateTo]);

  const resetAllFilters = useCallback(() => {
    resetFilter("repagency");
    setDebouncedSearch("");
    setPendingNormFilter("all"); setPendingConfidenceFilter("all");
    setPendingRevMin(""); setPendingRevMax("");
    setPendingDateFrom(""); setPendingDateTo("");
    setFiltersOpen(false);
  }, [resetFilter]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleBulkApply = useCallback(async () => {
    const trimmed = bulkNormName.trim();
    if (!trimmed) return;
    const selectedRows = allData.filter(row => selectedIds.has(`${String(row.RepAgency)}-${String(row.RepAgency)}`));
    if (selectedRows.length === 0) return;
    const items = selectedRows.map(row => ({ raw_name: String(row.RepAgency), norm_name: trimmed }));
    setIsBulkUpdating(true);
    try {
      const response = await bulkUpdateRepAgencyNorm(items);
      toast.success(response.message || `Updated ${items.length} record${items.length !== 1 ? "s" : ""}`);
      queryClient.invalidateQueries({ queryKey: ["repagencies"] });
      setBulkNormName(""); setSelectedIds(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally { setIsBulkUpdating(false); }
  }, [bulkNormName, selectedIds, allData, queryClient]);

  const activeFilterCount = [
    normFilter !== "all",
    confidenceFilter !== "all",
    revenueMin !== null || revenueMax !== null,
    dateFrom !== null || dateTo !== null,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-2">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input type="text" placeholder="Search by name..." value={searchQuery}
            onChange={(e) => setFilter("repagency", { searchQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 border border-border-mid rounded-lg bg-card text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-border-strong focus:ring-2 focus:ring-blue-500/10" />
        </div>
        <Popover open={filtersOpen} onOpenChange={handleFiltersOpen}>
          <PopoverTrigger asChild>
            <button className="ml-auto flex items-center gap-2 h-8 px-3 border border-border-mid rounded-md text-sm text-text-secondary hover:bg-hover transition-colors whitespace-nowrap">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-slate-700 text-white text-[10px] font-medium leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-90 p-0">
            <div className="px-4 py-3 border-b border-border-subtle">
              <p className="text-sm font-semibold text-text-primary">Filters</p>
            </div>
            <div className="px-4 py-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-text-secondary">Status</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex-1 flex items-center justify-between px-3 py-1.5 border border-border-mid rounded-md text-sm text-text-primary hover:bg-hover transition-colors outline-none">
                      <span>{pendingNormFilter === "all" ? "All" : pendingNormFilter === "normalized" ? "Normalized" : "Pending"}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuRadioGroup value={pendingNormFilter} onValueChange={(v) => setPendingNormFilter(v as typeof pendingNormFilter)}>
                      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="normalized">Normalized</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-text-secondary">Confidence</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex-1 flex items-center justify-between px-3 py-1.5 border border-border-mid rounded-md text-sm text-text-primary hover:bg-hover transition-colors outline-none">
                      <span className="capitalize">{pendingConfidenceFilter === "all" ? "All" : pendingConfidenceFilter}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuRadioGroup value={pendingConfidenceFilter} onValueChange={(v) => setPendingConfidenceFilter(v as typeof pendingConfidenceFilter)}>
                      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-sm text-text-secondary">PY Revenue</span>
                  <div className="flex-1 flex items-center justify-between text-xs font-medium text-text-primary">
                    <span>{pendingRevMin !== "" && !isNaN(parseFloat(pendingRevMin)) ? `$${parseFloat(pendingRevMin).toLocaleString()}` : "$0"}</span>
                    <span className="text-text-tertiary">–</span>
                    <span>{pendingRevMax !== "" && !isNaN(parseFloat(pendingRevMax)) ? `$${parseFloat(pendingRevMax).toLocaleString()}` : "$2B+"}</span>
                  </div>
                </div>
                <Slider min={0} max={2000000000} step={1000000}
                  value={[
                    pendingRevMin !== "" && !isNaN(parseFloat(pendingRevMin)) ? Math.min(parseFloat(pendingRevMin), 2000000000) : 0,
                    pendingRevMax !== "" && !isNaN(parseFloat(pendingRevMax)) ? Math.min(parseFloat(pendingRevMax), 2000000000) : 2000000000,
                  ]}
                  onValueChange={(vals) => {
                    setPendingRevMin(vals[0] > 0 ? String(vals[0]) : "");
                    setPendingRevMax(vals[1] < 2000000000 ? String(vals[1]) : "");
                  }} />
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={pendingRevMin}
                    onChange={(e) => setPendingRevMin(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-border-mid rounded-md text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-border-strong" />
                  <input type="number" placeholder="Max" value={pendingRevMax}
                    onChange={(e) => setPendingRevMax(e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-border-mid rounded-md text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-border-strong" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-text-secondary">Last Transaction</span>
                <div className="flex gap-2">
                  <Popover open={dateFromPickerOpen} onOpenChange={setDateFromPickerOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex-1 flex items-center gap-2 px-3 py-1.5 border border-border-mid rounded-md text-sm text-text-secondary hover:bg-hover transition-colors text-left outline-none">
                        <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{pendingDateFrom ? format(new Date(pendingDateFrom + "T00:00:00"), "MMM d, yyyy") : "From"}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single"
                        selected={pendingDateFrom ? new Date(pendingDateFrom + "T00:00:00") : undefined}
                        onSelect={(d) => { setPendingDateFrom(d ? format(d, "yyyy-MM-dd") : ""); setDateFromPickerOpen(false); }}
                        disabled={(d) => d > new Date() || (pendingDateTo ? d > new Date(pendingDateTo + "T00:00:00") : false)} />
                    </PopoverContent>
                  </Popover>
                  <Popover open={dateToPickerOpen} onOpenChange={setDateToPickerOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex-1 flex items-center gap-2 px-3 py-1.5 border border-border-mid rounded-md text-sm text-text-secondary hover:bg-hover transition-colors text-left outline-none">
                        <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{pendingDateTo ? format(new Date(pendingDateTo + "T00:00:00"), "MMM d, yyyy") : "To"}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single"
                        selected={pendingDateTo ? new Date(pendingDateTo + "T00:00:00") : undefined}
                        onSelect={(d) => { setPendingDateTo(d ? format(d, "yyyy-MM-dd") : ""); setDateToPickerOpen(false); }}
                        disabled={(d) => d > new Date() || (pendingDateFrom ? d < new Date(pendingDateFrom + "T00:00:00") : false)} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border-subtle flex gap-2">
              <button onClick={resetAllFilters} className="flex-1 px-3 py-2 text-sm border border-border-mid rounded-md text-text-secondary hover:bg-hover transition-colors">Reset</button>
              <button onClick={applyAllFilters} className="flex-1 px-3 py-2 text-sm font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors">Apply filters</button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {selectedIds.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg flex-wrap">
          <span className="text-sm font-medium text-slate-700">{selectedIds.size} row{selectedIds.size !== 1 ? "s" : ""} selected</span>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-sm text-slate-600 whitespace-nowrap">Normalized Name:</span>
          <input type="text" value={bulkNormName} onChange={(e) => setBulkNormName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleBulkApply(); }}
            placeholder="Enter value for selected rows..."
            className="flex-1 min-w-50 max-w-xs px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white outline-none focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400" />
          <button onClick={handleBulkApply} disabled={!bulkNormName.trim() || isBulkUpdating}
            className="px-3 py-1.5 text-sm font-medium bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {isBulkUpdating ? "Saving..." : "Apply to all"}
          </button>
          <button onClick={() => { setSelectedIds(new Set()); setBulkNormName(""); }}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors ml-auto">
            <X className="h-3.5 w-3.5" /> Clear selection
          </button>
        </motion.div>
      )}

      <div className="flex-1 min-h-0">
        <NormalizationTable
          columns={COLUMNS} data={allData}
          idKey="RepAgency" rawNameKey="RepAgency" normNameKey="NormRepAgency"
          isLoading={isLoading} isFetchingMore={isFetchingNextPage} hasMore={hasNextPage}
          onUpdate={handleUpdate} onLoadMore={handleLoadMore} total={total}
          onSort={handleSort} selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        />
      </div>
    </div>
  );
}
