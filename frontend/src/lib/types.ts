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
