"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, ConfidenceDot, SegmentLabel } from "@/components/ui/badge";
import { useFilters } from "@/hooks/useFilters";
import { getRecommendations, getRecommendationsSummary, getExecutiveSummary, getExportCSVUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { BaseChart } from "@/components/charts/base-chart";
import { EDITORIAL_COLORS, ACTION_FILL } from "@/lib/echarts-theme";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EOption = Record<string, any>;

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

  // Lomska #47 style: overlapping bars per segment, wider behind narrower in front
  const segmentChartOption = useMemo<EOption>(() => {
    const SEGMENT_ICONS: Record<string, string> = { oro: "🥇", plata: "🥈", bronce: "🥉" };
    const SEGMENT_ORDER = ["oro", "plata", "bronce"];
    const sorted = [...summaryBySegment].sort((a, b) => SEGMENT_ORDER.indexOf(a.segment as string) - SEGMENT_ORDER.indexOf(b.segment as string));
    const segments = sorted.map((d) => `${SEGMENT_ICONS[d.segment as string] || ""} ${d.segment}`);

    // Each action type is a separate bar, NOT stacked — overlapping with different widths
    const makeSeries = (key: string, name: string, color: string, barWidth: number, zLevel: number, opacity: number) => ({
      name,
      type: "bar",
      data: sorted.map((d) => (d[key] as number) || 0),
      itemStyle: { color, opacity, borderRadius: [0, 4, 4, 0] },
      barWidth,
      barGap: "-100%",
      z: zLevel,
      label: {
        show: true,
        position: "insideRight" as const,
        fontSize: 12,
        fontWeight: 700,
        color: "#fff",
        formatter: (p: { value: number }) => (p.value > 0 ? String(p.value) : ""),
        offset: [0, 0],
      },
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: {
        bottom: 0,
        textStyle: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
        icon: "roundRect",
        itemWidth: 14,
        itemHeight: 8,
      },
      grid: {
        containLabel: true,
        left: 12,
        right: 24,
        top: 12,
        bottom: 36,
      },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: "category",
        data: segments,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: EDITORIAL_COLORS.text, fontSize: 13, fontWeight: 600 },
      },
      series: [
        // Widest bar behind (increase) — tall, light opacity
        makeSeries("increase", "Aumentar", ACTION_FILL.increase, 32, 1, 0.85),
        // Medium bar (protect) — slightly narrower, overlapping
        makeSeries("protect", "Proteger", ACTION_FILL.protect, 24, 2, 0.9),
        // Narrowest bar in front (decrease)
        makeSeries("decrease", "Reducir", ACTION_FILL.decrease, 16, 3, 1),
      ],
    };
  }, [summaryBySegment]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="section-title text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Recomendaciones</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>Recomendaciones de precio por segmento, territorio y SKU</p>
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
            className="rounded-lg px-4 py-2 text-sm font-medium text-white btn-hover"
            style={{ background: "var(--gradient-accent)" }}
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
            <BaseChart option={segmentChartOption} height={250} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Metricas de Recomendaciones</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 stagger-children">
              <div className="rounded-lg p-4 animate-fade-in-up" style={{ background: "rgba(43,76,126,0.06)" }}>
                <p className="text-[11px] font-medium" style={{ color: "#2B4C7E" }}>Total recomendaciones</p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{recommendations?.length || 0}</p>
              </div>
              <div className="rounded-lg p-4 animate-fade-in-up" style={{ background: "rgba(43,76,126,0.06)" }}>
                <p className="text-[11px] font-medium" style={{ color: "#2B4C7E" }}>Alta confianza</p>
                <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {(recommendations || []).filter((r) => r.confidence_level === "high").length}
                </p>
              </div>
              <div className="rounded-lg p-4 animate-fade-in-up" style={{ background: "rgba(216,90,74,0.06)" }}>
                <p className="text-[11px] font-medium" style={{ color: "#D85A4A" }}>Oportunidades de aumento</p>
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
            <table className="w-full text-[13px]">
              <thead className="sticky top-0" style={{ background: "var(--bg-secondary)" }}>
                <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Producto</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Categoria</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Segmento</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Territorio</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Accion</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Cambio %</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Impacto Ingreso</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Impacto Margen</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Confianza</th>
                </tr>
              </thead>
              <tbody>
                {(recommendations || []).map((r) => (
                  <tr key={r.id} className="table-row-interactive" style={{ borderBottom: "1px solid var(--border-secondary)" }}
                  >
                    <td className="px-3 py-2.5 max-w-[200px] truncate font-medium" style={{ color: "var(--text-primary)" }}>{r.product_name}</td>
                    <td className="px-3 py-2.5" style={{ color: "var(--text-tertiary)" }}>{r.category_name}</td>
                    <td className="px-3 py-2.5"><SegmentLabel segment={r.segment} /></td>
                    <td className="px-3 py-2.5" style={{ color: "var(--text-tertiary)" }}>{r.territory_name}</td>
                    <td className="px-3 py-2.5"><Badge variant={r.action_type}>{r.action_type}</Badge></td>
                    <td className="px-3 py-2.5" style={{ color: r.suggested_change_pct >= 0 ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>
                      {r.suggested_change_pct >= 0 ? "+" : ""}{r.suggested_change_pct.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{formatCurrency(r.expected_impact_revenue)}</td>
                    <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{formatCurrency(r.expected_impact_margin)}</td>
                    <td className="px-3 py-2.5"><ConfidenceDot level={r.confidence_level} /></td>
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
