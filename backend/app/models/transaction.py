from datetime import date as date_type

from sqlalchemy import Integer, Float, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date_type] = mapped_column(Date, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    branch_id: Mapped[int | None] = mapped_column(ForeignKey("branches.id"), nullable=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    territory_id: Mapped[int] = mapped_column(ForeignKey("territories.id"), index=True)
    volume: Mapped[float] = mapped_column(Float)
    list_price: Mapped[float] = mapped_column(Float)
    discount: Mapped[float] = mapped_column(Float, default=0)
    rebate: Mapped[float] = mapped_column(Float, default=0)
    net_price: Mapped[float] = mapped_column(Float)
    revenue: Mapped[float] = mapped_column(Float)

    customer = relationship("Customer", back_populates="transactions")
    product = relationship("Product", back_populates="transactions")
    territory = relationship("Territory", back_populates="transactions")
