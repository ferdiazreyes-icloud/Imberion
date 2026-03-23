from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Transaction, Customer, Product, Territory, Category, Elasticity
from app.schemas.analytics import ElasticityOut, TrendPoint, TrendResponse
from app.api.overview import _parse_ids, _filter_ids

router = APIRouter()


@router.get("/history/elasticities", response_model=List[ElasticityOut])
def get_elasticities(
    node_type: Optional[str] = None,
    node_id: Optional[int] = None,
    type: Optional[str] = None,
    confidence_level: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Elasticity)
    if node_type:
        q = q.filter(Elasticity.node_type == node_type)
    if node_id:
        q = q.filter(Elasticity.node_id == node_id)
    if type:
        q = q.filter(Elasticity.type == type)
    if confidence_level:
        q = q.filter(Elasticity.confidence_level == confidence_level)
    return q.all()


@router.get("/history/trends")
def get_trends(
    node_type: str = "category",
    node_id: Optional[int] = None,
    segment: Optional[str] = None,
    territory_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(
        extract("year", Transaction.date).label("year"),
        extract("month", Transaction.date).label("month"),
        func.sum(Transaction.volume).label("volume"),
        func.sum(Transaction.revenue).label("revenue"),
        func.avg(Transaction.net_price).label("net_price"),
        func.avg(Transaction.list_price).label("list_price"),
        func.avg(Transaction.rebate).label("rebate"),
    )

    if node_type == "category" and node_id:
        q = q.join(Product).filter(Product.category_id == node_id)
        label_q = db.query(Category.name).filter(Category.id == node_id).scalar()
    elif node_type == "sku" and node_id:
        q = q.filter(Transaction.product_id == node_id)
        label_q = db.query(Product.name).filter(Product.id == node_id).scalar()
    elif node_type == "territory" and node_id:
        q = q.filter(Transaction.territory_id == node_id)
        label_q = db.query(Territory.state).filter(Territory.id == node_id).scalar()
    else:
        label_q = "Portafolio Total"

    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    if segment:
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(Customer.segment == segment)
    q = _filter_ids(q, Transaction.territory_id, _parse_ids(territory_id))

    rows = q.group_by("year", "month").order_by("year", "month").all()

    data = [
        TrendPoint(
            period=f"{int(r.year)}-{int(r.month):02d}",
            volume=float(r.volume or 0),
            revenue=float(r.revenue or 0),
            net_price=round(float(r.net_price or 0), 2),
            list_price=round(float(r.list_price or 0), 2),
            rebate=round(float(r.rebate or 0), 2),
        )
        for r in rows
    ]

    return TrendResponse(
        node_type=node_type,
        node_id=node_id or 0,
        node_label=label_q or "N/A",
        data=data,
    )


@router.get("/history/price-volume")
def get_price_volume_scatter(
    product_id: Optional[int] = None,
    category_id: Optional[str] = None,
    segment: Optional[str] = None,
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Return monthly price-volume pairs for scatter/elasticity chart."""
    q = db.query(
        extract("year", Transaction.date).label("year"),
        extract("month", Transaction.date).label("month"),
        func.avg(Transaction.net_price).label("avg_price"),
        func.sum(Transaction.volume).label("total_volume"),
    )

    if product_id:
        q = q.filter(Transaction.product_id == product_id)
    cat_ids = _parse_ids(category_id)
    if cat_ids:
        q = q.join(Product).filter(Product.category_id.in_(cat_ids) if len(cat_ids) > 1 else Product.category_id == cat_ids[0])
    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    if segment:
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(Customer.segment == segment)

    rows = q.group_by("year", "month").order_by("year", "month").all()

    return [
        {
            "period": f"{int(r.year)}-{int(r.month):02d}",
            "avg_price": round(float(r.avg_price or 0), 2),
            "total_volume": float(r.total_volume or 0),
        }
        for r in rows
    ]
