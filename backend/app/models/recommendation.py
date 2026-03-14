from datetime import datetime

from sqlalchemy import Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    segment: Mapped[str] = mapped_column(String(20), index=True)
    territory_id: Mapped[int | None] = mapped_column(ForeignKey("territories.id"), nullable=True)
    action_type: Mapped[str] = mapped_column(String(20))  # increase, protect, decrease
    suggested_change_pct: Mapped[float] = mapped_column(Float)
    expected_impact_revenue: Mapped[float] = mapped_column(Float)
    expected_impact_volume: Mapped[float] = mapped_column(Float)
    expected_impact_margin: Mapped[float] = mapped_column(Float)
    confidence_level: Mapped[str] = mapped_column(String(10))
    rationale: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
