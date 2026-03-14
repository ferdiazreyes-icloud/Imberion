const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

// Overview
export const getOverview = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any>(`/api/overview${qs}`);
};
export const getOverviewByCategory = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any[]>(`/api/overview/by-category${qs}`);
};
export const getOverviewBySegment = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any[]>(`/api/overview/by-segment${qs}`);
};
export const getOverviewByTerritory = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any[]>(`/api/overview/by-territory${qs}`);
};

// History
export const getElasticities = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any[]>(`/api/history/elasticities${qs}`);
};
export const getTrends = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any>(`/api/history/trends${qs}`);
};
export const getPriceVolume = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any[]>(`/api/history/price-volume${qs}`);
};

// Simulator
export const getScenarios = () => fetchAPI<any[]>("/api/simulator/scenarios");
export const createScenario = (data: any) =>
  fetchAPI<any>("/api/simulator/scenarios", { method: "POST", body: JSON.stringify(data) });
export const getScenarioResults = (id: number) =>
  fetchAPI<any[]>(`/api/simulator/scenarios/${id}/results`);
export const quickSimulate = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any>(`/api/simulator/quick-simulate${qs}`);
};

// Recommendations
export const getRecommendations = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any[]>(`/api/recommendations${qs}`);
};
export const getRecommendationsSummary = () =>
  fetchAPI<any[]>("/api/recommendations/summary");

// Passthrough
export const getPassthroughBySegment = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any[]>(`/api/passthrough/by-segment${qs}`);
};
export const getPassthroughByCategory = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any[]>(`/api/passthrough/by-category${qs}`);
};
export const getPassthroughTrends = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetchAPI<any[]>(`/api/passthrough/trends${qs}`);
};

// Filters
export const getFilterSegments = () => fetchAPI<string[]>("/api/filters/segments");
export const getFilterCategories = () => fetchAPI<any[]>("/api/filters/categories");
export const getFilterTerritories = () => fetchAPI<any[]>("/api/filters/territories");
export const getFilterRegions = () => fetchAPI<string[]>("/api/filters/regions");
export const getFilterCustomers = (segment?: string) => {
  const qs = segment ? `?segment=${segment}` : "";
  return fetchAPI<any[]>(`/api/filters/customers${qs}`);
};

// Export
export const getExecutiveSummary = () => fetchAPI<any>("/api/export/executive-summary");
