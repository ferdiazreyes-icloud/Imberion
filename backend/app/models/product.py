from typing import Optional

from sqlalchemy import Integer, String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sku_code: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    subcategory: Mapped[str] = mapped_column(String(100), nullable=True)
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    category = relationship("Category", back_populates="products")
    transactions = relationship("Transaction", back_populates="product")
