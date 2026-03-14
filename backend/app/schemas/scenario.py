from pydantic import BaseModel


class ScenarioCreate(BaseModel):
    name: str
    description: str | None = None
    assumptions: dict | None = None
    price_changes: list["PriceChange"]


class PriceChange(BaseModel):
    product_id: int | None = None
    category_id: int | None = None
    segment: str | None = None
    territory_id: int | None = None
    change_pct: float


class ScenarioOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_base: bool
    created_at: str | None = None
    assumptions: dict | None = None

    model_config = {"from_attributes": True}


class ScenarioResultOut(BaseModel):
    id: int
    scenario_id: int
    product_id: int
    product_name: str | None = None
    segment: str | None = None
    territory_name: str | None = None
    price_change_pct: float
    expected_volume: float
    expected_revenue: float
    expected_margin: float
    confidence_level: str

    model_config = {"from_attributes": True}


class ScenarioCompareResponse(BaseModel):
    base: list[ScenarioResultOut]
    scenario: list[ScenarioResultOut]
    delta_revenue: float
    delta_volume: float
    delta_margin: float
