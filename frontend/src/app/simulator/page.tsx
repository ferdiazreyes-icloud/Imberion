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
import { useFilters } from "@/hooks/useFilters";
import { quickSimulate, getScenarios, createScenario, getScenarioResults } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { CHART_COLORS, tooltipStyle, axisTickStyle, gridStyle } from "@/lib/chart-theme";

export default function SimulatorPage() {
  const { getActiveParams } = useFilters();
  const params = getActiveParams();
  const queryClient = useQueryClient();

  const [priceChange, setPriceChange] = useState(5);
  const [scenarioName, setScenarioName] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);

  const { data: simulation, isLoading } = useQuery({
    queryKey: ["quick-simulate", params, priceChange],
    queryFn: () => quickSimulate({ ...params, price_change_pct: String(priceChange) }),
  });

  const { data: scenarios } = useQuery({
    queryKey: ["scenarios"],
    queryFn: getScenarios,
  });

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

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Simulador de Precios</h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Modela escenarios predictivos de cambio de precio</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Configurar Escenario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Cambio de precio (%)</label>
              <input
                type="range"
                min={-20}
                max={20}
                step={1}
                value={priceChange}
                onChange={(e) => setPriceChange(Number(e.target.value))}
                className="mt-1 block w-48 accent-[#A6192E]"
              />
              <span className="text-lg font-bold" style={{ color: priceChange >= 0 ? "var(--positive)" : "var(--negative)" }}>
                {priceChange >= 0 ? "+" : ""}{priceChange}%
              </span>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Nombre del escenario</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Ej: Aumento Q2 2025"
                  className="mt-1 block rounded-lg border px-3 py-2 text-sm"
                  style={{
                    background: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <button
                onClick={handleCreateScenario}
                disabled={!scenarioName || createMutation.isPending}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: "var(--usg-red)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--usg-red-dark)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--usg-red)"}
              >
                {createMutation.isPending ? "Guardando..." : "Guardar Escenario"}
              </button>
            </div>
            {simulation && (
              <div className="ml-auto text-right">
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Elasticidad utilizada</p>
                <p className="text-lg font-mono font-bold" style={{ color: "var(--text-primary)" }}>{simulation.elasticity_used?.toFixed(3)}</p>
                <Badge variant={simulation.confidence}>{simulation.confidence}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Curva Precio-Volumen-Margen</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={curve}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="price_change_pct" tick={axisTickStyle} tickFormatter={(v) => `${v}%`} />
                <YAxis yAxisId="left" tick={axisTickStyle} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <YAxis yAxisId="right" orientation="right" tick={axisTickStyle} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                <Tooltip {...tooltipStyle} formatter={(v, name) => [formatCurrency(Number(v)), name]} labelFormatter={(v) => `Cambio: ${v}%`} />
                <Legend />
                <ReferenceLine x={0} stroke="var(--text-tertiary)" strokeDasharray="3 3" label="Base" />
                <ReferenceLine x={priceChange} stroke="var(--usg-red)" strokeWidth={2} label={`${priceChange}%`} />
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.margin} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={CHART_COLORS.margin} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke={CHART_COLORS.revenue} fill="url(#revenueGrad)" name="Ingreso" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="margin" stroke={CHART_COLORS.margin} fill="url(#marginGrad)" name="Margen" strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="volume" stroke={CHART_COLORS.warning} name="Volumen" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Escenarios Guardados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {(scenarios || []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  className="w-full text-left rounded-lg border p-3 text-sm transition-all"
                  style={{
                    borderColor: selectedScenario === s.id ? "var(--usg-red)" : "var(--border-primary)",
                    background: selectedScenario === s.id ? "var(--accent-light)" : "var(--bg-secondary)",
                  }}
                >
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.description}</p>
                </button>
              ))}
              {(!scenarios || scenarios.length === 0) && (
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No hay escenarios guardados</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultados del Escenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0" style={{ background: "var(--table-header-bg)" }}>
                  <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                    <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Producto</th>
                    <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Cambio</th>
                    <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Vol. Esperado</th>
                    <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Ingreso Esp.</th>
                    <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Confianza</th>
                  </tr>
                </thead>
                <tbody>
                  {(scenarioResults || []).slice(0, 20).map((r) => (
                    <tr key={r.id} className="transition-colors" style={{ borderBottom: "1px solid var(--border-secondary)" }}
                      onMouseEnter={(ev) => ev.currentTarget.style.background = "var(--table-row-hover)"}
                      onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}
                    >
                      <td className="py-2 max-w-[150px] truncate" style={{ color: "var(--text-primary)" }}>{r.product_name}</td>
                      <td className="py-2 font-mono" style={{ color: r.price_change_pct >= 0 ? "var(--positive)" : "var(--negative)" }}>
                        {r.price_change_pct >= 0 ? "+" : ""}{r.price_change_pct}%
                      </td>
                      <td className="py-2" style={{ color: "var(--text-secondary)" }}>{formatNumber(r.expected_volume)}</td>
                      <td className="py-2" style={{ color: "var(--text-secondary)" }}>{formatCurrency(r.expected_revenue)}</td>
                      <td className="py-2"><Badge variant={r.confidence_level}>{r.confidence_level}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!selectedScenario && (
                <p className="py-4 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Selecciona un escenario para ver resultados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
