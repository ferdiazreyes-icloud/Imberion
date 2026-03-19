"use client";

import { useQuery } from "@tanstack/react-query";
import { Select } from "@/components/ui/select";
import { useFilters } from "@/hooks/useFilters";
import { getFilterCategories, getFilterTerritories } from "@/lib/api";

export function GlobalFilters() {
  const { filters, setFilter, clearFilters } = useFilters();

  const { data: categoriesRaw } = useQuery({
    queryKey: ["filter-categories"],
    queryFn: getFilterCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: territoriesRaw } = useQuery({
    queryKey: ["filter-territories"],
    queryFn: getFilterTerritories,
    staleTime: 5 * 60 * 1000,
  });

  const categories = (categoriesRaw || []).map((c) => ({ value: String(c.id), label: c.name }));
  const territories = (territoriesRaw || []).map((t) => ({ value: String(t.id), label: `${t.state} - ${t.municipality}` }));

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-xl p-4 animate-fade-in"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
      }}
    >
      <Select
        label="Segmento"
        options={[
          { value: "oro", label: "Oro" },
          { value: "plata", label: "Plata" },
          { value: "bronce", label: "Bronce" },
        ]}
        value={filters.segment || ""}
        onChange={(e) => setFilter("segment", e.target.value)}
      />
      <Select
        label="Territorio"
        options={territories}
        value={filters.territory_id || ""}
        onChange={(e) => setFilter("territory_id", e.target.value)}
      />
      <Select
        label="Categoria"
        options={categories}
        value={filters.category_id || ""}
        onChange={(e) => setFilter("category_id", e.target.value)}
      />
      <Select
        label="Confianza"
        options={[
          { value: "high", label: "Alta" },
          { value: "medium", label: "Media" },
          { value: "low", label: "Baja" },
        ]}
        value={filters.confidence_level || ""}
        onChange={(e) => setFilter("confidence_level", e.target.value)}
      />
      <button
        onClick={clearFilters}
        className="rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:opacity-80"
        style={{
          borderColor: "var(--border-primary)",
          color: "var(--text-secondary)",
          background: "var(--bg-tertiary)",
        }}
      >
        Limpiar filtros
      </button>
    </div>
  );
}
