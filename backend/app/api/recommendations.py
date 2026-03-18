from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Recommendation, Product, Territory, Category
from app.schemas.analytics import RecommendationOut

router = APIRouter()


@router.get("/recommendations", response_model=List[RecommendationOut])
def get_recommendations(
    segment: Optional[str] = None,
    territory_id: Optional[int] = None,
    category_id: Optional[int] = None,
    product_id: Optional[int] = None,
    confidence_level: Optional[str] = None,
    action_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
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
    if territory_id:
        q = q.filter(Recommendation.territory_id == territory_id)
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if product_id:
        q = q.filter(Recommendation.product_id == product_id)
    if confidence_level:
        q = q.filter(Recommendation.confidence_level == confidence_level)
    if action_type:
        q = q.filter(Recommendation.action_type == action_type)

    rows = q.offset(offset).limit(limit).all()

    return [
        RecommendationOut(
            id=r.id,
            product_id=r.product_id,
            product_name=p.name,
            category_name=c.name,
            segment=r.segment,
            territory_name=t.state if t else None,
            action_type=r.action_type,
            suggested_change_pct=r.suggested_change_pct,
            expected_impact_revenue=r.expected_impact_revenue,
            expected_impact_volume=r.expected_impact_volume,
            expected_impact_margin=r.expected_impact_margin,
            confidence_level=r.confidence_level,
            rationale=r.rationale,
        )
        for r, p, c, t in rows
    ]


@router.get("/recommendations/summary")
def recommendations_summary(db: Session = Depends(get_db)):
    """Aggregate summary of recommendations by action type and segment."""
    from sqlalchemy import func

    rows = db.query(
        Recommendation.segment,
        Recommendation.action_type,
        Recommendation.confidence_level,
        func.count(Recommendation.id).label("count"),
        func.avg(Recommendation.suggested_change_pct).label("avg_change"),
        func.sum(Recommendation.expected_impact_revenue).label("total_revenue_impact"),
        func.sum(Recommendation.expected_impact_margin).label("total_margin_impact"),
    ).group_by(
        Recommendation.segment,
        Recommendation.action_type,
        Recommendation.confidence_level,
    ).all()

    return [
        {
            "segment": r.segment,
            "action_type": r.action_type,
            "confidence_level": r.confidence_level,
            "count": r.count,
            "avg_change_pct": round(float(r.avg_change or 0), 2),
            "total_revenue_impact": round(float(r.total_revenue_impact or 0), 2),
            "total_margin_impact": round(float(r.total_margin_impact or 0), 2),
        }
        for r in rows
    ]
