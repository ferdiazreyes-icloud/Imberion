from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(50), default="distribuidor")
    segment: Mapped[str] = mapped_column(String(20))  # oro, plata, bronce
    territory_id: Mapped[int] = mapped_column(ForeignKey("territories.id"))

    territory = relationship("Territory", back_populates="customers")
    branches = relationship("Branch", back_populates="customer")
    transactions = relationship("Transaction", back_populates="customer")
