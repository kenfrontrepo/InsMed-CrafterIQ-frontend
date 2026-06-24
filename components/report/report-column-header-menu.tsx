"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  MoreVertical,
  ArrowUpAZ,
  ArrowDownAZ,
  Search,
  SlidersHorizontal,
  ArrowLeft,
  X,
  CalendarIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type FilterType = "text" | "date" | "range" | null;

interface DateFilter {
  from: string;
  to: string;
}

interface RangeFilter {
  min: number | null;
  max: number | null;
}

interface ReportColumnHeaderMenuProps {
  columnLabel: string;
  filterType: FilterType;
  filterValue: string | DateFilter | RangeFilter | null;
  isActive: boolean;
  onSort: (direction: "asc" | "desc") => void;
  onFilter: (value: string | null) => void;
  onDateChange?: (from: string, to: string) => void;
  onRangeChange?: (min: number | null, max: number | null) => void;
  onClearFilter: () => void;
}

export function ReportColumnHeaderMenu({
  columnLabel,
  filterType,
  filterValue,
  isActive,
  onSort,
  onFilter,
  onDateChange,
  onRangeChange,
  onClearFilter,
}: ReportColumnHeaderMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterMode, setFilterMode] = useState(false);
  const [searchInput, setSearchInput] = useState(
    typeof filterValue === "string" ? filterValue : ""
  );
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const isDateFilter = (val: unknown): val is DateFilter =>
    Boolean(val && typeof val === "object" && "from" in val);
  const isRangeFilter = (val: unknown): val is RangeFilter =>
    Boolean(val && typeof val === "object" && "min" in val);

  const dateFilter = isDateFilter(filterValue) ? filterValue : { from: "", to: "" };
  const rangeFilter = isRangeFilter(filterValue) ? filterValue : { min: null, max: null };

  const [rangeMin, setRangeMin] = useState(
    rangeFilter.min !== null ? String(rangeFilter.min) : ""
  );
  const [rangeMax, setRangeMax] = useState(
    rangeFilter.max !== null ? String(rangeFilter.max) : ""
  );

  const handleOpenChange = (open: boolean) => {
    setMenuOpen(open);
    if (!open) setFilterMode(false);
  };

  return (
    <DropdownMenu open={menuOpen} onOpenChange={handleOpenChange} modal={filterMode}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative p-0.5 rounded hover:bg-hover text-text-tertiary hover:text-text-secondary transition-colors shrink-0",
            isActive && "text-text-primary"
          )}
          aria-label={`${columnLabel} column options`}
        >
          <MoreVertical className="h-3.5 w-3.5" />
          {isActive ? (
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-text-primary" />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          filterMode && (filterType === "text" || filterType === "date" || filterType === "range")
            ? "w-72 p-0"
            : "w-44"
        )}
        onClick={(e) => e.stopPropagation()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {filterMode && filterType === "text" ? (
          <div onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setFilterMode(false)}
              className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-hover border-b border-border-subtle transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <div className="p-3 flex flex-col gap-3">
              <p className="text-xs font-semibold text-text-primary">
                Search {columnLabel}
              </p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    onFilter(e.target.value || null);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={`Search ${columnLabel.toLowerCase()}…`}
                  className="w-full pl-8 pr-3 py-1.5 border border-border-mid rounded-md text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-border-strong"
                  autoFocus
                />
              </div>
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    onClearFilter();
                  }}
                  className="text-xs font-medium text-text-primary hover:underline self-end flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        ) : filterMode && filterType === "date" ? (
          <div onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setFilterMode(false)}
              className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-hover border-b border-border-subtle transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <div className="p-3 flex flex-col gap-3">
              <p className="text-xs font-semibold text-text-primary">Filter by date</p>
              <div className="flex gap-2">
                <Popover open={fromOpen} onOpenChange={setFromOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex-1 flex items-center gap-2 px-3 py-1.5 border border-border-mid rounded-md text-xs text-text-secondary hover:bg-hover transition-colors text-left outline-none"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {dateFilter.from
                          ? format(new Date(`${dateFilter.from}T00:00:00`), "MMM d")
                          : "From"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        dateFilter.from
                          ? new Date(`${dateFilter.from}T00:00:00`)
                          : undefined
                      }
                      onSelect={(d) => {
                        const next = d ? format(d, "yyyy-MM-dd") : "";
                        onDateChange?.(next, dateFilter.to);
                        setFromOpen(false);
                      }}
                      disabled={(d) =>
                        d > new Date() ||
                        (dateFilter.to ? d > new Date(`${dateFilter.to}T00:00:00`) : false)
                      }
                    />
                  </PopoverContent>
                </Popover>
                <Popover open={toOpen} onOpenChange={setToOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex-1 flex items-center gap-2 px-3 py-1.5 border border-border-mid rounded-md text-xs text-text-secondary hover:bg-hover transition-colors text-left outline-none"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {dateFilter.to
                          ? format(new Date(`${dateFilter.to}T00:00:00`), "MMM d")
                          : "To"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        dateFilter.to ? new Date(`${dateFilter.to}T00:00:00`) : undefined
                      }
                      onSelect={(d) => {
                        const next = d ? format(d, "yyyy-MM-dd") : "";
                        onDateChange?.(dateFilter.from, next);
                        setToOpen(false);
                      }}
                      disabled={(d) =>
                        d > new Date() ||
                        (dateFilter.from
                          ? d < new Date(`${dateFilter.from}T00:00:00`)
                          : false)
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        ) : filterMode && filterType === "range" ? (
          <div onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setFilterMode(false)}
              className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-hover border-b border-border-subtle transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <div className="p-3 flex flex-col gap-3">
              <p className="text-xs font-semibold text-text-primary">Filter by range</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={rangeMin}
                  onChange={(e) => {
                    setRangeMin(e.target.value);
                    const min =
                      e.target.value !== "" && !Number.isNaN(parseFloat(e.target.value))
                        ? parseFloat(e.target.value)
                        : null;
                    const max =
                      rangeMax !== "" && !Number.isNaN(parseFloat(rangeMax))
                        ? parseFloat(rangeMax)
                        : null;
                    onRangeChange?.(min, max);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex-1 px-3 py-1.5 border border-border-mid rounded-md text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-border-strong"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={rangeMax}
                  onChange={(e) => {
                    setRangeMax(e.target.value);
                    const min =
                      rangeMin !== "" && !Number.isNaN(parseFloat(rangeMin))
                        ? parseFloat(rangeMin)
                        : null;
                    const max =
                      e.target.value !== "" && !Number.isNaN(parseFloat(e.target.value))
                        ? parseFloat(e.target.value)
                        : null;
                    onRangeChange?.(min, max);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex-1 px-3 py-1.5 border border-border-mid rounded-md text-xs text-text-primary placeholder:text-text-tertiary outline-none focus:border-border-strong"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <DropdownMenuItem
              onSelect={() => {
                onSort("asc");
                setMenuOpen(false);
              }}
            >
              <ArrowUpAZ className="h-3.5 w-3.5" />
              Sort Ascending
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                onSort("desc");
                setMenuOpen(false);
              }}
            >
              <ArrowDownAZ className="h-3.5 w-3.5" />
              Sort Descending
            </DropdownMenuItem>
            {filterType ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setFilterMode(true);
                  }}
                >
                  {filterType === "text" ? (
                    <Search className="h-3.5 w-3.5" />
                  ) : (
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  )}
                  {filterType === "text" ? "Search" : "Filter"}
                </DropdownMenuItem>
                {isActive ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      onClearFilter();
                      setMenuOpen(false);
                    }}
                    className="text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear Filter
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
