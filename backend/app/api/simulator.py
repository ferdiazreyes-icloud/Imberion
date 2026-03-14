from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Transaction, Customer, Product, Territory, Category,
    Elasticity, Scenario, ScenarioResult,
)
from app.schemas.scenario import ScenarioCreate, ScenarioOut, ScenarioResultOut, ScenarioCompareResponse

router = APIRouter()


@router.get("/simulator/scenarios", response_model=list[ScenarioOut])
def list_scenarios(db: Session = Depends(get_db)):
    return db.query(Scenario).order_by(Scenario.created_at.desc()).all()


@router.post("/simulator/scenarios", response_model=ScenarioOut)
def create_scenario(data: ScenarioCreate, db: Session = Depends(get_db)):
    scenario = Scenario(
        name=data.name,
        description=data.description,
        assumptions=data.assumptions or {},
    )
    db.add(scenario)
    db.flush()

    for pc in data.price_changes:
        # Determine affected products
        product_ids = []
        if pc.product_id:
            product_ids = [pc.product_id]
        elif pc.category_id:
            product_ids = [p.id for p in db.query(Product.id).filter(Product.category_id == pc.category_id).all()]
        else:
            product_ids = [p.id for p in db.query(Product.id).all()]

        for pid in product_ids:
            # Get elasticity for this product
            elast = db.query(Elasticity).filter(
                Elasticity.node_type == "sku",
                Elasticity.node_id == pid,
                Elasticity.type == "predicted",
            ).first()

            if not elast:
                elast = db.query(Elasticity).filter(
                    Elasticity.node_type == "sku",
                    Elasticity.node_id == pid,
                    Elasticity.type == "historical",
                ).first()

            coefficient = elast.coefficient if elast else -1.0
            confidence = elast.confidence_level if elast else "low"

            # Get current averages for this product
            base = db.query(
                func.avg(Transaction.net_price).label("price"),
                func.sum(Transaction.volume).label("volume"),
                func.sum(Transaction.revenue).label("revenue"),
            ).filter(Transaction.product_id == pid)

            if pc.segment:
                base = base.join(Customer).filter(Customer.segment == pc.segment)
            if pc.territory_id:
                base = base.filter(Transaction.territory_id == pc.territory_id)

            base_row = base.one()
            base_price = float(base_row.price or 100)
            base_volume = float(base_row.volume or 0)
            base_revenue = float(base_row.revenue or 0)

            # Apply elasticity: %ΔQ = ε × %ΔP
            pct_change = pc.change_pct / 100
            volume_change = coefficient * pct_change
            expected_volume = base_volume * (1 + volume_change)
            new_price = base_price * (1 + pct_change)
            expected_revenue = expected_volume * new_price
            expected_margin = expected_revenue * 0.30  # 30% margin assumption

            result = ScenarioResult(
                scenario_id=scenario.id,
                product_id=pid,
                segment=pc.segment,
                territory_id=pc.territory_id,
                price_change_pct=pc.change_pct,
                expected_volume=round(expected_volume, 2),
                expected_revenue=round(expected_revenue, 2),
                expected_margin=round(expected_margin, 2),
                confidence_level=confidence,
            )
            db.add(result)

    db.commit()
    db.refresh(scenario)
    return scenario


@router.get("/simulator/scenarios/{scenario_id}/results", response_model=list[ScenarioResultOut])
def get_scenario_results(scenario_id: int, db: Session = Depends(get_db)):
    results = db.query(ScenarioResult).filter(ScenarioResult.scenario_id == scenario_id).all()
    enriched = []
    for r in results:
        product = db.query(Product).get(r.product_id)
        territory = db.query(Territory).get(r.territory_id) if r.territory_id else None
        enriched.append(ScenarioResultOut(
            id=r.id,
            scenario_id=r.scenario_id,
            product_id=r.product_id,
            product_name=product.name if product else None,
            segment=r.segment,
            territory_name=territory.state if territory else None,
            price_change_pct=r.price_change_pct,
            expected_volume=r.expected_volume,
            expected_revenue=r.expected_revenue,
            expected_margin=r.expected_margin,
            confidence_level=r.confidence_level,
        ))
    return enriched


@router.get("/simulator/compare")
def compare_scenarios(scenario_id: int, db: Session = Depends(get_db)):
    """Compare a scenario against the base scenario (latest base or first scenario)."""
    base_scenario = db.query(Scenario).filter(Scenario.is_base == True).first()
    scenario = db.query(Scenario).get(scenario_id)

    if not scenario:
        return {"error": "Scenario not found"}

    scenario_results = db.query(ScenarioResult).filter(ScenarioResult.scenario_id == scenario_id).all()

    # Calculate base values from actual transactions
    base_data = []
    for r in scenario_results:
        base_q = db.query(
            func.sum(Transaction.volume).label("volume"),
            func.sum(Transaction.revenue).label("revenue"),
        ).filter(Transaction.product_id == r.product_id)

        if r.segment:
            base_q = base_q.join(Customer).filter(Customer.segment == r.segment)
        if r.territory_id:
            base_q = base_q.filter(Transaction.territory_id == r.territory_id)

        base_row = base_q.one()
        base_data.append({
            "product_id": r.product_id,
            "segment": r.segment,
            "base_volume": float(base_row.volume or 0),
            "base_revenue": float(base_row.revenue or 0),
            "scenario_volume": r.expected_volume,
            "scenario_revenue": r.expected_revenue,
            "scenario_margin": r.expected_margin,
            "price_change_pct": r.price_change_pct,
            "confidence_level": r.confidence_level,
        })

    total_base_revenue = sum(d["base_revenue"] for d in base_data)
    total_scenario_revenue = sum(d["scenario_revenue"] for d in base_data)
    total_base_volume = sum(d["base_volume"] for d in base_data)
    total_scenario_volume = sum(d["scenario_volume"] for d in base_data)
    total_scenario_margin = sum(d["scenario_margin"] for d in base_data)

    return {
        "scenario_name": scenario.name,
        "details": base_data,
        "delta_revenue": round(total_scenario_revenue - total_base_revenue, 2),
        "delta_volume": round(total_scenario_volume - total_base_volume, 2),
        "total_margin": round(total_scenario_margin, 2),
    }


@router.post("/simulator/quick-simulate")
def quick_simulate(
    product_id: int | None = None,
    category_id: int | None = None,
    segment: str | None = None,
    price_change_pct: float = 5.0,
    db: Session = Depends(get_db),
):
    """Quick simulation without persisting a scenario. Returns price-volume-margin curve."""
    points = []
    for pct in range(-20, 21, 2):
        # Get relevant elasticity
        if product_id:
            elast = db.query(Elasticity).filter(
                Elasticity.node_type == "sku", Elasticity.node_id == product_id
            ).first()
            base_q = db.query(
                func.avg(Transaction.net_price), func.sum(Transaction.volume), func.sum(Transaction.revenue)
            ).filter(Transaction.product_id == product_id)
        elif category_id:
            elast = db.query(Elasticity).filter(
                Elasticity.node_type == "category", Elasticity.node_id == category_id
            ).first()
            base_q = db.query(
                func.avg(Transaction.net_price), func.sum(Transaction.volume), func.sum(Transaction.revenue)
            ).join(Product).filter(Product.category_id == category_id)
        else:
            elast = db.query(Elasticity).filter(Elasticity.node_type == "category").first()
            base_q = db.query(
                func.avg(Transaction.net_price), func.sum(Transaction.volume), func.sum(Transaction.revenue)
            )

        if segment:
            base_q = base_q.join(Customer, Customer.id == Transaction.customer_id).filter(Customer.segment == segment)

        row = base_q.one()
        base_price = float(row[0] or 100)
        base_volume = float(row[1] or 0)
        coefficient = elast.coefficient if elast else -1.0

        change = pct / 100
        vol_change = coefficient * change
        new_vol = base_volume * (1 + vol_change)
        new_price = base_price * (1 + change)
        new_revenue = new_vol * new_price
        new_margin = new_revenue * 0.30

        points.append({
            "price_change_pct": pct,
            "price": round(new_price, 2),
            "volume": round(new_vol, 2),
            "revenue": round(new_revenue, 2),
            "margin": round(new_margin, 2),
        })

    return {
        "elasticity_used": elast.coefficient if elast else -1.0,
        "confidence": elast.confidence_level if elast else "low",
        "curve": points,
    }
