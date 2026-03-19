"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFilters } from "@/hooks/useFilters";
import { getRecommendations, getRecommendationsSummary, getExecutiveSummary, getExportCSVUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ACTION_COLORS, tooltipStyle, axisTickStyle, gridStyle } from "@/lib/chart-theme";

export default function RecommendationsPage() {
  const { getActiveParams } = useFilters();
  const params = getActiveParams();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["recommendations", params],
    queryFn: () => getRecommendations(params),
  });

  const { data: summary } = useQuery({
    queryKey: ["recommendations-summary"],
    queryFn: getRecommendationsSummary,
  });

  const handleExportCSV = () => {
    window.open(getExportCSVUrl(params), "_blank");
  };

  const handleExportSummary = async () => {
    const data = await getExecutiveSummary();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "informe_ejecutivo.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryBySegment = (summary || []).reduce((acc: Array<Record<string, unknown>>, item) => {
    const existing = acc.find((a) => a.segment === item.segment);
    if (existing) {
      existing[item.action_type] = item.count;
      (existing as Record<string, number>).total_margin += item.total_margin_impact;
    } else {
      acc.push({
        segment: item.segment,
        [item.action_type]: item.count,
        total_margin: item.total_margin_impact,
      });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Recomendaciones</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Recomendaciones de precio por segmento, territorio y SKU</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: "var(--border-primary)",
              color: "var(--text-secondary)",
              background: "var(--bg-secondary)",
            }}
          >
            Exportar CSV
          </button>
          <button
            onClick={handleExportSummary}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: "var(--usg-red)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--usg-red-dark)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--usg-red)"}
          >
            Informe Ejecutivo
          </button>
        </div>
      </div>

      <GlobalFilters />

      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <div className="flex gap-2">
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--usg-red)" }} />
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--usg-red)", animationDelay: "0.2s" }} />
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--usg-red)", animationDelay: "0.4s" }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Resumen por Segmento</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={summaryBySegment}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="segment" tick={axisTickStyle} />
                <YAxis tick={axisTickStyle} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Bar dataKey="increase" fill={ACTION_COLORS.increase} name="Aumentar" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="protect" fill={ACTION_COLORS.protect} name="Proteger" stackId="a" />
                <Bar dataKey="decrease" fill={ACTION_COLORS.decrease} name="Reducir" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Metricas de Recomendaciones</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 stagger-children">
              <div className="rounded-lg p-4 animate-fade-in-up" style={{ background: "rgba(78,121,167,0.08)" }}>
                <p className="text-xs font-medium" style={{ color: "#4E79A7" }}>Total recomendaciones</p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{recommendations?.length || 0}</p>
              </div>
              <div className="rounded-lg p-4 animate-fade-in-up" style={{ background: "var(--positive-bg)" }}>
                <p className="text-xs font-medium" style={{ color: "var(--positive)" }}>Alta confianza</p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {(recommendations || []).filter((r) => r.confidence_level === "high").length}
                </p>
              </div>
              <div className="rounded-lg p-4 animate-fade-in-up" style={{ background: "var(--warning-bg)" }}>
                <p className="text-xs font-medium" style={{ color: "var(--warning)" }}>Oportunidades de aumento</p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {(recommendations || []).filter((r) => r.action_type === "increase").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0" style={{ background: "var(--table-header-bg)" }}>
                <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <th className="pb-2 pr-3 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Producto</th>
                  <th className="pb-2 pr-3 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Categoria</th>
                  <th className="pb-2 pr-3 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Segmento</th>
                  <th className="pb-2 pr-3 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Territorio</th>
                  <th className="pb-2 pr-3 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Accion</th>
                  <th className="pb-2 pr-3 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Cambio %</th>
                  <th className="pb-2 pr-3 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Impacto Ingreso</th>
                  <th className="pb-2 pr-3 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Impacto Margen</th>
                  <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Confianza</th>
                </tr>
              </thead>
              <tbody>
                {(recommendations || []).map((r) => (
                  <tr key={r.id} className="transition-colors" style={{ borderBottom: "1px solid var(--border-secondary)" }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = "var(--table-row-hover)"}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}
                  >
                    <td className="py-2 pr-3 max-w-[200px] truncate font-medium" style={{ color: "var(--text-primary)" }}>{r.product_name}</td>
                    <td className="py-2 pr-3" style={{ color: "var(--text-tertiary)" }}>{r.category_name}</td>
                    <td className="py-2 pr-3"><Badge variant={r.segment}>{r.segment}</Badge></td>
                    <td className="py-2 pr-3" style={{ color: "var(--text-tertiary)" }}>{r.territory_name}</td>
                    <td className="py-2 pr-3"><Badge variant={r.action_type}>{r.action_type}</Badge></td>
                    <td className="py-2 pr-3 font-mono" style={{ color: r.suggested_change_pct >= 0 ? "var(--positive)" : "var(--negative)" }}>
                      {r.suggested_change_pct >= 0 ? "+" : ""}{r.suggested_change_pct.toFixed(1)}%
                    </td>
                    <td className="py-2 pr-3" style={{ color: "var(--text-secondary)" }}>{formatCurrency(r.expected_impact_revenue)}</td>
                    <td className="py-2 pr-3" style={{ color: "var(--text-secondary)" }}>{formatCurrency(r.expected_impact_margin)}</td>
                    <td className="py-2"><Badge variant={r.confidence_level}>{r.confidence_level}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
