from typing import Optional

from pydantic import BaseModel


class TerritoryOut(BaseModel):
    id: int
    region: str
    state: str
    municipality: str

    model_config = {"from_attributes": True}


class CustomerOut(BaseModel):
    id: int
    name: str
    type: str
    segment: str
    territory_id: int
    territory: Optional[TerritoryOut] = None

    model_config = {"from_attributes": True}


class BranchOut(BaseModel):
    id: int
    customer_id: int
    name: str
    municipality: str
    state: str

    model_config = {"from_attributes": True}
