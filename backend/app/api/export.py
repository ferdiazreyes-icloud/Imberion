from typing import Optional

import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Recommendation, Product, Territory, Category, Customer, Transaction, ScenarioResult, Scenario

router = APIRouter()


@router.get("/export/recommendations-csv")
def export_recommendations_csv(
    segment: Optional[str] = None,
    confidence_level: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = (
        db.query(Recommendation, Product, Category, Territory)
        .join(Product, Recommendation.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .outerjoin(Territory, Recommendation.territory_id == Territory.id)
    )
    if segment:
        q = q.filter(Recommendation.segment == segment)
    if confidence_level:
        q = q.filter(Recommendation.confidence_level == confidence_level)

    rows = q.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Product", "Category", "Segment", "Territory", "Action", "Change%",
                      "Revenue Impact", "Volume Impact", "Margin Impact", "Confidence"])

    for r, p, c, t in rows:
        writer.writerow([
            p.name, c.name, r.segment, t.state if t else "",
            r.action_type, r.suggested_change_pct,
            r.expected_impact_revenue, r.expected_impact_volume,
            r.expected_impact_margin, r.confidence_level,
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=recommendations_{datetime.now().strftime('%Y%m%d')}.csv"},
    )


@router.get("/export/executive-summary")
def export_executive_summary(
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Generate executive summary JSON."""
    from app.api.overview import _parse_ids, _filter_ids

    totals_q = db.query(
        func.sum(Transaction.revenue).label("revenue"),
        func.sum(Transaction.volume).label("volume"),
        func.avg(Transaction.net_price).label("avg_price"),
    )
    totals_q = _filter_ids(totals_q, Transaction.customer_id, _parse_ids(customer_id))
    totals = totals_q.one()

    by_segment = db.query(
        Customer.segment,
        func.sum(Transaction.revenue).label("revenue"),
        func.sum(Transaction.volume).label("volume"),
        func.count(func.distinct(Customer.id)).label("n_customers"),
    ).join(Customer).group_by(Customer.segment).all()

    top_recs = (
        db.query(Recommendation, Product)
        .join(Product, Recommendation.product_id == Product.id)
        .filter(Recommendation.confidence_level.in_(["high", "medium"]))
        .order_by(Recommendation.expected_impact_margin.desc())
        .limit(20)
        .all()
    )

    return {
        "generated_at": datetime.now().isoformat(),
        "title": "USG Pricing Decision Engine - Informe Ejecutivo",
        "summary": {
            "total_revenue": float(totals.revenue or 0),
            "total_volume": float(totals.volume or 0),
            "avg_price": round(float(totals.avg_price or 0), 2),
        },
        "by_segment": [
            {
                "segment": r.segment,
                "revenue": float(r.revenue or 0),
                "volume": float(r.volume or 0),
                "n_customers": r.n_customers,
            }
            for r in by_segment
        ],
        "top_recommendations": [
            {
                "product": p.name,
                "segment": r.segment,
                "action": r.action_type,
                "change_pct": r.suggested_change_pct,
                "margin_impact": r.expected_impact_margin,
                "confidence": r.confidence_level,
            }
            for r, p in top_recs
        ],
    }


@router.get("/export/scenario-csv/{scenario_id}")
def export_scenario_csv(
    scenario_id: int,
    db: Session = Depends(get_db),
):
    """Export scenario results as CSV."""
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    results = (
        db.query(ScenarioResult, Product, Category)
        .join(Product, ScenarioResult.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .filter(ScenarioResult.scenario_id == scenario_id)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Product", "SKU", "Category", "Segment", "Price Change %",
        "Expected Volume", "Expected Revenue", "Expected Margin", "Confidence",
    ])

    for sr, p, c in results:
        writer.writerow([
            p.name, p.sku_code, c.name, sr.segment or "",
            sr.price_change_pct, round(sr.expected_volume, 2),
            round(sr.expected_revenue, 2), round(sr.expected_margin, 2),
            sr.confidence_level,
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=scenario_{scenario_id}_{datetime.now().strftime('%Y%m%d')}.csv"
        },
    )
