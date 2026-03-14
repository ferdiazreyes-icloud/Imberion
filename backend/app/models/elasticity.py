from datetime import date as date_type

from sqlalchemy import Integer, Float, String, Date
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Elasticity(Base):
    __tablename__ = "elasticities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[str] = mapped_column(String(20))  # historical, predicted
    coefficient: Mapped[float] = mapped_column(Float)
    confidence_level: Mapped[str] = mapped_column(String(10))  # high, medium, low
    p_value: Mapped[float] = mapped_column(Float)
    r_squared: Mapped[float] = mapped_column(Float)
    node_type: Mapped[str] = mapped_column(String(20), index=True)  # segment, territory, category, sku
    node_id: Mapped[int] = mapped_column(Integer, index=True)
    period_start: Mapped[date_type] = mapped_column(Date)
    period_end: Mapped[date_type] = mapped_column(Date)
    sample_size: Mapped[int] = mapped_column(Integer)
