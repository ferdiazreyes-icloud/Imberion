"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Legend,
} from "recharts";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useFilters } from "@/hooks/useFilters";
import { getElasticities, getTrends, getPriceVolume } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { CHART_COLORS, tooltipStyle, axisTickStyle, gridStyle } from "@/lib/chart-theme";

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

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Historial y Elasticidades</h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Lectura backward-looking de precios, volumen y elasticidades</p>
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
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trends?.data || []}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="period" tick={axisTickStyle} />
                <YAxis yAxisId="left" tick={axisTickStyle} tickFormatter={(v) => `$${(v).toFixed(0)}`} />
                <YAxis yAxisId="right" orientation="right" tick={axisTickStyle} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="net_price" stroke={CHART_COLORS.netPrice} name="Precio Neto" strokeWidth={2.5} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="list_price" stroke={CHART_COLORS.listPrice} name="Precio Lista" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="volume" stroke={CHART_COLORS.volume} name="Volumen" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precio vs Volumen (Elasticidad Visual)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="avg_price" name="Precio" tick={axisTickStyle} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <YAxis dataKey="total_volume" name="Volumen" tick={axisTickStyle} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={priceVolume || []} fill={CHART_COLORS.secondary} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Elasticidades Historicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0" style={{ background: "var(--table-header-bg)" }}>
                  <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                    <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Nodo</th>
                    <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Coeficiente</th>
                    <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>R²</th>
                    <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Confianza</th>
                    <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Muestra</th>
                  </tr>
                </thead>
                <tbody>
                  {(elasticities || []).slice(0, 30).map((e) => (
                    <tr key={e.id} className="transition-colors" style={{ borderBottom: "1px solid var(--border-secondary)" }}
                      onMouseEnter={(ev) => ev.currentTarget.style.background = "var(--table-row-hover)"}
                      onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}
                    >
                      <td className="py-2 font-medium" style={{ color: "var(--text-primary)" }}>{e.node_type} #{e.node_id}</td>
                      <td className="py-2 font-mono" style={{ color: "var(--text-primary)" }}>{e.coefficient.toFixed(3)}</td>
                      <td className="py-2" style={{ color: "var(--text-secondary)" }}>{e.r_squared.toFixed(3)}</td>
                      <td className="py-2"><Badge variant={e.confidence_level}>{e.confidence_level}</Badge></td>
                      <td className="py-2" style={{ color: "var(--text-tertiary)" }}>{e.sample_size}</td>
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
