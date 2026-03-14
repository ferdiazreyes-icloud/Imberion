"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, ComposedChart, Area,
} from "recharts";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFilters } from "@/hooks/useFilters";
import { getPassthroughBySegment, getPassthroughByCategory, getPassthroughTrends } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function PassthroughPage() {
  const { getActiveParams } = useFilters();
  const params = getActiveParams();

  const { data: bySegment } = useQuery({
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Passthrough y Rebates</h1>
        <p className="text-sm text-gray-500">Analisis de precio lista, descuento, rebate y precio neto</p>
      </div>

      <GlobalFilters />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Price Waterfall by Segment */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Descomposicion de Precio por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={bySegment || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" />
                <YAxis tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="avg_net_price" fill="#2563eb" name="Precio Neto" />
                <Bar dataKey="avg_discount" fill="#eab308" name="Descuento" />
                <Bar dataKey="avg_rebate" fill="#dc2626" name="Rebate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rebate % by Segment */}
        <Card>
          <CardHeader>
            <CardTitle>Rebate como % del Precio Lista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(bySegment || []).map((s: any) => (
                <div key={s.segment} className="flex items-center gap-3">
                  <Badge variant={s.segment} className="w-16 justify-center">{s.segment}</Badge>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rebate: {s.rebate_pct.toFixed(1)}%</span>
                      <span className="text-gray-600">Descuento: {s.discount_pct.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1 h-3 rounded-full bg-gray-200">
                      <div
                        className="h-3 rounded-full bg-red-400"
                        style={{ width: `${Math.min(s.rebate_pct + s.discount_pct, 100)}%` }}
                      >
                        <div
                          className="h-3 rounded-full bg-amber-400"
                          style={{ width: `${(s.discount_pct / (s.rebate_pct + s.discount_pct)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rebate by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Rebate Promedio por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byCategory || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <YAxis type="category" dataKey="category_name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(2)}%`} />
                <Bar dataKey="rebate_pct" fill="#dc2626" name="Rebate %" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolucion de Componentes de Precio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="avg_list_price" fill="#e5e7eb" stroke="#9ca3af" name="Precio Lista" />
                <Line type="monotone" dataKey="avg_net_price" stroke="#2563eb" strokeWidth={2} name="Precio Neto" dot={false} />
                <Line type="monotone" dataKey="avg_rebate" stroke="#dc2626" strokeWidth={2} name="Rebate" dot={false} />
                <Line type="monotone" dataKey="avg_discount" stroke="#eab308" strokeWidth={2} name="Descuento" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
