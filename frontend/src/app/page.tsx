"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { KPICard } from "@/components/charts/kpi-card";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFilters } from "@/hooks/useFilters";
import { getOverview, getOverviewByCategory, getOverviewBySegment, getOverviewByTerritory } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TABLEAU_PALETTE, SEGMENT_COLORS, CHART_COLORS, tooltipStyle, axisTickStyle, gridStyle } from "@/lib/chart-theme";

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

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Overview</h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Resumen ejecutivo del portafolio analizado</p>
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
          <KPICard label={overview.total_revenue.label} value={overview.total_revenue.value} unit="MXN" />
          <KPICard label={overview.total_volume.label} value={overview.total_volume.value} unit="unidades" />
          <KPICard label={overview.avg_net_price.label} value={overview.avg_net_price.value} unit="MXN" />
          <KPICard label={overview.avg_elasticity.label} value={overview.avg_elasticity.value} />
          <KPICard label={overview.modeled_coverage_pct.label} value={overview.modeled_coverage_pct.value} unit="%" />
          <KPICard label={overview.avg_rebate.label} value={overview.avg_rebate.value} unit="MXN" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingreso por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCategory || []}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="category_name" tick={axisTickStyle} angle={-30} textAnchor="end" height={80} />
                <YAxis tick={axisTickStyle} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                <defs>
                  <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={1} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <Bar dataKey="revenue" fill="url(#barGradient1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volumen por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bySegment || []}
                  dataKey="volume"
                  nameKey="segment"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  strokeWidth={2}
                  stroke="var(--bg-secondary)"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {(bySegment || []).map((entry) => (
                    <Cell key={entry.segment} fill={SEGMENT_COLORS[entry.segment] || "#8C939A"} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(v) => formatNumber(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingreso por Territorio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byTerritory || []} layout="vertical">
                <CartesianGrid {...gridStyle} />
                <XAxis type="number" tick={axisTickStyle} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <YAxis type="category" dataKey="state" width={120} tick={axisTickStyle} />
                <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                <defs>
                  <linearGradient id="barGradient2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={CHART_COLORS.secondary} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={CHART_COLORS.secondary} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Bar dataKey="revenue" fill="url(#barGradient2)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
