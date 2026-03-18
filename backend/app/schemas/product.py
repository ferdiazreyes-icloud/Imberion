from typing import Optional

from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    id: int
    sku_code: str
    name: str
    category_id: int
    subcategory: Optional[str] = None
    category: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}
