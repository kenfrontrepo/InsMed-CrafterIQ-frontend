"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Search } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  fetchDimensions,
  fetchFiltersByDimension,
  type DimensionMeta,
} from "@/lib/api/filtersApi";

/** Filter payload shape matching the board data API contract */
export type BoardFilters = Record<
  string,
  { operator: string; values: string[] }
>;

const OPERATORS = ["Equals", "Not Equals", "Contains", "Not Contains"] as const;

const OPERATOR_TO_API: Record<string, string> = {
  Equals: "equals",
  "Not Equals": "notEquals",
  Contains: "contains",
  "Not Contains": "notContains",
};

const API_TO_OPERATOR: Record<string, string> = {
  equals: "Equals",
  notEquals: "Not Equals",
  contains: "Contains",
  notContains: "Not Contains",
};

const EMPTY_DIMENSIONS: DimensionMeta[] = [];

interface FilterPopoverProps {
  filters?: BoardFilters;
  onApply?: (filters: BoardFilters) => void;
}

export function FilterPopover({ filters = {}, onApply }: FilterPopoverProps) {
  const { data: dimensionsData, isLoading: dimensionsLoading } = useQuery({
    queryKey: ["insmed-filter-dimensions"],
    queryFn: async () => {
      const res = await fetchDimensions();
      return res.dimensions ?? [];
    },
    staleTime: 60_000,
  });

  const dimensions: DimensionMeta[] = dimensionsData ?? EMPTY_DIMENSIONS;

  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [operator, setOperator] = useState("Equals");
  const [valuesSearch, setValuesSearch] = useState("");
  const [debouncedValuesSearch, setDebouncedValuesSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [pendingFilters, setPendingFilters] = useState<BoardFilters>({});

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedValuesSearch(valuesSearch.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [valuesSearch]);

  const firstKey = dimensions[0]?.key ?? "";
  const effectiveCategory =
    activeCategory && dimensions.some((d) => d.key === activeCategory)
      ? activeCategory
      : firstKey;

  const { data: singleDimRes, isFetching, isPending, isError } = useQuery({
    queryKey: [
      "insmed-filter-dimension-values",
      effectiveCategory,
      debouncedValuesSearch,
    ],
    queryFn: () =>
      fetchFiltersByDimension(effectiveCategory, debouncedValuesSearch, 50),
    enabled: open && !!effectiveCategory,
    staleTime: 30_000,
  });

  const filteredValues: string[] =
    singleDimRes?.status !== false && singleDimRes?.values?.length
      ? singleDimRes.values.map((v) => String(v))
      : [];

  const valuesLoading =
    dimensionsLoading ||
    (open && !!effectiveCategory && (isPending || isFetching));

  const toggleValue = (val: string) => {
    setSelectedValues((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedValues.size === filteredValues.length) {
      setSelectedValues(new Set());
    } else {
      setSelectedValues(new Set(filteredValues));
    }
  };

  const flushCurrentCategory = (base: BoardFilters): BoardFilters => {
    const next = { ...base };
    const key = effectiveCategory;
    if (!key) return next;
    if (selectedValues.size > 0) {
      next[key] = {
        operator: OPERATOR_TO_API[operator] ?? "equals",
        values: [...selectedValues],
      };
    } else {
      delete next[key];
    }
    return next;
  };

  const loadCategory = (key: string, source: BoardFilters) => {
    const existing = source[key];
    setSelectedValues(new Set(existing?.values ?? []));
    setOperator(
      existing ? (API_TO_OPERATOR[existing.operator] ?? "Equals") : "Equals"
    );
  };

  const handleCategoryChange = (key: string) => {
    const updated = flushCurrentCategory(pendingFilters);
    setPendingFilters(updated);
    setActiveCategory(key);
    setValuesSearch("");
    setDebouncedValuesSearch("");
    loadCategory(key, updated);
  };

  const handleApply = () => {
    const final = flushCurrentCategory(pendingFilters);
    onApply?.(final);
    setOpen(false);
  };

  useEffect(() => {
    if (!open || dimensions.length === 0) return;
    if (activeCategory && dimensions.some((d) => d.key === activeCategory)) return;
    const k = dimensions[0].key;
    setActiveCategory(k);
    const base = { ...filters };
    setPendingFilters(base);
    loadCategory(k, base);
  }, [open, dimensions, activeCategory, filters]);

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          const validKeys = new Set(dimensions.map((d) => d.key));
          const first = dimensions[0]?.key ?? "";
          const resetCategory =
            !activeCategory || !validKeys.has(activeCategory);
          if (first && resetCategory) {
            setActiveCategory(first);
          }
          const initial = { ...filters };
          setPendingFilters(initial);
          const catToLoad =
            resetCategory && first ? first : activeCategory || first;
          if (catToLoad && validKeys.has(catToLoad)) {
            setActiveCategory(catToLoad);
            loadCategory(catToLoad, initial);
          }
          setValuesSearch("");
          setDebouncedValuesSearch("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-border-mid bg-hover text-text-secondary hover:bg-border-subtle transition-colors"
        >
          <Filter className="h-4 w-4" />
          {Object.keys(filters).length > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-text-primary border-2 border-card" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={4}
        className="w-[480px] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex h-[380px]">
          <div className="w-[160px] border-r border-border-subtle overflow-auto">
            {dimensionsLoading ? (
              <div className="px-3 py-4 text-xs text-text-tertiary text-center">
                Loading dimensions…
              </div>
            ) : dimensions.length === 0 ? (
              <div className="px-3 py-4 text-xs text-text-tertiary text-center">
                No dimensions available
              </div>
            ) : (
              dimensions.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    effectiveCategory === cat.key
                      ? "bg-text-primary text-white font-medium"
                      : "text-text-secondary hover:bg-hover"
                  }`}
                >
                  {cat.display}
                </button>
              ))
            )}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-3 border-b border-border-subtle">
              <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                Operator
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-border-mid bg-card focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary"
              >
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col min-h-0 p-3">
              <label className="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                {singleDimRes?.display ?? "Values"}
              </label>

              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search values..."
                  value={valuesSearch}
                  onChange={(e) => setValuesSearch(e.target.value)}
                  className="w-full pl-8 pr-3 h-8 text-sm rounded-md border border-border-mid bg-card focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary"
                />
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      filteredValues.length > 0 &&
                      selectedValues.size === filteredValues.length
                    }
                    onChange={toggleAll}
                    className="rounded border-border-mid text-text-primary focus:ring-text-primary"
                  />
                  Select All
                </label>
                <span className="text-xs text-text-tertiary">
                  Selected: {selectedValues.size}
                </span>
              </div>

              <div className="flex-1 overflow-auto min-h-0 -mx-1 px-1">
                {valuesLoading ? (
                  <div className="text-sm text-text-tertiary py-4 text-center">
                    Loading...
                  </div>
                ) : isError ? (
                  <div className="text-sm text-red-500 py-4 text-center">
                    Failed to load values
                  </div>
                ) : filteredValues.length === 0 ? (
                  <div className="text-sm text-text-tertiary py-4 text-center">
                    No values found
                  </div>
                ) : (
                  filteredValues.map((val) => (
                    <label
                      key={val}
                      className="flex items-center gap-2 py-1.5 px-1 text-sm text-text-secondary hover:bg-hover rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedValues.has(val)}
                        onChange={() => toggleValue(val)}
                        className="rounded border-border-mid text-text-primary focus:ring-text-primary"
                      />
                      <span className="truncate">{val}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-border-subtle">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                className="bg-text-primary hover:bg-[#333330] text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
