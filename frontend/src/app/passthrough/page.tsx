"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Area, Line,
} from "recharts";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFilters } from "@/hooks/useFilters";
import { getPassthroughBySegment, getPassthroughByCategory, getPassthroughTrends } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { CHART_COLORS, tooltipStyle, axisTickStyle, gridStyle } from "@/lib/chart-theme";

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

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Passthrough y Rebates</h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Analisis de precio lista, descuento, rebate y precio neto</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Descomposicion de Precio por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={bySegment || []}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="segment" tick={axisTickStyle} />
                <YAxis tick={axisTickStyle} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="avg_net_price" fill={CHART_COLORS.netPrice} name="Precio Neto" radius={[0, 0, 0, 0]} />
                <Bar dataKey="avg_discount" fill={CHART_COLORS.discount} name="Descuento" />
                <Bar dataKey="avg_rebate" fill={CHART_COLORS.rebate} name="Rebate" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rebate como % del Precio Lista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(bySegment || []).map((s) => (
                <div key={s.segment} className="flex items-center gap-3">
                  <Badge variant={s.segment} className="w-16 justify-center">{s.segment}</Badge>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>Rebate: {s.rebate_pct.toFixed(1)}%</span>
                      <span style={{ color: "var(--text-secondary)" }}>Descuento: {s.discount_pct.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1 h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                      <div
                        className="h-3 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(s.rebate_pct + s.discount_pct, 100)}%`, background: CHART_COLORS.rebate }}
                      >
                        <div
                          className="h-3 rounded-full"
                          style={{ width: `${(s.discount_pct / (s.rebate_pct + s.discount_pct)) * 100}%`, background: CHART_COLORS.discount }}
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
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byCategory || []} layout="vertical">
                <CartesianGrid {...gridStyle} />
                <XAxis type="number" tick={axisTickStyle} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <YAxis type="category" dataKey="category_name" width={120} tick={axisTickStyle} />
                <Tooltip {...tooltipStyle} formatter={(v) => `${Number(v).toFixed(2)}%`} />
                <Bar dataKey="rebate_pct" fill={CHART_COLORS.rebate} name="Rebate %" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolucion de Componentes de Precio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={trends || []}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="period" tick={axisTickStyle} />
                <YAxis tick={axisTickStyle} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip {...tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <defs>
                  <linearGradient id="listPriceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.listPrice} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={CHART_COLORS.listPrice} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="avg_list_price" fill="url(#listPriceGrad)" stroke={CHART_COLORS.listPrice} name="Precio Lista" />
                <Line type="monotone" dataKey="avg_net_price" stroke={CHART_COLORS.netPrice} strokeWidth={2.5} name="Precio Neto" dot={false} />
                <Line type="monotone" dataKey="avg_rebate" stroke={CHART_COLORS.rebate} strokeWidth={2} name="Rebate" dot={false} />
                <Line type="monotone" dataKey="avg_discount" stroke={CHART_COLORS.discount} strokeWidth={2} name="Descuento" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
