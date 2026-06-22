"use client";

import type { BoardFilters } from "./filter-popover";

interface SearchPopoverProps {
  onSelect?: (filters: BoardFilters) => void;
}

/** Board search filters are temporarily disabled (ClickHouse API commented out). */
export function SearchPopover(_props: SearchPopoverProps) {
  return null;
}
