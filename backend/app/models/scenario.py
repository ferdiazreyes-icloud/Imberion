from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, Float, String, Boolean, DateTime, ForeignKey, JSON, func as sa_func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_base: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=sa_func.now())
    assumptions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    results = relationship("ScenarioResult", back_populates="scenario", cascade="all, delete-orphan")


class ScenarioResult(Base):
    __tablename__ = "scenario_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    segment: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    territory_id: Mapped[Optional[int]] = mapped_column(ForeignKey("territories.id"), nullable=True)
    price_change_pct: Mapped[float] = mapped_column(Float)
    expected_volume: Mapped[float] = mapped_column(Float)
    expected_revenue: Mapped[float] = mapped_column(Float)
    expected_margin: Mapped[float] = mapped_column(Float)
    confidence_level: Mapped[str] = mapped_column(String(10))

    scenario = relationship("Scenario", back_populates="results")
