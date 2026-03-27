from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Transaction, Customer, Product, Territory, Category, Elasticity
from app.schemas.analytics import ElasticityOut, TrendPoint, TrendResponse
from app.api.overview import _parse_ids, _parse_strs, _filter_ids

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
    rows = q.all()

    # Build lookup maps for resolving node names
    name_cache: dict[tuple[str, int], str] = {}
    node_types_needed = {(r.node_type, r.node_id) for r in rows}
    cat_ids = [nid for nt, nid in node_types_needed if nt == "category"]
    sku_ids = [nid for nt, nid in node_types_needed if nt == "sku"]
    seg_ids = [nid for nt, nid in node_types_needed if nt == "segment"]
    ter_ids = [nid for nt, nid in node_types_needed if nt == "territory"]

    if cat_ids:
        for c in db.query(Category.id, Category.name).filter(Category.id.in_(cat_ids)).all():
            name_cache[("category", c.id)] = c.name
    if sku_ids:
        for p in db.query(Product.id, Product.sku_code, Product.name).filter(Product.id.in_(sku_ids)).all():
            name_cache[("sku", p.id)] = f"{p.sku_code} - {p.name}"
    if ter_ids:
        for t in db.query(Territory.id, Territory.state).filter(Territory.id.in_(ter_ids)).all():
            name_cache[("territory", t.id)] = t.state
    if seg_ids:
        for cust in db.query(Customer.id, Customer.segment).filter(Customer.id.in_(seg_ids)).all():
            name_cache[("segment", cust.id)] = cust.segment.capitalize()

    results = []
    for r in rows:
        out = ElasticityOut.model_validate(r)
        out.node_name = name_cache.get((r.node_type, r.node_id), f"{r.node_type} #{r.node_id}")
        results.append(out)
    return results


@router.get("/history/trends")
def get_trends(
    node_type: str = "category",
    node_id: Optional[int] = None,
    segment: Optional[str] = None,
    territory_id: Optional[str] = None,
    product_id: Optional[str] = None,
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

    q = _filter_ids(q, Transaction.product_id, _parse_ids(product_id))
    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    segs = _parse_strs(segment)
    if segs:
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(Customer.segment.in_(segs) if len(segs) > 1 else Customer.segment == segs[0])
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
    segs = _parse_strs(segment)
    if segs:
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(Customer.segment.in_(segs) if len(segs) > 1 else Customer.segment == segs[0])

    rows = q.group_by("year", "month").order_by("year", "month").all()

    return [
        {
            "period": f"{int(r.year)}-{int(r.month):02d}",
            "avg_price": round(float(r.avg_price or 0), 2),
            "total_volume": float(r.total_volume or 0),
        }
        for r in rows
    ]
