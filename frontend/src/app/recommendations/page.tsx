"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFilters } from "@/hooks/useFilters";
import { getRecommendations, getRecommendationsSummary, getExecutiveSummary } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function RecommendationsPage() {
  const { getActiveParams } = useFilters();
  const params = getActiveParams();

  const { data: recommendations } = useQuery({
    queryKey: ["recommendations", params],
    queryFn: () => getRecommendations(params),
  });

  const { data: summary } = useQuery({
    queryKey: ["recommendations-summary"],
    queryFn: getRecommendationsSummary,
  });

  const handleExportCSV = () => {
    const qs = new URLSearchParams(params).toString();
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/export/recommendations-csv?${qs}`, "_blank");
  };

  const handleExportSummary = async () => {
    const data = await getExecutiveSummary();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "informe_ejecutivo.json";
    a.click();
  };

  // Summary chart data
  const summaryBySegment = (summary || []).reduce((acc: any[], item: any) => {
    const existing = acc.find((a) => a.segment === item.segment);
    if (existing) {
      existing[item.action_type] = item.count;
      existing.total_margin += item.total_margin_impact;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recomendaciones</h1>
          <p className="text-sm text-gray-500">Recomendaciones de precio por segmento, territorio y SKU</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
            Exportar CSV
          </button>
          <button onClick={handleExportSummary} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Informe Ejecutivo
          </button>
        </div>
      </div>

      <GlobalFilters />

      {/* Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Resumen por Segmento</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={summaryBySegment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="increase" fill="#2563eb" name="Aumentar" stackId="a" />
                <Bar dataKey="protect" fill="#eab308" name="Proteger" stackId="a" />
                <Bar dataKey="decrease" fill="#dc2626" name="Reducir" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Metricas de Recomendaciones</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-xs text-blue-600">Total recomendaciones</p>
                <p className="text-2xl font-bold text-blue-900">{recommendations?.length || 0}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-xs text-green-600">Alta confianza</p>
                <p className="text-2xl font-bold text-green-900">
                  {(recommendations || []).filter((r: any) => r.confidence_level === "high").length}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-xs text-amber-600">Oportunidades de aumento</p>
                <p className="text-2xl font-bold text-amber-900">
                  {(recommendations || []).filter((r: any) => r.action_type === "increase").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-3">Producto</th>
                  <th className="pb-2 pr-3">Categoria</th>
                  <th className="pb-2 pr-3">Segmento</th>
                  <th className="pb-2 pr-3">Territorio</th>
                  <th className="pb-2 pr-3">Accion</th>
                  <th className="pb-2 pr-3">Cambio %</th>
                  <th className="pb-2 pr-3">Impacto Ingreso</th>
                  <th className="pb-2 pr-3">Impacto Margen</th>
                  <th className="pb-2">Confianza</th>
                </tr>
              </thead>
              <tbody>
                {(recommendations || []).map((r: any) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-3 max-w-[200px] truncate font-medium">{r.product_name}</td>
                    <td className="py-2 pr-3 text-gray-500">{r.category_name}</td>
                    <td className="py-2 pr-3"><Badge variant={r.segment}>{r.segment}</Badge></td>
                    <td className="py-2 pr-3 text-gray-500">{r.territory_name}</td>
                    <td className="py-2 pr-3"><Badge variant={r.action_type}>{r.action_type}</Badge></td>
                    <td className={`py-2 pr-3 font-mono ${r.suggested_change_pct >= 0 ? "text-blue-600" : "text-red-600"}`}>
                      {r.suggested_change_pct >= 0 ? "+" : ""}{r.suggested_change_pct.toFixed(1)}%
                    </td>
                    <td className="py-2 pr-3">{formatCurrency(r.expected_impact_revenue)}</td>
                    <td className="py-2 pr-3">{formatCurrency(r.expected_impact_margin)}</td>
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
