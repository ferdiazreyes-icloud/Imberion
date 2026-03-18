from typing import Optional

from pydantic import BaseModel


class FilterParams(BaseModel):
    segment: Optional[str] = None
    territory_id: Optional[int] = None
    region: Optional[str] = None
    state: Optional[str] = None
    category_id: Optional[int] = None
    product_id: Optional[int] = None
    customer_id: Optional[int] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    confidence_level: Optional[str] = None
