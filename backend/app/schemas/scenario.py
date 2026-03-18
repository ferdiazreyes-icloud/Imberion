from typing import List, Optional

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
    created_at: Optional[str] = None
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
