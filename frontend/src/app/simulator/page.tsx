"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, Line, BarChart, Bar,
} from "recharts";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFilters } from "@/hooks/useFilters";
import {
  quickSimulate, getScenarios, createScenario, getScenarioResults,
  getScenarioSummary, getScenarioResultsGrouped,
  compareMultiScenarios, getBestScenario,
} from "@/lib/api";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { CHART_COLORS, TABLEAU_PALETTE, tooltipStyle, axisTickStyle, gridStyle } from "@/lib/chart-theme";
import type { ScenarioCompareItem, GroupedResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------
type ResultTab = "portfolio" | "category" | "segment" | "territory" | "sku";
type MainTab = "simulate" | "compare" | "best";

export default function SimulatorPage() {
  const { getActiveParams } = useFilters();
  const params = getActiveParams();
  const queryClient = useQueryClient();

  // State
  const [priceChange, setPriceChange] = useState(5);
  const [scenarioName, setScenarioName] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("simulate");
  const [resultTab, setResultTab] = useState<ResultTab>("portfolio");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [bestObjective, setBestObjective] = useState<string>("margin");

  // Queries
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

  const { data: scenarioSummary } = useQuery({
    queryKey: ["scenario-summary", selectedScenario],
    queryFn: () => getScenarioSummary(selectedScenario!),
    enabled: !!selectedScenario,
  });

  const groupByParam = resultTab === "portfolio" || resultTab === "sku" ? null : resultTab;
  const { data: groupedResults } = useQuery({
    queryKey: ["scenario-grouped", selectedScenario, groupByParam],
    queryFn: () => getScenarioResultsGrouped(selectedScenario!, groupByParam!),
    enabled: !!selectedScenario && !!groupByParam,
  });

  const { data: compareData } = useQuery({
    queryKey: ["compare-multi", compareIds],
    queryFn: () => compareMultiScenarios(compareIds),
    enabled: compareIds.length >= 2,
  });

  const { data: bestData } = useQuery({
    queryKey: ["best-scenario", bestObjective],
    queryFn: () => getBestScenario(bestObjective),
    enabled: mainTab === "best" && (scenarios?.length ?? 0) > 0,
  });

  const createMutation = useMutation({
    mutationFn: createScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["best-scenario"] });
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

  const toggleCompare = (id: number) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const curve = simulation?.curve || [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Simulador de Precios</h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Modela escenarios predictivos de cambio de precio</p>
      </div>

      <GlobalFilters />

      {/* Main tabs */}
      <div className="flex gap-2">
        {([
          ["simulate", "Simular"],
          ["compare", "Comparar"],
          ["best", "Mejor Escenario"],
        ] as [MainTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: mainTab === tab ? "var(--usg-red)" : "var(--bg-tertiary)",
              color: mainTab === tab ? "#fff" : "var(--text-secondary)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <div className="flex gap-2">
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--usg-red)" }} />
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--usg-red)", animationDelay: "0.2s" }} />
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "var(--usg-red)", animationDelay: "0.4s" }} />
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB: SIMULATE */}
      {/* ================================================================= */}
      {mainTab === "simulate" && (
        <>
          {/* Scenario config card */}
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

          {/* Curve chart */}
          <Card>
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
                  <Tooltip {...tooltipStyle} formatter={(v, name) => [formatCurrency(Number(v)), String(name)]} labelFormatter={(v) => `Cambio: ${v}%`} />
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

          {/* Scenarios list + Results */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Saved scenarios */}
            <Card>
              <CardHeader>
                <CardTitle>Escenarios Guardados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-auto">
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

            {/* Scenario summary + drill-down */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Resultados del Escenario</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedScenario ? (
                  <p className="py-4 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Selecciona un escenario para ver resultados</p>
                ) : (
                  <div className="space-y-4">
                    {/* Summary KPIs */}
                    {scenarioSummary && (
                      <div className="grid grid-cols-3 gap-3">
                        <SummaryKPI label="Volumen" value={formatNumber(scenarioSummary.total_volume)} delta={formatPercent(scenarioSummary.delta_volume_pct)} positive={scenarioSummary.delta_volume_pct >= 0} />
                        <SummaryKPI label="Ingreso" value={formatCurrency(scenarioSummary.total_revenue)} delta={formatPercent(scenarioSummary.delta_revenue_pct)} positive={scenarioSummary.delta_revenue_pct >= 0} />
                        <SummaryKPI label="Margen" value={formatCurrency(scenarioSummary.total_margin)} delta={formatPercent(scenarioSummary.delta_margin_pct)} positive={scenarioSummary.delta_margin_pct >= 0} />
                      </div>
                    )}

                    {/* Drill-down tabs */}
                    <div className="flex gap-1 border-b" style={{ borderColor: "var(--border-primary)" }}>
                      {([
                        ["portfolio", "Portafolio"],
                        ["category", "Categoría"],
                        ["segment", "Segmento"],
                        ["territory", "Territorio"],
                        ["sku", "SKU"],
                      ] as [ResultTab, string][]).map(([tab, label]) => (
                        <button
                          key={tab}
                          onClick={() => setResultTab(tab)}
                          className="px-3 py-2 text-xs font-medium transition-colors border-b-2"
                          style={{
                            borderColor: resultTab === tab ? "var(--usg-red)" : "transparent",
                            color: resultTab === tab ? "var(--usg-red)" : "var(--text-tertiary)",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Portfolio view — summary by_category chart */}
                    {resultTab === "portfolio" && scenarioSummary && (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={scenarioSummary.by_category}>
                          <CartesianGrid {...gridStyle} />
                          <XAxis dataKey="name" tick={{ ...axisTickStyle, fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
                          <YAxis tick={axisTickStyle} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                          <Tooltip {...tooltipStyle} formatter={(v, name) => [formatCurrency(Number(v)), String(name)]} />
                          <Legend />
                          <Bar dataKey="total_revenue" name="Ingreso" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="total_margin" name="Margen" fill={CHART_COLORS.margin} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {/* Grouped results table (category, segment, territory) */}
                    {groupByParam && groupedResults && (
                      <div className="max-h-[300px] overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0" style={{ background: "var(--table-header-bg)" }}>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                              <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Grupo</th>
                              <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Productos</th>
                              <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Volumen</th>
                              <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Ingreso</th>
                              <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Margen</th>
                              <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Cambio Prom.</th>
                              <th className="pb-2 text-center text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Confianza</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedResults.map((g: GroupedResult) => (
                              <tr key={g.group_key} style={{ borderBottom: "1px solid var(--border-secondary)" }}
                                className="transition-colors"
                                onMouseEnter={(ev) => ev.currentTarget.style.background = "var(--table-row-hover)"}
                                onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}
                              >
                                <td className="py-2 font-medium" style={{ color: "var(--text-primary)" }}>{g.group_name}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{g.product_count}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{formatNumber(g.total_volume)}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{formatCurrency(g.total_revenue)}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{formatCurrency(g.total_margin)}</td>
                                <td className="py-2 text-right font-mono" style={{ color: g.avg_price_change_pct >= 0 ? "var(--positive)" : "var(--negative)" }}>
                                  {formatPercent(g.avg_price_change_pct)}
                                </td>
                                <td className="py-2 text-center"><Badge variant={g.avg_confidence}>{g.avg_confidence}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* SKU-level table */}
                    {resultTab === "sku" && (
                      <div className="max-h-[300px] overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0" style={{ background: "var(--table-header-bg)" }}>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                              <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Producto</th>
                              <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Cambio</th>
                              <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Volumen</th>
                              <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Ingreso</th>
                              <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Margen</th>
                              <th className="pb-2 text-center text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Confianza</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(scenarioResults || []).map((r) => (
                              <tr key={r.id} className="transition-colors" style={{ borderBottom: "1px solid var(--border-secondary)" }}
                                onMouseEnter={(ev) => ev.currentTarget.style.background = "var(--table-row-hover)"}
                                onMouseLeave={(ev) => ev.currentTarget.style.background = "transparent"}
                              >
                                <td className="py-2 max-w-[150px] truncate" style={{ color: "var(--text-primary)" }}>{r.product_name}</td>
                                <td className="py-2 text-right font-mono" style={{ color: r.price_change_pct >= 0 ? "var(--positive)" : "var(--negative)" }}>
                                  {formatPercent(r.price_change_pct)}
                                </td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{formatNumber(r.expected_volume)}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{formatCurrency(r.expected_revenue)}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{formatCurrency(r.expected_revenue * 0.3)}</td>
                                <td className="py-2 text-center"><Badge variant={r.confidence_level}>{r.confidence_level}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* TAB: COMPARE */}
      {/* ================================================================= */}
      {mainTab === "compare" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Selecciona escenarios a comparar (2-4)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(scenarios || []).map((s) => {
                  const selected = compareIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleCompare(s.id)}
                      className="rounded-lg border px-3 py-2 text-sm transition-all"
                      style={{
                        borderColor: selected ? "var(--usg-red)" : "var(--border-primary)",
                        background: selected ? "var(--accent-light)" : "var(--bg-secondary)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {selected && <span className="mr-1">&#10003;</span>}
                      {s.name}
                    </button>
                  );
                })}
                {(!scenarios || scenarios.length === 0) && (
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Guarda al menos 2 escenarios para comparar</p>
                )}
              </div>
            </CardContent>
          </Card>

          {compareData && (
            <>
              {/* Rankings highlight */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RankingCard
                  label="Mejor para Volumen"
                  scenarioId={compareData.rankings.best_for_volume}
                  scenarios={compareData.scenarios}
                  metric="total_volume"
                  formatter={formatNumber}
                />
                <RankingCard
                  label="Mejor para Ingreso"
                  scenarioId={compareData.rankings.best_for_revenue}
                  scenarios={compareData.scenarios}
                  metric="total_revenue"
                  formatter={formatCurrency}
                />
                <RankingCard
                  label="Mejor para Margen"
                  scenarioId={compareData.rankings.best_for_margin}
                  scenarios={compareData.scenarios}
                  metric="total_margin"
                  formatter={formatCurrency}
                />
              </div>

              {/* Side-by-side comparison table */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparación lado a lado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                          <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Métrica</th>
                          {compareData.scenarios.map((s) => (
                            <th key={s.scenario_id} className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                              {s.scenario_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {([
                          ["Volumen", "total_volume", "delta_volume_pct", formatNumber],
                          ["Ingreso", "total_revenue", "delta_revenue_pct", formatCurrency],
                          ["Margen", "total_margin", "delta_margin_pct", formatCurrency],
                        ] as [string, keyof ScenarioCompareItem, keyof ScenarioCompareItem, (n: number) => string][]).map(([label, key, deltaKey, fmt]) => (
                          <tr key={label} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                            <td className="py-3 font-medium" style={{ color: "var(--text-primary)" }}>{label}</td>
                            {compareData.scenarios.map((s) => {
                              const val = s[key] as number;
                              const delta = s[deltaKey] as number;
                              const isBest =
                                (key === "total_volume" && s.scenario_id === compareData.rankings.best_for_volume) ||
                                (key === "total_revenue" && s.scenario_id === compareData.rankings.best_for_revenue) ||
                                (key === "total_margin" && s.scenario_id === compareData.rankings.best_for_margin);
                              return (
                                <td key={s.scenario_id} className="py-3 text-right" style={{
                                  color: isBest ? "var(--positive)" : "var(--text-secondary)",
                                  fontWeight: isBest ? 700 : 400,
                                }}>
                                  <div>{fmt(val)}</div>
                                  <div className="text-xs font-mono" style={{ color: delta >= 0 ? "var(--positive)" : "var(--negative)" }}>
                                    {formatPercent(delta)}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Comparison bar chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparación visual</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={compareData.scenarios.map((s) => ({
                      name: s.scenario_name.length > 15 ? s.scenario_name.slice(0, 15) + "..." : s.scenario_name,
                      Ingreso: s.total_revenue,
                      Margen: s.total_margin,
                      Volumen: s.total_volume,
                    }))}>
                      <CartesianGrid {...gridStyle} />
                      <XAxis dataKey="name" tick={axisTickStyle} />
                      <YAxis tick={axisTickStyle} tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`} />
                      <Tooltip {...tooltipStyle} formatter={(v, name) => [formatCurrency(Number(v)), String(name)]} />
                      <Legend />
                      <Bar dataKey="Ingreso" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Margen" fill={CHART_COLORS.margin} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {compareIds.length < 2 && (scenarios?.length ?? 0) > 0 && (
            <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              Selecciona al menos 2 escenarios para ver la comparación
            </p>
          )}
        </>
      )}

      {/* ================================================================= */}
      {/* TAB: BEST SCENARIO */}
      {/* ================================================================= */}
      {mainTab === "best" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Objetivo de optimización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {([
                  ["margin", "Maximizar Margen"],
                  ["volume", "Maximizar Volumen"],
                  ["revenue", "Maximizar Ingreso"],
                ] as [string, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setBestObjective(val)}
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      background: bestObjective === val ? "var(--usg-red)" : "var(--bg-tertiary)",
                      color: bestObjective === val ? "#fff" : "var(--text-secondary)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {bestData && (
            <div className="space-y-4">
              {/* Winner card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ background: "var(--usg-red)" }}>
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        Mejor escenario para {bestObjective === "margin" ? "Margen" : bestObjective === "volume" ? "Volumen" : "Ingreso"}
                      </p>
                      <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{bestData.best.scenario_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Volumen</p>
                          <p className="font-bold" style={{ color: "var(--text-primary)" }}>{formatNumber(bestData.best.total_volume)}</p>
                          <p className="text-xs font-mono" style={{ color: bestData.best.delta_volume_pct >= 0 ? "var(--positive)" : "var(--negative)" }}>{formatPercent(bestData.best.delta_volume_pct)}</p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Ingreso</p>
                          <p className="font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(bestData.best.total_revenue)}</p>
                          <p className="text-xs font-mono" style={{ color: bestData.best.delta_revenue_pct >= 0 ? "var(--positive)" : "var(--negative)" }}>{formatPercent(bestData.best.delta_revenue_pct)}</p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Margen</p>
                          <p className="font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(bestData.best.total_margin)}</p>
                          <p className="text-xs font-mono" style={{ color: bestData.best.delta_margin_pct >= 0 ? "var(--positive)" : "var(--negative)" }}>{formatPercent(bestData.best.delta_margin_pct)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Runners up */}
              {bestData.runners_up.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Siguientes mejores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {bestData.runners_up.map((s, i) => (
                        <div key={s.scenario_id} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
                          <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "var(--border-primary)", color: "var(--text-secondary)" }}>
                            {i + 2}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{s.scenario_name}</p>
                          </div>
                          <div className="flex gap-6 text-right text-sm">
                            <div>
                              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Vol.</p>
                              <p style={{ color: "var(--text-secondary)" }}>{formatNumber(s.total_volume)}</p>
                            </div>
                            <div>
                              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Ingreso</p>
                              <p style={{ color: "var(--text-secondary)" }}>{formatCurrency(s.total_revenue)}</p>
                            </div>
                            <div>
                              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Margen</p>
                              <p style={{ color: "var(--text-secondary)" }}>{formatCurrency(s.total_margin)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {bestData.runners_up.length === 0 && (
                <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                  Guarda más escenarios para ver el ranking completo
                </p>
              )}
            </div>
          )}

          {(!scenarios || scenarios.length === 0) && (
            <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              Guarda al menos un escenario desde la pestaña &quot;Simular&quot; para usar esta función
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function SummaryKPI({ label, value, delta, positive }: { label: string; value: string; delta: string; positive: boolean }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--bg-tertiary)" }}>
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
      <p className="text-xs font-mono" style={{ color: positive ? "var(--positive)" : "var(--negative)" }}>{delta} vs base</p>
    </div>
  );
}

function RankingCard({
  label, scenarioId, scenarios, metric, formatter,
}: {
  label: string;
  scenarioId: number;
  scenarios: ScenarioCompareItem[];
  metric: keyof ScenarioCompareItem;
  formatter: (n: number) => string;
}) {
  const s = scenarios.find((x) => x.scenario_id === scenarioId);
  if (!s) return null;
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</p>
        <p className="text-sm font-bold mt-1" style={{ color: "var(--text-primary)" }}>{s.scenario_name}</p>
        <p className="text-lg font-bold mt-1" style={{ color: "var(--positive)" }}>{formatter(s[metric] as number)}</p>
      </CardContent>
    </Card>
  );
}
