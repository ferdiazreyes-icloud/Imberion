import io
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Recommendation, Product, Territory, Category, Customer, Transaction

router = APIRouter()


@router.get("/export/recommendations-csv")
def export_recommendations_csv(
    segment: str | None = None,
    confidence_level: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Recommendation)
    if segment:
        q = q.filter(Recommendation.segment == segment)
    if confidence_level:
        q = q.filter(Recommendation.confidence_level == confidence_level)

    recs = q.all()

    output = io.StringIO()
    output.write("Product,Category,Segment,Territory,Action,Change%,Revenue Impact,Volume Impact,Margin Impact,Confidence\n")

    for r in recs:
        product = db.query(Product).get(r.product_id)
        category = db.query(Category).get(product.category_id) if product else None
        territory = db.query(Territory).get(r.territory_id) if r.territory_id else None

        output.write(
            f'"{product.name if product else ""}","{category.name if category else ""}",'
            f'"{r.segment}","{territory.state if territory else ""}",'
            f'"{r.action_type}",{r.suggested_change_pct},'
            f'{r.expected_impact_revenue},{r.expected_impact_volume},'
            f'{r.expected_impact_margin},"{r.confidence_level}"\n'
        )

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=recommendations_{datetime.now().strftime('%Y%m%d')}.csv"},
    )


@router.get("/export/executive-summary")
def export_executive_summary(db: Session = Depends(get_db)):
    """Generate executive summary JSON (can be rendered as PDF on frontend)."""
    # Total KPIs
    totals = db.query(
        func.sum(Transaction.revenue).label("revenue"),
        func.sum(Transaction.volume).label("volume"),
        func.avg(Transaction.net_price).label("avg_price"),
    ).one()

    # By segment
    by_segment = db.query(
        Customer.segment,
        func.sum(Transaction.revenue).label("revenue"),
        func.sum(Transaction.volume).label("volume"),
        func.count(func.distinct(Customer.id)).label("n_customers"),
    ).join(Customer).group_by(Customer.segment).all()

    # Top recommendations
    top_recs = db.query(Recommendation).filter(
        Recommendation.confidence_level.in_(["high", "medium"])
    ).order_by(Recommendation.expected_impact_margin.desc()).limit(20).all()

    rec_data = []
    for r in top_recs:
        product = db.query(Product).get(r.product_id)
        rec_data.append({
            "product": product.name if product else "N/A",
            "segment": r.segment,
            "action": r.action_type,
            "change_pct": r.suggested_change_pct,
            "margin_impact": r.expected_impact_margin,
            "confidence": r.confidence_level,
        })

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
        "top_recommendations": rec_data,
    }
