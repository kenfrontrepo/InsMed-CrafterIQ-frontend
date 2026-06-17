import { create } from "zustand";

export interface TabFilters {
  normFilter: "all" | "normalized" | "pending";
  confidenceFilter: "all" | "high" | "medium" | "low";
  sortBy: string | null;
  sortOrder: "asc" | "desc";
  searchQuery: string;
  revenueMin: number | null;
  revenueMax: number | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export const defaultTabFilters: TabFilters = {
  normFilter: "all",
  confidenceFilter: "all",
  sortBy: null,
  sortOrder: "asc",
  searchQuery: "",
  revenueMin: null,
  revenueMax: null,
  dateFrom: null,
  dateTo: null,
};

export type NormTab = "customer" | "salesrep" | "repagency";

interface NormalizationFiltersState {
  filters: Record<NormTab, TabFilters>;
  setFilter: (tab: NormTab, updates: Partial<TabFilters>) => void;
  resetFilter: (tab: NormTab) => void;
}

export const useNormalizationFiltersStore = create<NormalizationFiltersState>((set) => ({
  filters: {
    customer: { ...defaultTabFilters },
    salesrep: { ...defaultTabFilters },
    repagency: { ...defaultTabFilters },
  },
  setFilter: (tab, updates) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [tab]: { ...state.filters[tab], ...updates },
      },
    })),
  resetFilter: (tab) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [tab]: { ...defaultTabFilters },
      },
    })),
}));
