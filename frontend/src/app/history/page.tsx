"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend,
} from "recharts";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useFilters } from "@/hooks/useFilters";
import { getElasticities, getTrends, getPriceVolume } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function HistoryPage() {
  const { getActiveParams } = useFilters();
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historial y Elasticidades</h1>
        <p className="text-sm text-gray-500">Lectura backward-looking de precios, volumen y elasticidades</p>
      </div>

      <GlobalFilters />

      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-400 animate-pulse">Cargando datos...</p>
        </div>
      )}

      <div className="flex gap-3">
        <Select
          label="Nivel de analisis"
          options={[
            { value: "category", label: "Categoria" },
            { value: "sku", label: "SKU" },
            { value: "territory", label: "Territorio" },
          ]}
          value={nodeType}
          onChange={(e) => setNodeType(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Price & Volume Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendencia Precio Neto y Volumen — {trends?.node_label || "Cargando..."}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trends?.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tickFormatter={(v) => `$${(v).toFixed(0)}`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatNumber(v)} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="net_price" stroke="#2563eb" name="Precio Neto" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="list_price" stroke="#9ca3af" name="Precio Lista" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#16a34a" name="Volumen" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Price-Volume Scatter */}
        <Card>
          <CardHeader>
            <CardTitle>Precio vs Volumen (Elasticidad Visual)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="avg_price" name="Precio" tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <YAxis dataKey="total_volume" name="Volumen" tickFormatter={(v) => formatNumber(v)} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={priceVolume || []} fill="#7c3aed" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Elasticities Table */}
        <Card>
          <CardHeader>
            <CardTitle>Elasticidades Historicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2">Nodo</th>
                    <th className="pb-2">Coeficiente</th>
                    <th className="pb-2">R²</th>
                    <th className="pb-2">Confianza</th>
                    <th className="pb-2">Muestra</th>
                  </tr>
                </thead>
                <tbody>
                  {(elasticities || []).slice(0, 30).map((e) => (
                    <tr key={e.id} className="border-b">
                      <td className="py-2 font-medium">{e.node_type} #{e.node_id}</td>
                      <td className="py-2 font-mono">{e.coefficient.toFixed(3)}</td>
                      <td className="py-2">{e.r_squared.toFixed(3)}</td>
                      <td className="py-2"><Badge variant={e.confidence_level}>{e.confidence_level}</Badge></td>
                      <td className="py-2 text-gray-500">{e.sample_size}</td>
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
