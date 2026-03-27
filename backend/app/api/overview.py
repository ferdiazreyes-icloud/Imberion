from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func, distinct
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Transaction, Customer, Product, Territory, Elasticity
from app.schemas.analytics import KPI, OverviewResponse

router = APIRouter()


def _parse_ids(val: Optional[str]) -> Optional[list]:
    """Parse comma-separated IDs string into list of ints."""
    if not val:
        return None
    return [int(x) for x in val.split(",") if x.strip()]


def _parse_strs(val: Optional[str]) -> Optional[list]:
    """Parse comma-separated strings into list."""
    if not val:
        return None
    return [x.strip() for x in val.split(",") if x.strip()]


def _filter_ids(q, column, ids: Optional[list]):
    """Apply single or multi-value filter to a query."""
    if not ids:
        return q
    if len(ids) == 1:
        return q.filter(column == ids[0])
    return q.filter(column.in_(ids))


@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    segment: Optional[str] = None,
    territory_id: Optional[str] = None,
    region: Optional[str] = None,
    category_id: Optional[str] = None,
    product_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    period_start: Optional[str] = None,
    period_end: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(
        func.sum(Transaction.volume).label("total_volume"),
        func.sum(Transaction.revenue).label("total_revenue"),
        func.avg(Transaction.net_price).label("avg_net_price"),
        func.avg(Transaction.rebate).label("avg_rebate"),
        func.count(distinct(Transaction.customer_id)).label("n_customers"),
        func.count(distinct(Transaction.product_id)).label("n_skus"),
        func.count(distinct(Transaction.territory_id)).label("n_territories"),
    )

    q = _filter_ids(q, Transaction.product_id, _parse_ids(product_id))
    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    segs = _parse_strs(segment)
    if segs:
        q = q.join(Customer).filter(Customer.segment.in_(segs) if len(segs) > 1 else Customer.segment == segs[0])
    q = _filter_ids(q, Transaction.territory_id, _parse_ids(territory_id))
    if region:
        q = q.join(Territory).filter(Territory.region == region)
    cat_ids = _parse_ids(category_id)
    if cat_ids:
        q = q.join(Product).filter(Product.category_id.in_(cat_ids) if len(cat_ids) > 1 else Product.category_id == cat_ids[0])
    if period_start:
        q = q.filter(Transaction.date >= period_start)
    if period_end:
        q = q.filter(Transaction.date <= period_end)

    row = q.one()

    # Average elasticity
    eq = db.query(func.avg(Elasticity.coefficient)).filter(Elasticity.type == "historical")
    avg_elasticity = eq.scalar() or 0

    # Modeled coverage
    total_products = db.query(func.count(Product.id)).scalar()
    modeled_products = db.query(func.count(distinct(Elasticity.node_id))).filter(
        Elasticity.node_type == "sku"
    ).scalar()
    coverage = (modeled_products / total_products * 100) if total_products else 0

    return OverviewResponse(
        total_volume=KPI(label="Volumen Total", value=float(row.total_volume or 0), unit="unidades"),
        total_revenue=KPI(label="Ingreso Total", value=float(row.total_revenue or 0), unit="MXN"),
        avg_net_price=KPI(label="Precio Neto Promedio", value=round(float(row.avg_net_price or 0), 2), unit="MXN"),
        avg_elasticity=KPI(label="Elasticidad Promedio", value=round(float(avg_elasticity), 3)),
        modeled_coverage_pct=KPI(label="Cobertura Modelada", value=round(coverage, 1), unit="%"),
        avg_rebate=KPI(label="Rebate Promedio", value=round(float(row.avg_rebate or 0), 2), unit="MXN"),
        total_customers=int(row.n_customers or 0),
        total_skus=int(row.n_skus or 0),
        total_territories=int(row.n_territories or 0),
    )


@router.get("/overview/by-category")
def overview_by_category(
    segment: Optional[str] = None,
    territory_id: Optional[str] = None,
    product_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    from app.models import Category

    q = db.query(
        Category.id,
        Category.name,
        func.sum(Transaction.volume).label("volume"),
        func.sum(Transaction.revenue).label("revenue"),
        func.avg(Transaction.net_price).label("avg_net_price"),
        func.count(distinct(Transaction.product_id)).label("n_skus"),
    ).join(Product, Product.id == Transaction.product_id).join(Category, Category.id == Product.category_id)

    q = _filter_ids(q, Transaction.product_id, _parse_ids(product_id))
    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    segs = _parse_strs(segment)
    if segs:
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(Customer.segment.in_(segs) if len(segs) > 1 else Customer.segment == segs[0])
    q = _filter_ids(q, Transaction.territory_id, _parse_ids(territory_id))

    rows = q.group_by(Category.id, Category.name).all()

    return [
        {
            "category_id": r.id,
            "category_name": r.name,
            "volume": float(r.volume or 0),
            "revenue": float(r.revenue or 0),
            "avg_net_price": round(float(r.avg_net_price or 0), 2),
            "n_skus": r.n_skus,
        }
        for r in rows
    ]


@router.get("/overview/by-segment")
def overview_by_segment(
    category_id: Optional[str] = None,
    territory_id: Optional[str] = None,
    product_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(
        Customer.segment,
        func.sum(Transaction.volume).label("volume"),
        func.sum(Transaction.revenue).label("revenue"),
        func.avg(Transaction.net_price).label("avg_net_price"),
        func.avg(Transaction.rebate).label("avg_rebate"),
        func.count(distinct(Transaction.customer_id)).label("n_customers"),
    ).join(Customer, Customer.id == Transaction.customer_id)

    q = _filter_ids(q, Transaction.product_id, _parse_ids(product_id))
    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    cat_ids = _parse_ids(category_id)
    if cat_ids:
        q = q.join(Product, Product.id == Transaction.product_id).filter(
            Product.category_id.in_(cat_ids) if len(cat_ids) > 1 else Product.category_id == cat_ids[0]
        )
    q = _filter_ids(q, Transaction.territory_id, _parse_ids(territory_id))

    rows = q.group_by(Customer.segment).all()

    return [
        {
            "segment": r.segment,
            "volume": float(r.volume or 0),
            "revenue": float(r.revenue or 0),
            "avg_net_price": round(float(r.avg_net_price or 0), 2),
            "avg_rebate": round(float(r.avg_rebate or 0), 2),
            "n_customers": r.n_customers,
        }
        for r in rows
    ]


@router.get("/overview/by-territory")
def overview_by_territory(
    segment: Optional[str] = None,
    category_id: Optional[str] = None,
    product_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(
        Territory.id,
        Territory.region,
        Territory.state,
        func.sum(Transaction.volume).label("volume"),
        func.sum(Transaction.revenue).label("revenue"),
        func.avg(Transaction.net_price).label("avg_net_price"),
    ).join(Territory, Territory.id == Transaction.territory_id)

    q = _filter_ids(q, Transaction.product_id, _parse_ids(product_id))
    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    segs = _parse_strs(segment)
    if segs:
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(Customer.segment.in_(segs) if len(segs) > 1 else Customer.segment == segs[0])
    cat_ids = _parse_ids(category_id)
    if cat_ids:
        q = q.join(Product, Product.id == Transaction.product_id).filter(
            Product.category_id.in_(cat_ids) if len(cat_ids) > 1 else Product.category_id == cat_ids[0]
        )

    rows = q.group_by(Territory.id, Territory.region, Territory.state).all()

    return [
        {
            "territory_id": r.id,
            "region": r.region,
            "state": r.state,
            "volume": float(r.volume or 0),
            "revenue": float(r.revenue or 0),
            "avg_net_price": round(float(r.avg_net_price or 0), 2),
        }
        for r in rows
    ]
