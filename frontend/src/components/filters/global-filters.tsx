"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui/select";
import { useFilters } from "@/hooks/useFilters";
import { getFilterCategories, getFilterTerritories } from "@/lib/api";

export function GlobalFilters() {
  const { filters, setFilter, clearFilters } = useFilters();
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [territories, setTerritories] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    getFilterCategories()
      .then((cats) => setCategories(cats.map((c: any) => ({ value: String(c.id), label: c.name }))))
      .catch(() => {});
    getFilterTerritories()
      .then((ts) =>
        setTerritories(ts.map((t: any) => ({ value: String(t.id), label: `${t.state} - ${t.municipality}` })))
      )
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
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
        className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
