from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class PriceChange(BaseModel):
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    segment: Optional[str] = None
    territory_id: Optional[int] = None
    change_pct: float


class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = None
    assumptions: Optional[dict] = None
    price_changes: List[PriceChange]


class ScenarioOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_base: bool
    created_at: Optional[Any] = None
    assumptions: Optional[dict] = None

    model_config = {"from_attributes": True}


class ScenarioResultOut(BaseModel):
    id: int
    scenario_id: int
    product_id: int
    product_name: Optional[str] = None
    segment: Optional[str] = None
    territory_name: Optional[str] = None
    price_change_pct: float
    expected_volume: float
    expected_revenue: float
    expected_margin: float
    confidence_level: str

    model_config = {"from_attributes": True}


class ScenarioCompareResponse(BaseModel):
    base: List[ScenarioResultOut]
    scenario: List[ScenarioResultOut]
    delta_revenue: float
    delta_volume: float
    delta_margin: float


# ---------------------------------------------------------------------------
# New schemas for enhanced simulator
# ---------------------------------------------------------------------------

class BreakdownItem(BaseModel):
    name: str
    id: Optional[int] = None
    total_volume: float
    total_revenue: float
    total_margin: float
    product_count: int
    avg_confidence: Optional[str] = None


class ScenarioSummaryResponse(BaseModel):
    scenario_name: str
    total_volume: float
    total_revenue: float
    total_margin: float
    base_volume: float
    base_revenue: float
    base_margin: float
    delta_volume: float
    delta_volume_pct: float
    delta_revenue: float
    delta_revenue_pct: float
    delta_margin: float
    delta_margin_pct: float
    by_category: List[BreakdownItem]
    by_segment: List[BreakdownItem]


class GroupedResultOut(BaseModel):
    group_key: str
    group_name: str
    total_volume: float
    total_revenue: float
    total_margin: float
    product_count: int
    avg_price_change_pct: float
    avg_confidence: str
    items: Optional[List[ScenarioResultOut]] = None


class ScenarioCompareItem(BaseModel):
    scenario_id: int
    scenario_name: str
    total_volume: float
    total_revenue: float
    total_margin: float
    delta_volume: float
    delta_revenue: float
    delta_margin: float
    delta_volume_pct: float
    delta_revenue_pct: float
    delta_margin_pct: float


class ScenarioRankings(BaseModel):
    best_for_volume: int
    best_for_revenue: int
    best_for_margin: int


class MultiCompareResponse(BaseModel):
    scenarios: List[ScenarioCompareItem]
    rankings: ScenarioRankings


class BestScenarioResponse(BaseModel):
    objective: str
    best: ScenarioCompareItem
    runners_up: List[ScenarioCompareItem]


# ---------------------------------------------------------------------------
# Excel upload & optimization schemas
# ---------------------------------------------------------------------------

class OptimizeRequest(BaseModel):
    name: str
    objective: str  # "margin", "revenue", "volume"
    price_min_pct: float = -10.0
    price_max_pct: float = 15.0
    segment: Optional[str] = None
    territory_id: Optional[str] = None
    customer_id: Optional[str] = None
    category_id: Optional[str] = None


class SuggestionItem(BaseModel):
    product_id: int
    product_name: Optional[str] = None
    planned_pct: float
    suggested_pct: float
    planned_margin: float
    suggested_margin: float
    delta_margin: float
    planned_revenue: float
    suggested_revenue: float
    delta_revenue: float
    reason: str


class ExcelScenarioResponse(BaseModel):
    scenario: ScenarioOut
    parsed_rows: int
    suggestions: List[SuggestionItem]
