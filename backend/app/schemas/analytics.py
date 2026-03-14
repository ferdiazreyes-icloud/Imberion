from pydantic import BaseModel


class KPI(BaseModel):
    label: str
    value: float
    change_pct: float | None = None
    unit: str = ""


class OverviewResponse(BaseModel):
    total_volume: KPI
    total_revenue: KPI
    avg_net_price: KPI
    avg_elasticity: KPI
    modeled_coverage_pct: KPI
    avg_rebate: KPI
    total_customers: int
    total_skus: int
    total_territories: int


class ElasticityOut(BaseModel):
    id: int
    type: str
    coefficient: float
    confidence_level: str
    p_value: float
    r_squared: float
    node_type: str
    node_id: int
    period_start: str
    period_end: str
    sample_size: int

    model_config = {"from_attributes": True}


class TrendPoint(BaseModel):
    period: str
    volume: float
    revenue: float
    net_price: float
    list_price: float
    rebate: float


class TrendResponse(BaseModel):
    node_type: str
    node_id: int
    node_label: str
    data: list[TrendPoint]


class PassthroughEntry(BaseModel):
    segment: str
    territory: str | None = None
    product: str | None = None
    avg_list_price: float
    avg_discount: float
    avg_rebate: float
    avg_net_price: float
    rebate_pct: float
    volume: float
    revenue: float


class RecommendationOut(BaseModel):
    id: int
    product_id: int
    product_name: str | None = None
    category_name: str | None = None
    segment: str
    territory_name: str | None = None
    action_type: str
    suggested_change_pct: float
    expected_impact_revenue: float
    expected_impact_volume: float
    expected_impact_margin: float
    confidence_level: str
    rationale: dict | None = None

    model_config = {"from_attributes": True}
