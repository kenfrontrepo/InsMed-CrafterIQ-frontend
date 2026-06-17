"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { fetchFilters } from "@/lib/api/filtersApi";
import type { BoardFilters } from "./filter-popover";

interface SearchGroup {
  key: string;
  display: string;
  values: string[];
}

interface SearchPopoverProps {
  onSelect?: (filters: BoardFilters) => void;
}

export function SearchPopover({ onSelect }: SearchPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(query.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const { data: filterRes, isFetching } = useQuery({
    queryKey: ["board-search-filters", debouncedSearch],
    queryFn: () => fetchFilters(debouncedSearch, 50),
    enabled: open,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const results: SearchGroup[] = useMemo(() => {
    if (!filterRes?.dimensions) return [];
    const groups: SearchGroup[] = [];
    for (const dim of Object.values(filterRes.dimensions)) {
      if (!dim.success || !dim.values?.length) continue;
      groups.push({
        key: dim.dimension,
        display: dim.display,
        values: dim.values.map((v) => String(v)),
      });
    }
    return groups;
  }, [filterRes]);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSelectResult = (categoryKey: string, value: string) => {
    setOpen(false);
    onSelect?.({
      [categoryKey]: { operator: "contains", values: [value] },
    });
    setQuery("");
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative w-64 cursor-text">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className="w-full pl-9 pr-8 h-9 text-sm rounded-lg border border-border-mid bg-hover focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary"
            />
            {query && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-80 p-0 max-h-[400px] overflow-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {isFetching && results.length === 0 ? (
            <div className="p-4 text-sm text-text-tertiary text-center">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-text-tertiary text-center">
              No results found
            </div>
          ) : (
            <div className="py-1">
              {results.map((group) => (
                <div key={group.key}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider bg-hover border-b border-border-subtle">
                    {group.display}
                  </div>
                  {group.values.slice(0, 5).map((value) => (
                    <button
                      key={`${group.key}-${value}`}
                      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-hover transition-colors"
                      onClick={() => handleSelectResult(group.key, value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
