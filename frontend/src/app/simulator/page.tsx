"use client";

import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlobalFilters } from "@/components/filters/global-filters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, ConfidenceDot } from "@/components/ui/badge";
import { useFilters } from "@/hooks/useFilters";
import {
  quickSimulate, getScenarios, createScenario, getScenarioResults,
  getScenarioSummary, getScenarioResultsGrouped,
  compareMultiScenarios, getBestScenario, getExportScenarioCSVUrl,
  getScenarioTemplateUrl, uploadScenarioExcel, createOptimizedScenario,
} from "@/lib/api";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { BaseChart } from "@/components/charts/base-chart";
import { EDITORIAL_COLORS, fmtM, fmtN, fmtCurrency } from "@/lib/echarts-theme";
import type { ScenarioCompareItem, GroupedResult } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EOption = Record<string, any>;

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------
type ResultTab = "portfolio" | "category" | "segment" | "territory" | "sku";
type MainTab = "simulate" | "compare" | "best" | "excel" | "optimize";

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

  // Excel upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelName, setExcelName] = useState("");
  const [excelObjective, setExcelObjective] = useState("margin");
  const [excelResult, setExcelResult] = useState<Record<string, unknown> | null>(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelError, setExcelError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optimization state
  const [optName, setOptName] = useState("");
  const [optObjective, setOptObjective] = useState("margin");
  const [optMinPct, setOptMinPct] = useState(-10);
  const [optMaxPct, setOptMaxPct] = useState(15);
  const [optResult, setOptResult] = useState<Record<string, unknown> | null>(null);
  const [optLoading, setOptLoading] = useState(false);
  const [optError, setOptError] = useState("");

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
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="section-title text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Simulador de Precios</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>Modela escenarios predictivos de cambio de precio</p>
      </div>

      <GlobalFilters />

      {/* Main tabs */}
      <div className="flex gap-2">
        {([
          ["simulate", "Simular"],
          ["compare", "Comparar"],
          ["best", "Mejor Escenario"],
          ["excel", "Cargar Excel"],
          ["optimize", "Optimizar"],
        ] as [MainTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 btn-hover"
            style={{
              background: mainTab === tab ? "var(--gradient-accent)" : "var(--bg-tertiary)",
              color: mainTab === tab ? "#fff" : "var(--text-secondary)",
              boxShadow: mainTab === tab ? "0 4px 12px rgba(166, 25, 46, 0.3)" : "none",
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
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white btn-hover disabled:opacity-50"
                    style={{ background: "var(--gradient-accent)" }}
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
          <CurveChart curve={curve} priceChange={priceChange} />


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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Resultados del Escenario</CardTitle>
                {selectedScenario && (
                  <button
                    onClick={() => window.open(getExportScenarioCSVUrl(selectedScenario), "_blank")}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                    style={{
                      borderColor: "var(--border-primary)",
                      color: "var(--text-secondary)",
                      background: "var(--bg-tertiary)",
                    }}
                  >
                    Exportar CSV
                  </button>
                )}
              </CardHeader>
              <CardContent>
                {!selectedScenario ? (
                  <p className="py-4 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Selecciona un escenario para ver resultados</p>
                ) : (
                  <div className="space-y-4">
                    {/* Summary KPIs */}
                    {scenarioSummary && (
                      <div className="grid grid-cols-3 gap-3">
                        <SummaryKPI label="Volumen" value={fmtN(scenarioSummary.total_volume)} delta={formatPercent(scenarioSummary.delta_volume_pct)} positive={scenarioSummary.delta_volume_pct >= 0} />
                        <SummaryKPI label="Ingreso" value={fmtM(scenarioSummary.total_revenue)} delta={formatPercent(scenarioSummary.delta_revenue_pct)} positive={scenarioSummary.delta_revenue_pct >= 0} />
                        <SummaryKPI label="Margen" value={fmtM(scenarioSummary.total_margin)} delta={formatPercent(scenarioSummary.delta_margin_pct)} positive={scenarioSummary.delta_margin_pct >= 0} />
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
                      <PortfolioChart byCategory={scenarioSummary.by_category} />
                    )}

                    {/* Grouped results table (category, segment, territory) */}
                    {groupByParam && groupedResults && (
                      <div className="max-h-[300px] overflow-auto">
                        <table className="w-full text-[13px]">
                          <thead className="sticky top-0" style={{ background: "var(--bg-secondary)" }}>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                              <th className="px-3 py-3 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Grupo</th>
                              <th className="px-3 py-3 text-right text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Productos</th>
                              <th className="px-3 py-3 text-right text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Volumen</th>
                              <th className="px-3 py-3 text-right text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Ingreso</th>
                              <th className="px-3 py-3 text-right text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Margen</th>
                              <th className="px-3 py-3 text-right text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Cambio Prom.</th>
                              <th className="px-3 py-3 text-center text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Confianza</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedResults.map((g: GroupedResult) => (
                              <tr key={g.group_key} style={{ borderBottom: "1px solid var(--border-secondary)" }}
                                className="table-row-interactive"
                              >
                                <td className="py-2 font-medium" style={{ color: "var(--text-primary)" }}>{g.group_name}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{g.product_count}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{fmtN(g.total_volume)}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{fmtM(g.total_revenue)}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{fmtM(g.total_margin)}</td>
                                <td className="py-2 text-right" style={{ color: g.avg_price_change_pct >= 0 ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>
                                  {formatPercent(g.avg_price_change_pct)}
                                </td>
                                <td className="py-2 text-center"><ConfidenceDot level={g.avg_confidence} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* SKU-level table */}
                    {resultTab === "sku" && (
                      <div className="max-h-[300px] overflow-auto">
                        <table className="w-full text-[13px]">
                          <thead className="sticky top-0" style={{ background: "var(--bg-secondary)" }}>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                              <th className="px-3 py-3 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Producto</th>
                              <th className="px-3 py-3 text-right text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Cambio</th>
                              <th className="px-3 py-3 text-right text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Volumen</th>
                              <th className="px-3 py-3 text-right text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Ingreso</th>
                              <th className="px-3 py-3 text-right text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Margen</th>
                              <th className="px-3 py-3 text-center text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Confianza</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(scenarioResults || []).map((r) => (
                              <tr key={r.id} className="table-row-interactive" style={{ borderBottom: "1px solid var(--border-secondary)" }}
                              >
                                <td className="py-2 max-w-[150px] truncate" style={{ color: "var(--text-primary)" }}>{r.product_name}</td>
                                <td className="py-2 text-right" style={{ color: r.price_change_pct >= 0 ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>
                                  {formatPercent(r.price_change_pct)}
                                </td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{fmtN(r.expected_volume)}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{fmtM(r.expected_revenue)}</td>
                                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{fmtM(r.expected_revenue * 0.3)}</td>
                                <td className="py-2 text-center"><ConfidenceDot level={r.confidence_level} /></td>
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
                  formatter={fmtN}
                />
                <RankingCard
                  label="Mejor para Ingreso"
                  scenarioId={compareData.rankings.best_for_revenue}
                  scenarios={compareData.scenarios}
                  metric="total_revenue"
                  formatter={fmtM}
                />
                <RankingCard
                  label="Mejor para Margen"
                  scenarioId={compareData.rankings.best_for_margin}
                  scenarios={compareData.scenarios}
                  metric="total_margin"
                  formatter={fmtM}
                />
              </div>

              {/* Side-by-side comparison table */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparación lado a lado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <table className="w-full text-[13px]">
                      <thead style={{ background: "var(--bg-secondary)" }}>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                          <th className="px-3 py-3 text-left text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>Métrica</th>
                          {compareData.scenarios.map((s) => (
                            <th key={s.scenario_id} className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                              {s.scenario_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {([
                          ["Volumen", "total_volume", "delta_volume_pct", fmtN],
                          ["Ingreso", "total_revenue", "delta_revenue_pct", fmtM],
                          ["Margen", "total_margin", "delta_margin_pct", fmtM],
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
                                  color: isBest ? "#2B4C7E" : "var(--text-secondary)",
                                  fontWeight: isBest ? 700 : 400,
                                }}>
                                  <div>{fmt(val)}</div>
                                  <div className="text-xs" style={{ color: delta >= 0 ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>
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
              <CompareChart scenarios={compareData.scenarios} />
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
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 btn-hover"
                    style={{
                      background: bestObjective === val ? "var(--gradient-accent)" : "var(--bg-tertiary)",
                      color: bestObjective === val ? "#fff" : "var(--text-secondary)",
                      boxShadow: bestObjective === val ? "0 4px 12px rgba(166, 25, 46, 0.3)" : "none",
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
                    <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-glow-red)" }}>
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
                          <p className="font-bold" style={{ color: "var(--text-primary)" }}>{fmtN(bestData.best.total_volume)}</p>
                          <p className="text-xs" style={{ color: bestData.best.delta_volume_pct >= 0 ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>{formatPercent(bestData.best.delta_volume_pct)}</p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Ingreso</p>
                          <p className="font-bold" style={{ color: "var(--text-primary)" }}>{fmtM(bestData.best.total_revenue)}</p>
                          <p className="text-xs" style={{ color: bestData.best.delta_revenue_pct >= 0 ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>{formatPercent(bestData.best.delta_revenue_pct)}</p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Margen</p>
                          <p className="font-bold" style={{ color: "var(--text-primary)" }}>{fmtM(bestData.best.total_margin)}</p>
                          <p className="text-xs" style={{ color: bestData.best.delta_margin_pct >= 0 ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>{formatPercent(bestData.best.delta_margin_pct)}</p>
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
                              <p style={{ color: "var(--text-secondary)" }}>{fmtN(s.total_volume)}</p>
                            </div>
                            <div>
                              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Ingreso</p>
                              <p style={{ color: "var(--text-secondary)" }}>{fmtM(s.total_revenue)}</p>
                            </div>
                            <div>
                              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Margen</p>
                              <p style={{ color: "var(--text-secondary)" }}>{fmtM(s.total_margin)}</p>
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

      {/* ================================================================= */}
      {/* TAB: Cargar Excel                                                  */}
      {/* ================================================================= */}
      {mainTab === "excel" && (
        <Card>
          <CardHeader>
            <CardTitle>Cargar Escenario desde Excel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Download template */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.open(getScenarioTemplateUrl(), "_blank")}
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
                  style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)", background: "var(--bg-tertiary)" }}
                >
                  Descargar Plantilla Excel
                </button>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Llena la plantilla con tus cambios de precio planeados
                </p>
              </div>

              {/* Upload */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre del escenario"
                  value={excelName}
                  onChange={(e) => setExcelName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
                />

                <div className="flex gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Optimizar sugerencias para</label>
                    <select
                      value={excelObjective}
                      onChange={(e) => setExcelObjective(e.target.value)}
                      className="rounded-lg border px-3 py-2 text-sm"
                      style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
                    >
                      <option value="margin">Margen</option>
                      <option value="revenue">Ingreso</option>
                      <option value="volume">Volumen</option>
                    </select>
                  </div>
                </div>

                <div
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors hover:opacity-80"
                  style={{ borderColor: "var(--border-primary)", background: "var(--bg-tertiary)" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  />
                  {excelFile ? (
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{excelFile.name}</p>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Click para seleccionar archivo Excel (.xlsx)</p>
                  )}
                </div>

                <button
                  disabled={!excelFile || !excelName || excelLoading}
                  onClick={async () => {
                    if (!excelFile || !excelName) return;
                    setExcelLoading(true);
                    setExcelError("");
                    setExcelResult(null);
                    try {
                      const result = await uploadScenarioExcel(excelFile, excelName, excelObjective);
                      setExcelResult(result);
                      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
                    } catch (err) {
                      setExcelError(err instanceof Error ? err.message : "Error uploading");
                    } finally {
                      setExcelLoading(false);
                    }
                  }}
                  className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ background: "var(--usg-red)", color: "#fff" }}
                >
                  {excelLoading ? "Evaluando..." : "Evaluar Escenario"}
                </button>
              </div>

              {/* Error */}
              {excelError && (
                <div className="rounded-lg p-3 text-sm" style={{ background: "var(--negative-bg, #fef2f2)", color: "var(--negative)" }}>
                  {excelError}
                </div>
              )}

              {/* Results */}
              {excelResult && (
                <div className="space-y-4">
                  <div className="rounded-lg p-3" style={{ background: "var(--bg-tertiary)" }}>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      Escenario &quot;{String((excelResult.scenario as Record<string, unknown>)?.name || "")}&quot; creado
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {String(excelResult.parsed_rows)} filas procesadas
                      {(excelResult.errors as string[])?.length > 0 && ` | ${(excelResult.errors as string[]).length} errores`}
                    </p>
                  </div>

                  {/* Suggestions */}
                  {(excelResult.suggestions as Array<Record<string, unknown>>)?.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        Sugerencias de Mejora ({(excelResult.suggestions as Array<unknown>).length})
                      </h4>
                      <div className="max-h-[300px] overflow-auto">
                        <table className="w-full text-[13px]">
                          <thead className="sticky top-0" style={{ background: "var(--table-header-bg)" }}>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                              <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Producto</th>
                              <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Plan</th>
                              <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Sugerido</th>
                              <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Delta Margen</th>
                              <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Delta Ingreso</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(excelResult.suggestions as Array<Record<string, unknown>>).map((s, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                                <td className="py-2" style={{ color: "var(--text-primary)" }}>{String(s.product_name || `Product #${s.product_id}`)}</td>
                                <td className="py-2" style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{Number(s.planned_pct) > 0 ? "+" : ""}{String(s.planned_pct)}%</td>
                                <td className="py-2 font-bold" style={{ color: "var(--usg-red)", fontVariantNumeric: "tabular-nums" }}>{Number(s.suggested_pct) > 0 ? "+" : ""}{String(s.suggested_pct)}%</td>
                                <td className="py-2" style={{ color: Number(s.delta_margin) >= 0 ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(Number(s.delta_margin))}</td>
                                <td className="py-2" style={{ color: Number(s.delta_revenue) >= 0 ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(Number(s.delta_revenue))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {(excelResult.suggestions as Array<unknown>)?.length === 0 && (
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                      Tu plan de precios ya esta optimizado - no hay sugerencias de mejora.
                    </p>
                  )}

                  {/* Errors from parsing */}
                  {(excelResult.errors as string[])?.length > 0 && (
                    <div className="rounded-lg p-3" style={{ background: "var(--bg-tertiary)" }}>
                      <h4 className="text-xs font-semibold mb-1" style={{ color: "var(--text-tertiary)" }}>Advertencias del parsing:</h4>
                      {(excelResult.errors as string[]).map((e, i) => (
                        <p key={i} className="text-xs" style={{ color: "var(--text-tertiary)" }}>{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* TAB: Optimizar                                                     */}
      {/* ================================================================= */}
      {mainTab === "optimize" && (
        <Card>
          <CardHeader>
            <CardTitle>Optimización Automática de Precios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                El sistema encuentra el precio óptimo para cada producto según el objetivo seleccionado, usando las elasticidades calculadas.
              </p>

              {/* Config */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Nombre del escenario</label>
                  <input
                    type="text"
                    placeholder="Optimización..."
                    value={optName}
                    onChange={(e) => setOptName(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Objetivo</label>
                  <div className="flex gap-1">
                    {(["margin", "revenue", "volume"] as const).map((obj) => (
                      <button
                        key={obj}
                        onClick={() => setOptObjective(obj)}
                        className="flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                        style={{
                          background: optObjective === obj ? "var(--usg-red)" : "var(--bg-tertiary)",
                          color: optObjective === obj ? "#fff" : "var(--text-secondary)",
                        }}
                      >
                        {obj === "margin" ? "Margen" : obj === "revenue" ? "Ingreso" : "Volumen"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Precio mín %</label>
                  <input
                    type="number"
                    value={optMinPct}
                    onChange={(e) => setOptMinPct(Number(e.target.value))}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Precio máx %</label>
                  <input
                    type="number"
                    value={optMaxPct}
                    onChange={(e) => setOptMaxPct(Number(e.target.value))}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Los filtros globales (segmento, territorio, categoría, distribuidor) se aplican al alcance de la optimización.
              </p>

              <button
                disabled={!optName || optLoading}
                onClick={async () => {
                  setOptLoading(true);
                  setOptError("");
                  setOptResult(null);
                  try {
                    const result = await createOptimizedScenario({
                      name: optName,
                      objective: optObjective,
                      price_min_pct: optMinPct,
                      price_max_pct: optMaxPct,
                      segment: params.segment,
                      territory_id: params.territory_id,
                      customer_id: params.customer_id,
                      category_id: params.category_id,
                    });
                    setOptResult(result as unknown as Record<string, unknown>);
                    queryClient.invalidateQueries({ queryKey: ["scenarios"] });
                  } catch (err) {
                    setOptError(err instanceof Error ? err.message : "Error optimizing");
                  } finally {
                    setOptLoading(false);
                  }
                }}
                className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: "var(--usg-red)", color: "#fff" }}
              >
                {optLoading ? "Optimizando..." : "Optimizar Precios"}
              </button>

              {/* Error */}
              {optError && (
                <div className="rounded-lg p-3 text-sm" style={{ background: "var(--negative-bg, #fef2f2)", color: "var(--negative)" }}>
                  {optError}
                </div>
              )}

              {/* Results */}
              {optResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg p-3" style={{ background: "var(--bg-tertiary)" }}>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Productos Optimizados</p>
                      <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{String(optResult.products_optimized)}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "var(--bg-tertiary)" }}>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Objetivo</p>
                      <p className="text-lg font-bold" style={{ color: "var(--usg-red)" }}>
                        {optResult.objective === "margin" ? "Margen" : optResult.objective === "revenue" ? "Ingreso" : "Volumen"}
                      </p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "var(--bg-tertiary)" }}>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Rango de Precio</p>
                      <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                        {(optResult.price_range as number[])?.[0]}% a {(optResult.price_range as number[])?.[1]}%
                      </p>
                    </div>
                  </div>

                  <div className="max-h-[400px] overflow-auto">
                    <table className="w-full text-[13px]">
                      <thead className="sticky top-0" style={{ background: "var(--table-header-bg)" }}>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                          <th className="pb-2 text-left text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Producto</th>
                          <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Cambio Óptimo</th>
                          <th className="pb-2 text-right text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>Valor Óptimo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(optResult.optimization_details as Array<Record<string, unknown>>)?.map((d, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                            <td className="py-2" style={{ color: "var(--text-primary)" }}>Product #{String(d.product_id)}</td>
                            <td className="py-2 text-right font-bold" style={{ color: Number(d.optimal_change_pct) >= 0 ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>
                              {Number(d.optimal_change_pct) > 0 ? "+" : ""}{String(d.optimal_change_pct)}%
                            </td>
                            <td className="py-2 text-right" style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                              {formatCurrency(Number(d.optimal_value))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Escenario guardado. Puedes verlo en la pestaña &quot;Simular&quot; → Escenarios Guardados, o compararlo en &quot;Comparar&quot;.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart wrapper components (ECharts)
// ---------------------------------------------------------------------------

function CurveChart({ curve, priceChange }: { curve: Array<Record<string, number>>; priceChange: number }) {
  const option: EOption = useMemo(() => ({
    grid: { containLabel: true, left: 12, right: 24, top: 48, bottom: 12 },
    legend: { top: 0, data: ["Ingreso", "Margen", "Volumen"] },
    tooltip: {
      trigger: "axis",
      formatter(params: Array<{ seriesName: string; value: number; color: string; marker: string }>) {
        if (!Array.isArray(params) || params.length === 0) return "";
        const idx = (params[0] as unknown as { dataIndex: number }).dataIndex;
        const d = curve[idx];
        if (!d) return "";
        let html = `<div style="font-weight:700;margin-bottom:4px">Cambio: ${d.price_change_pct}%</div>`;
        for (const p of params) {
          html += `<div>${p.marker} ${p.seriesName}: ${fmtCurrency(p.value)}</div>`;
        }
        return html;
      },
    },
    xAxis: {
      type: "category",
      data: curve.map((d) => `${d.price_change_pct}%`),
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        name: "Ingreso",
        axisLabel: { formatter: (v: number) => fmtM(v), color: EDITORIAL_COLORS.textLight, fontSize: 10 },
        splitLine: { lineStyle: { color: EDITORIAL_COLORS.border, type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
        nameTextStyle: { color: EDITORIAL_COLORS.navy, fontSize: 11 },
      },
      {
        type: "value",
        name: "Margen",
        axisLabel: { formatter: (v: number) => fmtM(v), color: EDITORIAL_COLORS.textLight, fontSize: 10 },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        nameTextStyle: { color: EDITORIAL_COLORS.blue, fontSize: 11 },
      },
      {
        type: "value",
        name: "Volumen",
        show: false,
      },
    ],
    series: [
      {
        name: "Ingreso",
        type: "line",
        yAxisIndex: 0,
        smooth: 0.3,
        symbol: "none",
        lineStyle: { width: 3, color: EDITORIAL_COLORS.navy },
        itemStyle: { color: EDITORIAL_COLORS.navy },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(43,76,126,0.15)" },
              { offset: 1, color: "rgba(43,76,126,0.01)" },
            ],
          },
        },
        data: curve.map((d) => d.revenue),
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { type: "dashed" },
          data: [
            {
              xAxis: `0%`,
              lineStyle: { color: EDITORIAL_COLORS.textMuted },
              label: { formatter: "Base", fontSize: 10, color: EDITORIAL_COLORS.textMuted },
            },
            {
              xAxis: `${priceChange}%`,
              lineStyle: { color: EDITORIAL_COLORS.coral, width: 2 },
              label: { formatter: `${priceChange}%`, fontSize: 11, fontWeight: 700, color: EDITORIAL_COLORS.coral },
            },
          ],
        },
      },
      {
        name: "Margen",
        type: "line",
        yAxisIndex: 1,
        smooth: 0.3,
        symbol: "none",
        lineStyle: { width: 3, color: EDITORIAL_COLORS.blue },
        itemStyle: { color: EDITORIAL_COLORS.blue },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(91,141,184,0.15)" },
              { offset: 1, color: "rgba(91,141,184,0.01)" },
            ],
          },
        },
        data: curve.map((d) => d.margin),
      },
      {
        name: "Volumen",
        type: "line",
        yAxisIndex: 2,
        smooth: 0.3,
        symbol: "none",
        lineStyle: { width: 2.5, color: EDITORIAL_COLORS.coral, type: "dashed" },
        itemStyle: { color: EDITORIAL_COLORS.coral },
        data: curve.map((d) => d.volume),
        endLabel: {
          show: true,
          formatter: (p: any) => fmtN(p.value),
          fontSize: 11,
          fontWeight: 600,
          color: EDITORIAL_COLORS.coral,
        },
      },
    ],
  }), [curve, priceChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Curva Precio-Volumen-Margen</CardTitle>
      </CardHeader>
      <CardContent>
        <BaseChart option={option} height={400} />
      </CardContent>
    </Card>
  );
}

function PortfolioChart({ byCategory }: { byCategory: Array<{ name: string; total_revenue: number; total_margin: number }> }) {
  const option: EOption = useMemo(() => ({
    grid: { containLabel: true, left: 12, right: 12, top: 36, bottom: 12 },
    legend: {
      top: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
    },
    tooltip: {
      trigger: "axis",
      formatter(params: any) {
        if (!Array.isArray(params) || params.length === 0) return "";
        const cat = params[0]?.name || "";
        let html = `<div style="font-weight:700;margin-bottom:4px">${cat}</div>`;
        for (const p of params) {
          html += `<div>${p.marker} ${p.seriesName}: ${fmtM(p.value)}</div>`;
        }
        return html;
      },
    },
    xAxis: {
      type: "category",
      data: byCategory.map((d) => d.name),
      axisLabel: { rotate: 30, fontSize: 10, color: EDITORIAL_COLORS.textLight },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: (v: number) => fmtM(v), color: EDITORIAL_COLORS.textLight, fontSize: 10 },
      splitLine: { lineStyle: { color: EDITORIAL_COLORS.border, type: "dashed" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: "Ingreso",
        type: "bar",
        barMaxWidth: 24,
        itemStyle: { color: EDITORIAL_COLORS.navy, borderRadius: [3, 3, 0, 0] },
        data: byCategory.map((d) => d.total_revenue),
      },
      {
        name: "Margen",
        type: "bar",
        barMaxWidth: 24,
        itemStyle: { color: EDITORIAL_COLORS.blue, borderRadius: [3, 3, 0, 0] },
        data: byCategory.map((d) => d.total_margin),
      },
    ],
  }), [byCategory]);

  return <BaseChart option={option} height={280} />;
}

function CompareChart({ scenarios }: { scenarios: ScenarioCompareItem[] }) {
  const option: EOption = useMemo(() => {
    const names = scenarios.map((s) =>
      s.scenario_name.length > 15 ? s.scenario_name.slice(0, 15) + "..." : s.scenario_name,
    );
    return {
      grid: { containLabel: true, left: 12, right: 12, top: 36, bottom: 12 },
      legend: {
        top: 0,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
      },
      tooltip: {
        trigger: "axis",
        formatter(params: any) {
          if (!Array.isArray(params) || params.length === 0) return "";
          const name = params[0]?.name || "";
          let html = `<div style="font-weight:700;margin-bottom:4px">${name}</div>`;
          for (const p of params) {
            html += `<div>${p.marker} ${p.seriesName}: ${fmtM(p.value)}</div>`;
          }
          return html;
        },
      },
      xAxis: {
        type: "category",
        data: names,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: EDITORIAL_COLORS.textMuted, fontSize: 11 },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: (v: number) => fmtM(v), color: EDITORIAL_COLORS.textLight, fontSize: 10 },
        splitLine: { lineStyle: { color: EDITORIAL_COLORS.border, type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: "Ingreso",
          type: "bar",
          barMaxWidth: 32,
          itemStyle: { color: EDITORIAL_COLORS.navy, borderRadius: [3, 3, 0, 0] },
          data: scenarios.map((s) => s.total_revenue),
        },
        {
          name: "Margen",
          type: "bar",
          barMaxWidth: 32,
          itemStyle: { color: EDITORIAL_COLORS.blue, borderRadius: [3, 3, 0, 0] },
          data: scenarios.map((s) => s.total_margin),
        },
      ],
    };
  }, [scenarios]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparación visual</CardTitle>
      </CardHeader>
      <CardContent>
        <BaseChart option={option} height={300} />
      </CardContent>
    </Card>
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
      <p className="text-xs" style={{ color: positive ? "#2B4C7E" : "#D85A4A", fontVariantNumeric: "tabular-nums" }}>{delta} vs base</p>
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
