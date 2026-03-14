from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Territory(Base):
    __tablename__ = "territories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    region: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    municipality: Mapped[str] = mapped_column(String(100))

    customers = relationship("Customer", back_populates="territory")
    transactions = relationship("Transaction", back_populates="territory")
