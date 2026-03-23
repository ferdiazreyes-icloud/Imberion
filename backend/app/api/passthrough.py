from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Transaction, Customer, Product, Territory, Category

router = APIRouter()


@router.get("/passthrough/by-segment")
def passthrough_by_segment(
    category_id: Optional[int] = None,
    territory_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(
        Customer.segment,
        func.avg(Transaction.list_price).label("avg_list_price"),
        func.avg(Transaction.discount).label("avg_discount"),
        func.avg(Transaction.rebate).label("avg_rebate"),
        func.avg(Transaction.net_price).label("avg_net_price"),
        func.sum(Transaction.volume).label("volume"),
        func.sum(Transaction.revenue).label("revenue"),
    ).join(Customer, Customer.id == Transaction.customer_id)

    if customer_id:
        q = q.filter(Transaction.customer_id == customer_id)
    if category_id:
        q = q.join(Product, Product.id == Transaction.product_id).filter(Product.category_id == category_id)
    if territory_id:
        q = q.filter(Transaction.territory_id == territory_id)

    rows = q.group_by(Customer.segment).all()

    return [
        {
            "segment": r.segment,
            "avg_list_price": round(float(r.avg_list_price or 0), 2),
            "avg_discount": round(float(r.avg_discount or 0), 2),
            "avg_rebate": round(float(r.avg_rebate or 0), 2),
            "avg_net_price": round(float(r.avg_net_price or 0), 2),
            "rebate_pct": round(float(r.avg_rebate or 0) / float(r.avg_list_price or 1) * 100, 2),
            "discount_pct": round(float(r.avg_discount or 0) / float(r.avg_list_price or 1) * 100, 2),
            "volume": float(r.volume or 0),
            "revenue": float(r.revenue or 0),
        }
        for r in rows
    ]


@router.get("/passthrough/by-category")
def passthrough_by_category(
    segment: Optional[str] = None,
    territory_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(
        Category.id,
        Category.name,
        func.avg(Transaction.list_price).label("avg_list_price"),
        func.avg(Transaction.discount).label("avg_discount"),
        func.avg(Transaction.rebate).label("avg_rebate"),
        func.avg(Transaction.net_price).label("avg_net_price"),
        func.sum(Transaction.volume).label("volume"),
    ).join(Product, Product.id == Transaction.product_id).join(Category, Category.id == Product.category_id)

    if customer_id:
        q = q.filter(Transaction.customer_id == customer_id)
    if segment:
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(Customer.segment == segment)
    if territory_id:
        q = q.filter(Transaction.territory_id == territory_id)

    rows = q.group_by(Category.id, Category.name).all()

    return [
        {
            "category_id": r.id,
            "category_name": r.name,
            "avg_list_price": round(float(r.avg_list_price or 0), 2),
            "avg_discount": round(float(r.avg_discount or 0), 2),
            "avg_rebate": round(float(r.avg_rebate or 0), 2),
            "avg_net_price": round(float(r.avg_net_price or 0), 2),
            "rebate_pct": round(float(r.avg_rebate or 0) / float(r.avg_list_price or 1) * 100, 2),
            "volume": float(r.volume or 0),
        }
        for r in rows
    ]


@router.get("/passthrough/trends")
def passthrough_trends(
    segment: Optional[str] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    from sqlalchemy import extract

    q = db.query(
        extract("year", Transaction.date).label("year"),
        extract("month", Transaction.date).label("month"),
        func.avg(Transaction.list_price).label("avg_list_price"),
        func.avg(Transaction.discount).label("avg_discount"),
        func.avg(Transaction.rebate).label("avg_rebate"),
        func.avg(Transaction.net_price).label("avg_net_price"),
    )

    if customer_id:
        q = q.filter(Transaction.customer_id == customer_id)
    if segment:
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(Customer.segment == segment)
    if category_id:
        q = q.join(Product, Product.id == Transaction.product_id).filter(Product.category_id == category_id)

    rows = q.group_by("year", "month").order_by("year", "month").all()

    return [
        {
            "period": f"{int(r.year)}-{int(r.month):02d}",
            "avg_list_price": round(float(r.avg_list_price or 0), 2),
            "avg_discount": round(float(r.avg_discount or 0), 2),
            "avg_rebate": round(float(r.avg_rebate or 0), 2),
            "avg_net_price": round(float(r.avg_net_price or 0), 2),
        }
        for r in rows
    ]
