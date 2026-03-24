"""
Agent tools — functions that the LLM can invoke to query real data.

Each tool receives typed parameters and a SQLAlchemy Session,
reusing the same query patterns from the API routers.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy import func, distinct, extract
from sqlalchemy.orm import Session

from app.models import (
    Transaction, Customer, Product, Territory,
    Category, Elasticity, Recommendation,
)
from app.api.overview import _parse_ids, _parse_strs, _filter_ids
from app.analytics.prediction_model import predict_scenario, optimal_price_search


# ---------------------------------------------------------------------------
# Tool 1: Overview KPIs
# ---------------------------------------------------------------------------
def get_overview_kpis(
    db: Session,
    segment: Optional[str] = None,
    territory_id: Optional[str] = None,
    category_id: Optional[str] = None,
    customer_id: Optional[str] = None,
) -> dict:
    """Get high-level KPIs: total volume, revenue, avg price, avg rebate, counts."""
    q = db.query(
        func.sum(Transaction.volume).label("total_volume"),
        func.sum(Transaction.revenue).label("total_revenue"),
        func.avg(Transaction.net_price).label("avg_net_price"),
        func.avg(Transaction.rebate).label("avg_rebate"),
        func.count(distinct(Transaction.customer_id)).label("n_customers"),
        func.count(distinct(Transaction.product_id)).label("n_skus"),
        func.count(distinct(Transaction.territory_id)).label("n_territories"),
    )

    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    segs = _parse_strs(segment)
    if segs:
        q = q.join(Customer).filter(
            Customer.segment.in_(segs) if len(segs) > 1 else Customer.segment == segs[0]
        )
    q = _filter_ids(q, Transaction.territory_id, _parse_ids(territory_id))
    cat_ids = _parse_ids(category_id)
    if cat_ids:
        q = q.join(Product).filter(
            Product.category_id.in_(cat_ids) if len(cat_ids) > 1 else Product.category_id == cat_ids[0]
        )

    row = q.one()
    return {
        "total_volume": float(row.total_volume or 0),
        "total_revenue": float(row.total_revenue or 0),
        "avg_net_price": round(float(row.avg_net_price or 0), 2),
        "avg_rebate": round(float(row.avg_rebate or 0), 2),
        "n_customers": int(row.n_customers or 0),
        "n_skus": int(row.n_skus or 0),
        "n_territories": int(row.n_territories or 0),
    }


# ---------------------------------------------------------------------------
# Tool 2: Revenue by dimension (category / segment / territory)
# ---------------------------------------------------------------------------
def get_revenue_by_dimension(
    db: Session,
    dimension: str = "category",
    segment: Optional[str] = None,
    territory_id: Optional[str] = None,
    category_id: Optional[str] = None,
    customer_id: Optional[str] = None,
) -> list[dict]:
    """Break down revenue/volume by category, segment, or territory."""
    if dimension == "category":
        q = db.query(
            Category.name.label("name"),
            func.sum(Transaction.volume).label("volume"),
            func.sum(Transaction.revenue).label("revenue"),
        ).join(Product, Product.id == Transaction.product_id
        ).join(Category, Category.id == Product.category_id)
        group_cols = [Category.name]
    elif dimension == "segment":
        q = db.query(
            Customer.segment.label("name"),
            func.sum(Transaction.volume).label("volume"),
            func.sum(Transaction.revenue).label("revenue"),
        ).join(Customer, Customer.id == Transaction.customer_id)
        group_cols = [Customer.segment]
    else:  # territory
        q = db.query(
            Territory.state.label("name"),
            func.sum(Transaction.volume).label("volume"),
            func.sum(Transaction.revenue).label("revenue"),
        ).join(Territory, Territory.id == Transaction.territory_id)
        group_cols = [Territory.state]

    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    segs = _parse_strs(segment)
    if segs and dimension != "segment":
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(
            Customer.segment.in_(segs) if len(segs) > 1 else Customer.segment == segs[0]
        )
    q = _filter_ids(q, Transaction.territory_id, _parse_ids(territory_id))
    cat_ids = _parse_ids(category_id)
    if cat_ids and dimension != "category":
        q = q.join(Product, Product.id == Transaction.product_id).filter(
            Product.category_id.in_(cat_ids) if len(cat_ids) > 1 else Product.category_id == cat_ids[0]
        )

    rows = q.group_by(*group_cols).all()
    return [
        {"name": r.name, "volume": float(r.volume or 0), "revenue": float(r.revenue or 0)}
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Tool 3: Price trends over time
# ---------------------------------------------------------------------------
def get_price_trends(
    db: Session,
    segment: Optional[str] = None,
    territory_id: Optional[str] = None,
    category_id: Optional[str] = None,
    customer_id: Optional[str] = None,
) -> list[dict]:
    """Monthly price/volume/revenue trends."""
    q = db.query(
        extract("year", Transaction.date).label("year"),
        extract("month", Transaction.date).label("month"),
        func.sum(Transaction.volume).label("volume"),
        func.sum(Transaction.revenue).label("revenue"),
        func.avg(Transaction.net_price).label("net_price"),
        func.avg(Transaction.list_price).label("list_price"),
        func.avg(Transaction.rebate).label("rebate"),
    )

    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    segs = _parse_strs(segment)
    if segs:
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(
            Customer.segment.in_(segs) if len(segs) > 1 else Customer.segment == segs[0]
        )
    q = _filter_ids(q, Transaction.territory_id, _parse_ids(territory_id))
    cat_ids = _parse_ids(category_id)
    if cat_ids:
        q = q.join(Product, Product.id == Transaction.product_id).filter(
            Product.category_id.in_(cat_ids) if len(cat_ids) > 1 else Product.category_id == cat_ids[0]
        )

    rows = q.group_by("year", "month").order_by("year", "month").all()
    return [
        {
            "period": f"{int(r.year)}-{int(r.month):02d}",
            "volume": float(r.volume or 0),
            "revenue": float(r.revenue or 0),
            "net_price": round(float(r.net_price or 0), 2),
            "list_price": round(float(r.list_price or 0), 2),
            "rebate": round(float(r.rebate or 0), 2),
        }
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Tool 4: Elasticities
# ---------------------------------------------------------------------------
def get_elasticity(
    db: Session,
    node_type: Optional[str] = None,
    node_id: Optional[int] = None,
    confidence_level: Optional[str] = None,
) -> list[dict]:
    """Fetch elasticity records with optional filters."""
    q = db.query(Elasticity)
    if node_type:
        q = q.filter(Elasticity.node_type == node_type)
    if node_id:
        q = q.filter(Elasticity.node_id == node_id)
    if confidence_level:
        q = q.filter(Elasticity.confidence_level == confidence_level)

    rows = q.limit(50).all()

    # Resolve human-readable names
    results = []
    for e in rows:
        name = _resolve_node_name(db, e.node_type, e.node_id)
        results.append({
            "node_type": e.node_type,
            "node_id": e.node_id,
            "node_name": name,
            "type": e.type,
            "coefficient": round(float(e.coefficient), 4),
            "confidence_level": e.confidence_level,
            "p_value": round(float(e.p_value), 4) if e.p_value else None,
            "r_squared": round(float(e.r_squared), 4) if e.r_squared else None,
            "sample_size": e.sample_size,
        })
    return results


def _resolve_node_name(db: Session, node_type: str, node_id: int) -> str:
    """Resolve a node_type + node_id to a human-readable name."""
    if node_type == "category":
        cat = db.query(Category.name).filter(Category.id == node_id).scalar()
        return cat or f"Category {node_id}"
    elif node_type == "sku":
        prod = db.query(Product.name).filter(Product.id == node_id).scalar()
        return prod or f"Product {node_id}"
    elif node_type == "segment":
        return ["oro", "plata", "bronce"][node_id - 1] if 1 <= node_id <= 3 else f"Segment {node_id}"
    elif node_type == "territory":
        state = db.query(Territory.state).filter(Territory.id == node_id).scalar()
        return state or f"Territory {node_id}"
    return f"{node_type} {node_id}"


# ---------------------------------------------------------------------------
# Tool 5: Simulate price change
# ---------------------------------------------------------------------------
def simulate_price_change(
    db: Session,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    segment: Optional[str] = None,
    price_change_pct: float = 5.0,
) -> dict:
    """Simulate the impact of a price change on volume, revenue, and margin."""
    # Get base data from transactions
    q = db.query(
        func.avg(Transaction.net_price).label("avg_price"),
        func.sum(Transaction.volume).label("total_volume"),
    )
    if product_id:
        q = q.filter(Transaction.product_id == product_id)
    if category_id:
        q = q.join(Product).filter(Product.category_id == category_id)
    if segment:
        segs = _parse_strs(segment)
        if segs:
            q = q.join(Customer, Customer.id == Transaction.customer_id).filter(
                Customer.segment.in_(segs) if len(segs) > 1 else Customer.segment == segs[0]
            )

    row = q.one()
    base_price = float(row.avg_price or 100)
    base_volume = float(row.total_volume or 0)

    if base_volume == 0:
        return {"error": "No transaction data found for the given filters."}

    # Get elasticity
    eq = db.query(Elasticity.coefficient)
    if product_id:
        eq = eq.filter(Elasticity.node_type == "sku", Elasticity.node_id == product_id)
    elif category_id:
        eq = eq.filter(Elasticity.node_type == "category", Elasticity.node_id == category_id)
    else:
        eq = eq.filter(Elasticity.type == "historical")

    elasticity_val = eq.scalar() or -1.0

    prediction = predict_scenario(base_price, base_volume, price_change_pct, float(elasticity_val))
    return {
        "base_price": base_price,
        "base_volume": base_volume,
        "elasticity_used": round(float(elasticity_val), 4),
        "price_change_pct": price_change_pct,
        **prediction,
    }


# ---------------------------------------------------------------------------
# Tool 6: Recommendations
# ---------------------------------------------------------------------------
def get_recommendations_data(
    db: Session,
    segment: Optional[str] = None,
    category_id: Optional[int] = None,
    action_type: Optional[str] = None,
    confidence_level: Optional[str] = None,
    limit: int = 20,
) -> list[dict]:
    """Get pricing recommendations with product names and rationale."""
    q = (
        db.query(Recommendation, Product, Category)
        .join(Product, Recommendation.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
    )

    if segment:
        q = q.filter(Recommendation.segment == segment)
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if action_type:
        q = q.filter(Recommendation.action_type == action_type)
    if confidence_level:
        q = q.filter(Recommendation.confidence_level == confidence_level)

    rows = q.limit(limit).all()
    return [
        {
            "product_name": p.name,
            "category_name": c.name,
            "segment": r.segment,
            "action_type": r.action_type,
            "suggested_change_pct": round(float(r.suggested_change_pct), 2),
            "expected_impact_revenue": round(float(r.expected_impact_revenue or 0), 2),
            "expected_impact_margin": round(float(r.expected_impact_margin or 0), 2),
            "confidence_level": r.confidence_level,
            "rationale": r.rationale,
        }
        for r, p, c in rows
    ]


# ---------------------------------------------------------------------------
# Tool 7: Passthrough analysis
# ---------------------------------------------------------------------------
def get_passthrough_analysis(
    db: Session,
    dimension: str = "segment",
    segment: Optional[str] = None,
    category_id: Optional[str] = None,
    customer_id: Optional[str] = None,
) -> list[dict]:
    """Price decomposition: list price, discount, rebate, net price."""
    if dimension == "category":
        q = db.query(
            Category.name.label("name"),
            func.avg(Transaction.list_price).label("avg_list_price"),
            func.avg(Transaction.discount).label("avg_discount"),
            func.avg(Transaction.rebate).label("avg_rebate"),
            func.avg(Transaction.net_price).label("avg_net_price"),
            func.sum(Transaction.volume).label("volume"),
        ).join(Product, Product.id == Transaction.product_id
        ).join(Category, Category.id == Product.category_id)
        group_cols = [Category.name]
    else:  # segment
        q = db.query(
            Customer.segment.label("name"),
            func.avg(Transaction.list_price).label("avg_list_price"),
            func.avg(Transaction.discount).label("avg_discount"),
            func.avg(Transaction.rebate).label("avg_rebate"),
            func.avg(Transaction.net_price).label("avg_net_price"),
            func.sum(Transaction.volume).label("volume"),
        ).join(Customer, Customer.id == Transaction.customer_id)
        group_cols = [Customer.segment]

    q = _filter_ids(q, Transaction.customer_id, _parse_ids(customer_id))
    segs = _parse_strs(segment)
    if segs and dimension != "segment":
        q = q.join(Customer, Customer.id == Transaction.customer_id).filter(
            Customer.segment.in_(segs) if len(segs) > 1 else Customer.segment == segs[0]
        )
    cat_ids = _parse_ids(category_id)
    if cat_ids and dimension != "category":
        q = q.join(Product, Product.id == Transaction.product_id).filter(
            Product.category_id.in_(cat_ids) if len(cat_ids) > 1 else Product.category_id == cat_ids[0]
        )

    rows = q.group_by(*group_cols).all()
    return [
        {
            "name": r.name,
            "avg_list_price": round(float(r.avg_list_price or 0), 2),
            "avg_discount": round(float(r.avg_discount or 0), 2),
            "avg_rebate": round(float(r.avg_rebate or 0), 2),
            "avg_net_price": round(float(r.avg_net_price or 0), 2),
            "rebate_pct": round(float(r.avg_rebate or 0) / float(r.avg_list_price or 1) * 100, 2),
            "discount_pct": round(float(r.avg_discount or 0) / float(r.avg_list_price or 1) * 100, 2),
            "volume": float(r.volume or 0),
        }
        for r in rows
    ]
