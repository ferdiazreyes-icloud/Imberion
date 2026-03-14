from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: int
    name: str
    parent_id: int | None = None

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    id: int
    sku_code: str
    name: str
    category_id: int
    subcategory: str | None = None
    category: CategoryOut | None = None

    model_config = {"from_attributes": True}
