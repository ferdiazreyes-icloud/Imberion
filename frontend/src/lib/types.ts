export interface Filters {
  segment?: string;
  territory_id?: string;
  region?: string;
  category_id?: string;
  product_id?: string;
  period_start?: string;
  period_end?: string;
  confidence_level?: string;
}

export interface KPI {
  label: string;
  value: number;
  change_pct?: number;
  unit?: string;
}

export interface OverviewData {
  total_volume: KPI;
  total_revenue: KPI;
  avg_net_price: KPI;
  avg_elasticity: KPI;
  modeled_coverage_pct: KPI;
  avg_rebate: KPI;
  total_customers: number;
  total_skus: number;
  total_territories: number;
}

export interface TrendPoint {
  period: string;
  volume: number;
  revenue: number;
  net_price: number;
  list_price: number;
  rebate: number;
}

export interface ElasticityData {
  id: number;
  type: string;
  coefficient: number;
  confidence_level: string;
  p_value: number;
  r_squared: number;
  node_type: string;
  node_id: number;
  sample_size: number;
}

export interface RecommendationData {
  id: number;
  product_id: number;
  product_name: string;
  category_name: string;
  segment: string;
  territory_name: string;
  action_type: string;
  suggested_change_pct: number;
  expected_impact_revenue: number;
  expected_impact_volume: number;
  expected_impact_margin: number;
  confidence_level: string;
  rationale: Record<string, any>;
}

// Simulator enhanced types
export interface ScenarioSummary {
  scenario_name: string;
  total_volume: number;
  total_revenue: number;
  total_margin: number;
  base_volume: number;
  base_revenue: number;
  base_margin: number;
  delta_volume: number;
  delta_volume_pct: number;
  delta_revenue: number;
  delta_revenue_pct: number;
  delta_margin: number;
  delta_margin_pct: number;
  by_category: BreakdownItem[];
  by_segment: BreakdownItem[];
}

export interface BreakdownItem {
  name: string;
  id?: number;
  total_volume: number;
  total_revenue: number;
  total_margin: number;
  product_count: number;
  avg_confidence?: string;
}

export interface GroupedResult {
  group_key: string;
  group_name: string;
  total_volume: number;
  total_revenue: number;
  total_margin: number;
  product_count: number;
  avg_price_change_pct: number;
  avg_confidence: string;
}

export interface ScenarioCompareItem {
  scenario_id: number;
  scenario_name: string;
  total_volume: number;
  total_revenue: number;
  total_margin: number;
  delta_volume: number;
  delta_revenue: number;
  delta_margin: number;
  delta_volume_pct: number;
  delta_revenue_pct: number;
  delta_margin_pct: number;
}

export interface MultiCompareResponse {
  scenarios: ScenarioCompareItem[];
  rankings: {
    best_for_volume: number;
    best_for_revenue: number;
    best_for_margin: number;
  };
}

export interface BestScenarioResponse {
  objective: string;
  best: ScenarioCompareItem;
  runners_up: ScenarioCompareItem[];
}
