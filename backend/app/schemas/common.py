from pydantic import BaseModel


class FilterParams(BaseModel):
    segment: str | None = None
    territory_id: int | None = None
    region: str | None = None
    state: str | None = None
    category_id: int | None = None
    product_id: int | None = None
    customer_id: int | None = None
    period_start: str | None = None
    period_end: str | None = None
    confidence_level: str | None = None
