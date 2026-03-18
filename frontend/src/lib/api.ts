import type { ElasticityData, OverviewData, RecommendationData } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

function toQueryString(params?: Record<string, string>): string {
  if (!params) return "";
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  return Object.keys(filtered).length ? "?" + new URLSearchParams(filtered).toString() : "";
}

// Overview
export const getOverview = (params?: Record<string, string>) =>
  fetchAPI<OverviewData>(`/api/overview${toQueryString(params)}`);
export const getOverviewByCategory = (params?: Record<string, string>) =>
  fetchAPI<Array<{ category_name: string; revenue: number; volume: number }>>(`/api/overview/by-category${toQueryString(params)}`);
export const getOverviewBySegment = (params?: Record<string, string>) =>
  fetchAPI<Array<{ segment: string; revenue: number; volume: number }>>(`/api/overview/by-segment${toQueryString(params)}`);
export const getOverviewByTerritory = (params?: Record<string, string>) =>
  fetchAPI<Array<{ state: string; revenue: number; volume: number }>>(`/api/overview/by-territory${toQueryString(params)}`);

// History
export const getElasticities = (params?: Record<string, string>) =>
  fetchAPI<ElasticityData[]>(`/api/history/elasticities${toQueryString(params)}`);
export const getTrends = (params?: Record<string, string>) =>
  fetchAPI<{ node_label: string; data: Array<Record<string, unknown>> }>(`/api/history/trends${toQueryString(params)}`);
export const getPriceVolume = (params?: Record<string, string>) =>
  fetchAPI<Array<{ avg_price: number; total_volume: number }>>(`/api/history/price-volume${toQueryString(params)}`);

// Simulator
export const getScenarios = () =>
  fetchAPI<Array<{ id: number; name: string; description: string; created_at: string }>>("/api/simulator/scenarios");
export const createScenario = (data: { name: string; description: string; price_changes: Array<Record<string, unknown>> }) =>
  fetchAPI<{ id: number; name: string }>("/api/simulator/scenarios", { method: "POST", body: JSON.stringify(data) });
export const getScenarioResults = (id: number) =>
  fetchAPI<Array<{ id: number; product_name: string; price_change_pct: number; expected_volume: number; expected_revenue: number; confidence_level: string }>>(`/api/simulator/scenarios/${id}/results`);
export const quickSimulate = (params?: Record<string, string>) =>
  fetchAPI<{ elasticity_used: number; confidence: string; curve: Array<{ price_change_pct: number; price: number; volume: number; revenue: number; margin: number }> }>(`/api/simulator/quick-simulate${toQueryString(params)}`);

// Recommendations
export const getRecommendations = (params?: Record<string, string>) =>
  fetchAPI<RecommendationData[]>(`/api/recommendations${toQueryString(params)}`);
export const getRecommendationsSummary = () =>
  fetchAPI<Array<{ segment: string; action_type: string; confidence_level: string; count: number; avg_change_pct: number; total_revenue_impact: number; total_margin_impact: number }>>("/api/recommendations/summary");

// Passthrough
export const getPassthroughBySegment = (params?: Record<string, string>) =>
  fetchAPI<Array<{ segment: string; avg_net_price: number; avg_discount: number; avg_rebate: number; rebate_pct: number; discount_pct: number }>>(`/api/passthrough/by-segment${toQueryString(params)}`);
export const getPassthroughByCategory = (params?: Record<string, string>) =>
  fetchAPI<Array<{ category_name: string; rebate_pct: number }>>(`/api/passthrough/by-category${toQueryString(params)}`);
export const getPassthroughTrends = (params?: Record<string, string>) =>
  fetchAPI<Array<{ period: string; avg_list_price: number; avg_net_price: number; avg_rebate: number; avg_discount: number }>>(`/api/passthrough/trends${toQueryString(params)}`);

// Filters
export const getFilterSegments = () => fetchAPI<string[]>("/api/filters/segments");
export const getFilterCategories = () =>
  fetchAPI<Array<{ id: number; name: string }>>("/api/filters/categories");
export const getFilterTerritories = () =>
  fetchAPI<Array<{ id: number; region: string; state: string; municipality: string }>>("/api/filters/territories");
export const getFilterRegions = () => fetchAPI<string[]>("/api/filters/regions");
export const getFilterCustomers = (segment?: string) => {
  const qs = segment ? `?segment=${segment}` : "";
  return fetchAPI<Array<{ id: number; name: string; segment: string }>>(`/api/filters/customers${qs}`);
};

// Export
export const getExportCSVUrl = (params?: Record<string, string>) =>
  `${API_URL}/api/export/recommendations-csv${toQueryString(params)}`;
export const getExecutiveSummary = () => fetchAPI<Record<string, unknown>>("/api/export/executive-summary");
