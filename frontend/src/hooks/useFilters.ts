"use client";

import { create } from "zustand";
import type { Filters } from "@/lib/types";

interface FilterStore {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string | undefined) => void;
  clearFilters: () => void;
  getActiveParams: () => Record<string, string>;
}

export const useFilters = create<FilterStore>((set, get) => ({
  filters: {},
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value || undefined },
    })),
  clearFilters: () => set({ filters: {} }),
  getActiveParams: () => {
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(get().filters)) {
      if (v) params[k] = v;
    }
    return params;
  },
}));
