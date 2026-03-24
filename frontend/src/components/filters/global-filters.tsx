"use client";

import { useQuery } from "@tanstack/react-query";
import { ComboBox } from "@/components/ui/combobox";
import { useFilters } from "@/hooks/useFilters";
import { getFilterCategories, getFilterTerritories, getFilterCustomers } from "@/lib/api";

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

  const { data: customersRaw } = useQuery({
    queryKey: ["filter-customers", filters.segment, filters.territory_id],
    queryFn: () => getFilterCustomers(filters.segment, filters.territory_id),
    staleTime: 5 * 60 * 1000,
  });

  const categories = (categoriesRaw || []).map((c) => ({ value: String(c.id), label: c.name }));
  const territories = (territoriesRaw || []).map((t) => ({ value: String(t.id), label: `${t.state} - ${t.municipality}` }));
  const customers = (customersRaw || []).map((c) => ({ value: String(c.id), label: `${c.name} (${c.segment})` }));

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-xl p-4 animate-fade-in"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        border: "1px solid var(--glass-border)",
        borderTop: "2px solid var(--usg-red)",
      }}
    >
      <ComboBox
        label="Segmento"
        options={[
          { value: "oro", label: "Oro" },
          { value: "plata", label: "Plata" },
          { value: "bronce", label: "Bronce" },
        ]}
        value={filters.segment || ""}
        onChange={(val) => setFilter("segment", val)}
      />
      <ComboBox
        label="Territorio"
        options={territories}
        value={filters.territory_id || ""}
        onChange={(val) => setFilter("territory_id", val)}
      />
      <ComboBox
        label="Categoría"
        options={categories}
        value={filters.category_id || ""}
        onChange={(val) => setFilter("category_id", val)}
      />
      <ComboBox
        label="Distribuidor"
        options={customers}
        value={filters.customer_id || ""}
        onChange={(val) => setFilter("customer_id", val)}
      />
      <button
        onClick={clearFilters}
        className="rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:border-[var(--usg-red)] hover:text-[var(--usg-red)]"
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
