"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BaseChart } from "@/components/charts/base-chart";
import { EDITORIAL_COLORS, fmtCurrency, fmtPct } from "@/lib/echarts-theme";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SegmentLabel } from "@/components/ui/badge";
import { useFilters } from "@/hooks/useFilters";
import { getPassthroughBySegment, getPassthroughByCategory, getPassthroughTrends } from "@/lib/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EOption = Record<string, any>;

export default function PassthroughPage() {
  const { getActiveParams } = useFilters();
  const params = getActiveParams();

  const { data: bySegment, isLoading } = useQuery({
    queryKey: ["passthrough-segment", params],
    queryFn: () => getPassthroughBySegment(params),
  });

  const { data: byCategory } = useQuery({
    queryKey: ["passthrough-category", params],
    queryFn: () => getPassthroughByCategory(params),
  });

  const { data: trends } = useQuery({
    queryKey: ["passthrough-trends", params],
    queryFn: () => getPassthroughTrends(params),
  });

  /* ── Chart 1: Grouped bars side-by-side — Descomposicion de Precio ── */
  const segmentBarOption = useMemo<EOption>(() => {
    const data = bySegment || [];
    const segments = data.map((d: any) => d.segment);

    const makeSeries = (key: string, name: string, color: string) => ({
      name,
      type: "bar",
      data: data.map((d: any) => d[key]),
      itemStyle: { color, borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 28,
      label: {
        show: true,
        position: "top" as const,
        formatter: (p: any) => `$${Number(p.value).toFixed(0)}`,
        fontSize: 11,
        fontWeight: 600,
        color,
      },
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v: number) => fmtCurrency(v),
      },
      legend: {
        bottom: 0,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
      },
      grid: { top: 24, bottom: 40, left: 12, right: 12, containLabel: true },
      xAxis: {
        type: "category",
        data: segments,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: EDITORIAL_COLORS.text, fontSize: 13, fontWeight: 600 },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: EDITORIAL_COLORS.border, type: "dashed" } },
        axisLabel: { formatter: (v: number) => `$${v}`, color: EDITORIAL_COLORS.textLight, fontSize: 10 },
      },
      series: [
        makeSeries("avg_net_price", "Precio Neto", EDITORIAL_COLORS.navy),
        makeSeries("avg_discount", "Descuento", EDITORIAL_COLORS.amber),
        makeSeries("avg_rebate", "Rebate", EDITORIAL_COLORS.coral),
      ],
    };
  }, [bySegment]);

  /* ── Chart 2: Horizontal bar — Rebate Promedio por Categoria ── */
  const categoryBarOption = useMemo<EOption>(() => {
    const data = byCategory || [];
    return {
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: number) => fmtPct(v),
      },
      grid: { left: 12, right: 60, top: 12, bottom: 12 },
      xAxis: {
        type: "value",
        axisLabel: { formatter: (v: number) => fmtPct(v) },
      },
      yAxis: {
        type: "category",
        data: data.map((d: any) => d.category_name), // eslint-disable-line @typescript-eslint/no-explicit-any
      },
      series: [
        {
          name: "Rebate %",
          type: "bar",
          data: data.map((d: any) => d.rebate_pct), // eslint-disable-line @typescript-eslint/no-explicit-any
          itemStyle: { color: EDITORIAL_COLORS.coral, borderRadius: [0, 6, 6, 0] },
          label: {
            show: true,
            position: "right",
            formatter: (p: any) => fmtPct(p.value), // eslint-disable-line @typescript-eslint/no-explicit-any
            fontSize: 11,
          },
        },
      ],
    };
  }, [byCategory]);

  /* ── Trend data for waterfall ── */
  const trendData = trends || [];
  const trendPeriods = trendData.map((d: any) => d.period);

  /* ── Temporal Waterfall: Neto + Rebate + Descuento = Lista ── */
  const waterfallOption = useMemo<EOption>(() => ({
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return "";
        const idx = params[0]?.dataIndex ?? 0;
        const d = trendData[idx];
        if (!d) return "";
        return `<div style="font-weight:700;margin-bottom:4px">${d.period}</div>
          <div><span style="color:${EDITORIAL_COLORS.navy}">■</span> Precio Neto: <strong>$${d.avg_net_price?.toFixed(1)}</strong></div>
          <div><span style="color:${EDITORIAL_COLORS.coral}">■</span> Rebate: <strong>$${d.avg_rebate?.toFixed(1)}</strong></div>
          <div><span style="color:${EDITORIAL_COLORS.amber}">■</span> Descuento: <strong>$${d.avg_discount?.toFixed(1)}</strong></div>
          <div style="border-top:1px solid #eee;margin-top:4px;padding-top:4px;color:${EDITORIAL_COLORS.gray}">Precio Lista: $${d.avg_list_price?.toFixed(1)}</div>`;
      },
    },
    legend: {
      top: 0,
      icon: "roundRect",
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
    },
    grid: { top: 50, right: 12, bottom: 12, left: 12, containLabel: true },
    xAxis: {
      type: "category",
      data: trendPeriods,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: EDITORIAL_COLORS.textMuted, fontSize: 11, interval: 2 },
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (v: number) => `$${v.toFixed(0)}`, color: EDITORIAL_COLORS.textLight, fontSize: 10 },
      splitLine: { lineStyle: { color: EDITORIAL_COLORS.border, type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      // Base: Precio Neto (navy)
      {
        name: "Precio Neto",
        type: "bar",
        stack: "waterfall",
        data: trendData.map((d: any) => d.avg_net_price),
        itemStyle: { color: EDITORIAL_COLORS.navy, borderRadius: [0, 0, 0, 0] },
        barMaxWidth: 28,
        label: {
          show: true,
          position: "inside",
          formatter: (p: any) => `$${Number(p.value).toFixed(0)}`,
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
          rotate: 90,
        },
      },
      // Middle: Rebate (coral)
      {
        name: "Rebate",
        type: "bar",
        stack: "waterfall",
        data: trendData.map((d: any) => d.avg_rebate),
        itemStyle: { color: EDITORIAL_COLORS.coral },
        barMaxWidth: 28,
      },
      // Top: Descuento (amber)
      {
        name: "Descuento",
        type: "bar",
        stack: "waterfall",
        data: trendData.map((d: any) => d.avg_discount),
        itemStyle: { color: EDITORIAL_COLORS.amber, borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 28,
        label: {
          show: true,
          position: "top",
          formatter: (p: any) => {
            const d = trendData[p.dataIndex];
            return d ? `$${Number(d.avg_list_price).toFixed(0)}` : "";
          },
          fontSize: 10,
          fontWeight: 600,
          color: EDITORIAL_COLORS.textMuted,
        },
      },
      // Reference line: Precio Lista (visual only, no label)
      {
        name: "Precio Lista",
        type: "line",
        data: trendData.map((d: any) => d.avg_list_price),
        symbol: "none",
        smooth: 0.3,
        lineStyle: { color: EDITORIAL_COLORS.gray, width: 1.5, type: "dashed" },
        itemStyle: { color: EDITORIAL_COLORS.gray },
      },
    ],
  }), [trendData, trendPeriods]);


  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="section-title text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Passthrough y Rebates</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>Analisis de precio lista, descuento, rebate y precio neto</p>
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Descomposicion de Precio por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseChart option={segmentBarOption} height={350} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rebate como % del Precio Lista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(bySegment || []).map((s: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <div key={s.segment} className="flex items-center gap-3">
                  <span className="w-16 text-center"><SegmentLabel segment={s.segment} /></span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>Rebate: {s.rebate_pct.toFixed(1)}%</span>
                      <span style={{ color: "var(--text-secondary)" }}>Descuento: {s.discount_pct.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1 h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                      <div
                        className="h-3 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(s.rebate_pct + s.discount_pct, 100)}%`, background: EDITORIAL_COLORS.coral }}
                      >
                        <div
                          className="h-3 rounded-full"
                          style={{ width: `${(s.discount_pct / (s.rebate_pct + s.discount_pct)) * 100}%`, background: EDITORIAL_COLORS.amber }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rebate Promedio por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseChart option={categoryBarOption} height={250} />
          </CardContent>
        </Card>

        {/* ── Temporal Waterfall: Neto + Rebate + Descuento = Lista ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolucion de Componentes de Precio</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseChart option={waterfallOption} height={400} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
