"use client";

/** Filter payload shape matching the board data API contract */
export type BoardFilters = Record<
  string,
  { operator: string; values: string[] }
>;

interface FilterPopoverProps {
  filters?: BoardFilters;
  onApply?: (filters: BoardFilters) => void;
}

/** Board dimension filters are temporarily disabled (ClickHouse API commented out). */
export function FilterPopover(_props: FilterPopoverProps) {
  return null;
}
