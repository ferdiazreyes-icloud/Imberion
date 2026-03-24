"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/charts/kpi-card";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BaseChart } from "@/components/charts/base-chart";
import { useFilters } from "@/hooks/useFilters";
import { getOverview, getOverviewByCategory, getOverviewBySegment, getOverviewByTerritory } from "@/lib/api";
import { EDITORIAL_COLORS, SEGMENT_FILL, fmtM, fmtN, fmtCurrency } from "@/lib/echarts-theme";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EOption = Record<string, any>;

export default function OverviewPage() {
  const { getActiveParams } = useFilters();
  const params = getActiveParams();

  const { data: overview } = useQuery({
    queryKey: ["overview", params],
    queryFn: () => getOverview(params),
  });

  const { data: byCategory } = useQuery({
    queryKey: ["overview-category", params],
    queryFn: () => getOverviewByCategory(params),
  });

  const { data: bySegment } = useQuery({
    queryKey: ["overview-segment", params],
    queryFn: () => getOverviewBySegment(params),
  });

  const { data: byTerritory } = useQuery({
    queryKey: ["overview-territory", params],
    queryFn: () => getOverviewByTerritory(params),
  });

  const isLoading = !overview && !byCategory;

  // --- Lollipop chart: Ingreso por Categoría ---
  const lollipopOption = useMemo<EOption>(() => {
    const data = (byCategory || []).sort((a, b) => b.revenue - a.revenue);
    const categories = data.map((d) => d.category_name);
    const values = data.map((d) => d.revenue);

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = (params as Array<{ name: string; value: number }>)[0];
          return `<strong>${p.name}</strong><br/>Ingreso: ${fmtCurrency(p.value)}`;
        },
      },
      grid: { left: 12, right: 80, top: 12, bottom: 12, containLabel: true },
      xAxis: {
        type: "value",
        axisLabel: { formatter: (v: number) => fmtM(v) },
        splitLine: { lineStyle: { color: "#F3F4F6", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
        inverse: true,
      },
      series: [
        // Thin line from axis
        {
          type: "bar",
          data: values,
          barWidth: 2,
          itemStyle: { color: EDITORIAL_COLORS.navy },
          z: 1,
        },
        // Dot at the end
        {
          type: "scatter",
          data: values.map((v, i) => [v, i]),
          symbolSize: 14,
          itemStyle: { color: EDITORIAL_COLORS.navy },
          z: 2,
          label: {
            show: true,
            position: "right",
            formatter: (p: { value: number[] }) => fmtM(p.value[0]),
            fontSize: 12,
            fontWeight: 600,
            color: EDITORIAL_COLORS.text,
            fontFamily: "'Inter', sans-serif",
          },
        },
      ],
    };
  }, [byCategory]);

  // --- Rose/Nightingale chart: Volumen por Segmento ---
  const SEGMENT_ICONS: Record<string, string> = { oro: "🥇", plata: "🥈", bronce: "🥉" };
  const SEGMENT_CHART_COLORS: Record<string, string> = {
    oro: EDITORIAL_COLORS.coral,
    plata: EDITORIAL_COLORS.navy,
    bronce: EDITORIAL_COLORS.gray,
  };

  const roseOption = useMemo<EOption>(() => {
    const sorted = [...(bySegment || [])].sort((a, b) => b.volume - a.volume);
    const totalVolume = sorted.reduce((sum, d) => sum + d.volume, 0);
    const data = sorted.map((d) => ({
      name: d.segment,
      value: d.volume,
    }));

    return {
      tooltip: {
        trigger: "item",
        formatter: (p: { name: string; value: number; percent: number }) =>
          `<strong>${SEGMENT_ICONS[p.name] || ""} ${p.name}</strong><br/>Volumen: ${fmtN(p.value)}<br/>${p.percent.toFixed(0)}%`,
      },
      legend: {
        bottom: 0,
        icon: "circle",
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: EDITORIAL_COLORS.textMuted, fontSize: 12 },
        formatter: (name: string) => `${SEGMENT_ICONS[name] || ""} ${name}`,
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "72%"],
          center: ["50%", "45%"],
          data,
          itemStyle: {
            borderRadius: 4,
            color: (params: { name: string }) =>
              SEGMENT_CHART_COLORS[params.name] || EDITORIAL_COLORS.gray,
          },
          label: {
            show: true,
            formatter: (p: { name: string; percent: number }) =>
              `${SEGMENT_ICONS[p.name] || ""} ${p.name}\n${p.percent.toFixed(0)}%`,
            fontSize: 12,
            fontWeight: 600,
            color: EDITORIAL_COLORS.text,
            fontFamily: "'Inter', sans-serif",
            lineHeight: 18,
          },
          labelLine: {
            length: 12,
            length2: 8,
            lineStyle: { color: EDITORIAL_COLORS.gray },
          },
          // Volume value inside each slice
          labelLayout: { hideOverlap: true },
          emphasis: {
            itemStyle: { shadowBlur: 12, shadowColor: "rgba(0,0,0,0.12)" },
          },
        },
        // Second series: same data, same position, only inside labels (volume)
        {
          type: "pie",
          radius: ["40%", "72%"],
          center: ["50%", "45%"],
          data,
          itemStyle: { color: "transparent" },
          silent: true,
          label: {
            show: true,
            position: "inside",
            formatter: (p: { value: number }) => fmtN(p.value),
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
          },
          labelLine: { show: false },
          emphasis: { disabled: true },
        },
      ],
    };
  }, [bySegment]);

  // --- Dot plot: Ingreso por Territorio ---
  const dotPlotOption = useMemo<EOption>(() => {
    const data = (byTerritory || []).sort((a, b) => b.revenue - a.revenue);
    const states = data.map((d) => d.state);
    const values = data.map((d) => d.revenue);
    const maxVal = Math.max(...values, 1);

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = (params as Array<{ name: string; value: number }>)[0];
          return `<strong>${p.name}</strong><br/>Ingreso: ${fmtCurrency(p.value)}`;
        },
      },
      grid: { left: 12, right: 80, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: "value",
        max: maxVal * 1.15,
        axisLabel: { show: false },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: "category",
        data: states,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
        inverse: true,
      },
      series: [
        // Background bar (light gray)
        {
          type: "bar",
          data: values.map(() => maxVal * 1.1),
          barWidth: 3,
          itemStyle: { color: "#F3F4F6" },
          z: 0,
          silent: true,
        },
        // Value bar (thin line)
        {
          type: "bar",
          data: values,
          barWidth: 3,
          itemStyle: { color: EDITORIAL_COLORS.coral },
          z: 1,
        },
        // Dot at end
        {
          type: "scatter",
          data: values.map((v, i) => [v, i]),
          symbolSize: 12,
          itemStyle: { color: EDITORIAL_COLORS.coral },
          z: 2,
          label: {
            show: true,
            position: "right",
            formatter: (p: { value: number[] }) => fmtM(p.value[0]),
            fontSize: 11,
            fontWeight: 600,
            color: EDITORIAL_COLORS.text,
            fontFamily: "'Inter', sans-serif",
          },
        },
      ],
    };
  }, [byTerritory]);

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="section-title text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Overview</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>Resumen ejecutivo del portafolio analizado</p>
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

      {overview && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 stagger-children">
          <KPICard label={overview.total_revenue.label} value={overview.total_revenue.value} unit="MXN" accentColor="var(--kpi-stripe-1)" />
          <KPICard label={overview.total_volume.label} value={overview.total_volume.value} unit="unidades" accentColor="var(--kpi-stripe-2)" />
          <KPICard label={overview.avg_net_price.label} value={overview.avg_net_price.value} unit="MXN" accentColor="var(--kpi-stripe-3)" />
          <KPICard label={overview.avg_elasticity.label} value={overview.avg_elasticity.value} accentColor="var(--kpi-stripe-4)" />
          <KPICard label={overview.modeled_coverage_pct.label} value={overview.modeled_coverage_pct.value} unit="%" accentColor="var(--kpi-stripe-5)" />
          <KPICard label={overview.avg_rebate.label} value={overview.avg_rebate.value} unit="MXN" accentColor="var(--kpi-stripe-6)" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingreso por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseChart option={lollipopOption} height={320} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volumen por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseChart option={roseOption} height={320} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingreso por Territorio</CardTitle>
          </CardHeader>
          <CardContent>
            <BaseChart option={dotPlotOption} height={350} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
