"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, AreaChart, Area,
} from "recharts";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useFilters } from "@/hooks/useFilters";
import { quickSimulate, getScenarios, createScenario, getScenarioResults } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function SimulatorPage() {
  const { getActiveParams } = useFilters();
  const params = getActiveParams();
  const queryClient = useQueryClient();

  const [priceChange, setPriceChange] = useState(5);
  const [scenarioName, setScenarioName] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);

  // Quick simulate curve
  const { data: simulation } = useQuery({
    queryKey: ["quick-simulate", params, priceChange],
    queryFn: () => quickSimulate({ ...params, price_change_pct: String(priceChange) }),
  });

  // Saved scenarios
  const { data: scenarios } = useQuery({
    queryKey: ["scenarios"],
    queryFn: getScenarios,
  });

  // Selected scenario results
  const { data: scenarioResults } = useQuery({
    queryKey: ["scenario-results", selectedScenario],
    queryFn: () => getScenarioResults(selectedScenario!),
    enabled: !!selectedScenario,
  });

  const createMutation = useMutation({
    mutationFn: createScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      setScenarioName("");
    },
  });

  const handleCreateScenario = () => {
    if (!scenarioName) return;
    createMutation.mutate({
      name: scenarioName,
      description: `Cambio de ${priceChange}% en precio`,
      price_changes: [{
        change_pct: priceChange,
        ...(params.category_id ? { category_id: parseInt(params.category_id) } : {}),
        ...(params.segment ? { segment: params.segment } : {}),
      }],
    });
  };

  const curve = simulation?.curve || [];
  const currentPoint = curve.find((p: any) => p.price_change_pct === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Simulador de Precios</h1>
        <p className="text-sm text-gray-500">Modela escenarios predictivos de cambio de precio</p>
      </div>

      <GlobalFilters />

      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Escenario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Cambio de precio (%)</label>
              <input
                type="range"
                min={-20}
                max={20}
                step={1}
                value={priceChange}
                onChange={(e) => setPriceChange(Number(e.target.value))}
                className="mt-1 block w-48"
              />
              <span className={`text-lg font-bold ${priceChange >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {priceChange >= 0 ? "+" : ""}{priceChange}%
              </span>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="text-xs font-medium text-gray-500">Nombre del escenario</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Ej: Aumento Q2 2025"
                  className="mt-1 block rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={handleCreateScenario}
                disabled={!scenarioName || createMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? "Guardando..." : "Guardar Escenario"}
              </button>
            </div>
            {simulation && (
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-500">Elasticidad utilizada</p>
                <p className="text-lg font-mono font-bold">{simulation.elasticity_used?.toFixed(3)}</p>
                <Badge variant={simulation.confidence}>{simulation.confidence}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Price-Volume-Margin Curve */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Curva Precio-Volumen-Margen</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={curve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="price_change_pct" tickFormatter={(v) => `${v}%`} />
                <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(Number(v)), name]}
                  labelFormatter={(v) => `Cambio: ${v}%`}
                />
                <Legend />
                <ReferenceLine x={0} stroke="#666" strokeDasharray="3 3" label="Base" />
                <ReferenceLine x={priceChange} stroke="#dc2626" strokeWidth={2} label={`${priceChange}%`} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} name="Ingreso" />
                <Area yAxisId="right" type="monotone" dataKey="margin" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} name="Margen" />
                <Line yAxisId="left" type="monotone" dataKey="volume" stroke="#eab308" name="Volumen" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Saved Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Escenarios Guardados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {(scenarios || []).map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                    selectedScenario === s.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.description}</p>
                </button>
              ))}
              {(!scenarios || scenarios.length === 0) && (
                <p className="text-sm text-gray-400">No hay escenarios guardados</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scenario Results */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Escenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2">Producto</th>
                    <th className="pb-2">Cambio</th>
                    <th className="pb-2">Vol. Esperado</th>
                    <th className="pb-2">Ingreso Esp.</th>
                    <th className="pb-2">Confianza</th>
                  </tr>
                </thead>
                <tbody>
                  {(scenarioResults || []).slice(0, 20).map((r: any) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 max-w-[150px] truncate">{r.product_name}</td>
                      <td className={`py-2 font-mono ${r.price_change_pct >= 0 ? "text-blue-600" : "text-red-600"}`}>
                        {r.price_change_pct >= 0 ? "+" : ""}{r.price_change_pct}%
                      </td>
                      <td className="py-2">{formatNumber(r.expected_volume)}</td>
                      <td className="py-2">{formatCurrency(r.expected_revenue)}</td>
                      <td className="py-2"><Badge variant={r.confidence_level}>{r.confidence_level}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!selectedScenario && (
                <p className="py-4 text-center text-sm text-gray-400">Selecciona un escenario para ver resultados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
