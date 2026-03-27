"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BaseChart } from "@/components/charts/base-chart";
import { EDITORIAL_COLORS, fmtM, fmtN, fmtCurrency } from "@/lib/echarts-theme";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConfidenceDot } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useFilters } from "@/hooks/useFilters";
import { getElasticities, getTrends, getPriceVolume } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EOption = Record<string, any>;

export default function HistoryPage() {
  const { getActiveParams, setFilter } = useFilters();
  const params = getActiveParams();
  const [nodeType, setNodeType] = useState("category");

  const { data: elasticities, isLoading } = useQuery({
    queryKey: ["elasticities", params],
    queryFn: () => getElasticities({ ...params, type: "historical" }),
  });

  const { data: trends } = useQuery({
    queryKey: ["trends", nodeType, params],
    queryFn: () => getTrends({ node_type: nodeType, ...params }),
  });

  const { data: priceVolume } = useQuery({
    queryKey: ["price-volume", params],
    queryFn: () => getPriceVolume(params),
  });

  /* ── Trend Chart: Area + Bold line with gradient fill ── */
  const trendOption = useMemo<EOption>(() => {
    const rows = trends?.data || [];

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const p = params as any[];
          let html = `<strong>${p[0]?.axisValue}</strong>`;
          p.forEach((s: any) => {
            const val = s.seriesName === "Volumen" ? fmtN(s.value) : fmtCurrency(s.value);
            html += `<br/><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${s.color};margin-right:6px;"></span>${s.seriesName}: <strong>${val}</strong>`;
          });
          return html;
        },
      },
      legend: {
        bottom: 0,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
      },
      grid: { left: 12, right: 80, top: 24, bottom: 40, containLabel: true },
      xAxis: {
        type: "category",
        data: rows.map((r: any) => r.period),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: EDITORIAL_COLORS.textLight, fontSize: 10 },
      },
      yAxis: [
        {
          type: "value",
          axisLabel: { formatter: (v: number) => `$${v.toFixed(0)}`, color: EDITORIAL_COLORS.textLight, fontSize: 10 },
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        {
          type: "value",
          axisLabel: { formatter: (v: number) => fmtN(v), color: EDITORIAL_COLORS.textLight, fontSize: 10 },
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
        },
      ],
      series: [
        {
          name: "Precio Neto",
          type: "line",
          yAxisIndex: 0,
          data: rows.map((r: any) => r.net_price),
          symbol: "none",
          lineStyle: { width: 3.5, color: EDITORIAL_COLORS.navy },
          itemStyle: { color: EDITORIAL_COLORS.navy },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(43,76,126,0.18)" },
                { offset: 1, color: "rgba(43,76,126,0.01)" },
              ],
            },
          },
          endLabel: {
            show: true,
            formatter: (p: any) => `$${Number(p.value).toFixed(0)}`,
            fontSize: 13,
            fontWeight: 700,
            color: EDITORIAL_COLORS.navy,
            fontFamily: "'Inter', sans-serif",
          },
          smooth: 0.3,
        },
        {
          name: "Precio Lista",
          type: "line",
          yAxisIndex: 0,
          data: rows.map((r: any) => r.list_price),
          symbol: "none",
          lineStyle: { width: 1.5, type: "dashed", color: EDITORIAL_COLORS.gray },
          itemStyle: { color: EDITORIAL_COLORS.gray },
          endLabel: {
            show: true,
            formatter: (p: any) => `$${Number(p.value).toFixed(0)}`,
            fontSize: 11,
            color: EDITORIAL_COLORS.gray,
          },
          smooth: 0.3,
        },
        {
          name: "Volumen",
          type: "line",
          yAxisIndex: 1,
          data: rows.map((r: any) => r.volume),
          symbol: "none",
          lineStyle: { width: 3.5, color: EDITORIAL_COLORS.coral },
          itemStyle: { color: EDITORIAL_COLORS.coral },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(216,90,74,0.15)" },
                { offset: 1, color: "rgba(216,90,74,0.01)" },
              ],
            },
          },
          endLabel: {
            show: true,
            formatter: (p: any) => fmtN(Number(p.value)),
            fontSize: 13,
            fontWeight: 700,
            color: EDITORIAL_COLORS.coral,
            fontFamily: "'Inter', sans-serif",
          },
          smooth: 0.3,
        },
      ],
    };
  }, [trends]);

  /* ── Scatter: Bubble chart — axes auto-fit to data range ── */
  const scatterOption = useMemo<EOption>(() => {
    const raw = priceVolume || [];
    if (raw.length === 0) return {};

    const prices = raw.map((r: any) => r.avg_price);
    const volumes = raw.map((r: any) => r.total_volume);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minVol = Math.min(...volumes);
    const maxVol = Math.max(...volumes);
    const pricePad = (maxPrice - minPrice) * 0.15 || 10;
    const volPad = (maxVol - minVol) * 0.15 || 1000;

    return {
      tooltip: {
        trigger: "item",
        formatter: (p: any) =>
          `<strong>Precio:</strong> $${Number(p.value[0]).toFixed(0)}<br/><strong>Volumen:</strong> ${fmtN(p.value[1])}`,
      },
      grid: { left: 12, right: 24, top: 24, bottom: 36, containLabel: true },
      xAxis: {
        type: "value",
        name: "Precio Promedio",
        nameLocation: "center",
        nameGap: 28,
        nameTextStyle: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
        min: Math.floor(minPrice - pricePad),
        max: Math.ceil(maxPrice + pricePad),
        axisLabel: { formatter: (v: number) => `$${v.toFixed(0)}`, color: EDITORIAL_COLORS.textLight, fontSize: 10 },
        splitLine: { lineStyle: { color: EDITORIAL_COLORS.border, type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "Volumen",
        nameLocation: "center",
        nameGap: 50,
        nameTextStyle: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
        min: Math.floor(minVol - volPad),
        max: Math.ceil(maxVol + volPad),
        axisLabel: { formatter: (v: number) => fmtN(v), color: EDITORIAL_COLORS.textLight, fontSize: 10 },
        splitLine: { lineStyle: { color: EDITORIAL_COLORS.border, type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: "scatter",
          data: raw.map((r: any) => [r.avg_price, r.total_volume]),
          symbolSize: (val: number[]) => {
            const norm = (val[1] - minVol) / (maxVol - minVol || 1);
            return Math.max(12, norm * 35 + 12);
          },
          itemStyle: {
            color: EDITORIAL_COLORS.coral,
            opacity: 0.6,
            borderColor: EDITORIAL_COLORS.coral,
            borderWidth: 1.5,
          },
          emphasis: {
            itemStyle: { opacity: 1, shadowBlur: 10, shadowColor: "rgba(216,90,74,0.3)" },
          },
        },
      ],
    };
  }, [priceVolume]);

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="section-title text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Historial y Elasticidades</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>Lectura backward-looking de precios, volumen y elasticidades</p>
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

      <div className="flex gap-3 animate-fade-in">
        <Select
          label="Nivel de análisis"
          options={[
            { value: "category", label: "Categoría" },
            { value: "sku", label: "SKU" },
            { value: "territory", label: "Territorio" },
          ]}
          value={nodeType}
          onChange={(e) => setNodeType(e.target.value)}
        />
        <Select
          label="Confianza"
          options={[
            { value: "high", label: "Alta" },
            { value: "medium", label: "Media" },
            { value: "low", label: "Baja" },
          ]}
          value={params.confidence_level || ""}
          onChange={(e) => setFilter("confidence_level", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendencia Precio Neto y Volumen — {trends?.node_label || "Cargando..."}</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseChart option={trendOption} height={350} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precio vs Volumen (Elasticidad Visual)</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseChart option={scatterOption} height={300} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Elasticidades Historicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0" style={{ background: "var(--bg-secondary)" }}>
                  <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                    <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Nodo</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Coeficiente</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Confianza</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Muestra</th>
                  </tr>
                </thead>
                <tbody>
                  {(elasticities || []).slice(0, 30).map((e) => (
                    <tr key={e.id} className="table-row-interactive" style={{ borderBottom: "1px solid var(--border-secondary)" }}
                    >
                      <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>{e.node_name || `${e.node_type} #${e.node_id}`}</td>
                      <td className="px-3 py-2.5" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{e.coefficient.toFixed(3)}</td>
                      <td className="px-3 py-2.5"><ConfidenceDot level={e.confidence_level} /></td>
                      <td className="px-3 py-2.5" style={{ color: "var(--text-tertiary)" }}>{e.sample_size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
