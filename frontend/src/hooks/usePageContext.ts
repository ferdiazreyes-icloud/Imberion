"use client";

import { usePathname } from "next/navigation";
import { useFilters } from "@/hooks/useFilters";
import { useChatStore } from "@/hooks/useChatStore";
import type { PageContext } from "@/lib/types";

const PAGE_LABELS: Record<string, string> = {
  "/": "Overview — Dashboard de KPIs",
  "/history": "Historial — Elasticidades y tendencias",
  "/simulator": "Simulador — Escenarios de precios",
  "/recommendations": "Recomendaciones — Acciones sugeridas",
  "/passthrough": "Passthrough — Rebates y descomposición de precios",
  "/agent": "Agente AI — Conversación",
};

export function usePageContext(): PageContext {
  const pathname = usePathname();
  const { filters } = useFilters();
  const dataSummary = useChatStore((s) => s.dataSummary);

  const pageLabel = PAGE_LABELS[pathname] || pathname;
  const activeFilters = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return {
    currentPage: pathname,
    filters,
    dataSummary: dataSummary || `Viendo ${pageLabel}${activeFilters ? `. Filtros: ${activeFilters}` : ""}`,
  };
}
