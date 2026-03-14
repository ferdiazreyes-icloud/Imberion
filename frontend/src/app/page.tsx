"use client";

import { useEffect, useState } from "react";
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

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#4f46e5", "#dc2626", "#ca8a04", "#059669"];
const SEGMENT_COLORS: Record<string, string> = { oro: "#eab308", plata: "#9ca3af", bronce: "#c2410c" };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">Resumen ejecutivo del portafolio analizado</p>
      </div>

      <GlobalFilters />

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <KPICard label={overview.total_revenue.label} value={overview.total_revenue.value} unit="MXN" />
          <KPICard label={overview.total_volume.label} value={overview.total_volume.value} unit="unidades" />
          <KPICard label={overview.avg_net_price.label} value={overview.avg_net_price.value} unit="MXN" />
          <KPICard label={overview.avg_elasticity.label} value={overview.avg_elasticity.value} />
          <KPICard label={overview.modeled_coverage_pct.label} value={overview.modeled_coverage_pct.value} unit="%" />
          <KPICard label={overview.avg_rebate.label} value={overview.avg_rebate.value} unit="MXN" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Ingreso por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCategory || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category_name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={80} />
                <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume by Segment */}
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
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {(bySegment || []).map((entry: any) => (
                    <Cell key={entry.segment} fill={SEGMENT_COLORS[entry.segment] || "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatNumber(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Territory */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingreso por Territorio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byTerritory || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <YAxis type="category" dataKey="state" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
