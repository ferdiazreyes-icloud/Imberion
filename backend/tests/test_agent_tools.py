"""Tests for agent tool functions."""

from datetime import date

from app.models import Territory, Category, Product, Customer, Transaction, Elasticity, Recommendation
from app.agent.tools import (
    get_overview_kpis,
    get_revenue_by_dimension,
    get_price_trends,
    get_elasticity,
    simulate_price_change,
    get_recommendations_data,
    get_passthrough_analysis,
)


def _seed(db):
    """Insert minimal test data for agent tools."""
    territory = Territory(region="Norte", state="Nuevo León", municipality="Monterrey")
    db.add(territory)
    db.flush()

    customer = Customer(name="Dist A", type="distribuidor", segment="oro", territory_id=territory.id)
    db.add(customer)
    db.flush()

    category = Category(name="Tableros")
    db.add(category)
    db.flush()

    product = Product(sku_code="TB-001", name="Tabla Roca 1/2", category_id=category.id)
    db.add(product)
    db.flush()

    db.add(Transaction(
        date=date(2024, 6, 1), customer_id=customer.id, product_id=product.id,
        territory_id=territory.id, volume=100, list_price=250, discount=20,
        rebate=10, net_price=220, revenue=22000,
    ))

    db.add(Elasticity(
        type="historical", coefficient=-1.2, confidence_level="high",
        p_value=0.01, r_squared=0.85, node_type="sku", node_id=product.id,
        period_start=date(2024, 1, 1), period_end=date(2025, 12, 31), sample_size=500,
    ))

    db.add(Elasticity(
        type="historical", coefficient=-0.8, confidence_level="medium",
        p_value=0.08, r_squared=0.55, node_type="category", node_id=category.id,
        period_start=date(2024, 1, 1), period_end=date(2025, 12, 31), sample_size=300,
    ))

    db.add(Recommendation(
        product_id=product.id, segment="oro", territory_id=territory.id,
        action_type="increase", suggested_change_pct=5.0,
        expected_impact_revenue=100000, expected_impact_volume=-500,
        expected_impact_margin=30000, confidence_level="high",
        rationale={"elasticity": -1.2},
    ))

    db.commit()
    return {"territory": territory, "customer": customer, "category": category, "product": product}


def test_get_overview_kpis(db):
    _seed(db)
    result = get_overview_kpis(db)
    assert result["total_volume"] == 100
    assert result["total_revenue"] == 22000
    assert result["n_customers"] == 1
    assert result["n_skus"] == 1


def test_get_overview_kpis_with_segment_filter(db):
    _seed(db)
    result = get_overview_kpis(db, segment="oro")
    assert result["total_volume"] == 100

    result_empty = get_overview_kpis(db, segment="plata")
    assert result_empty["total_volume"] == 0


def test_get_revenue_by_dimension_category(db):
    _seed(db)
    result = get_revenue_by_dimension(db, dimension="category")
    assert len(result) == 1
    assert result[0]["name"] == "Tableros"
    assert result[0]["revenue"] == 22000


def test_get_revenue_by_dimension_segment(db):
    _seed(db)
    result = get_revenue_by_dimension(db, dimension="segment")
    assert len(result) == 1
    assert result[0]["name"] == "oro"


def test_get_revenue_by_dimension_territory(db):
    _seed(db)
    result = get_revenue_by_dimension(db, dimension="territory")
    assert len(result) == 1
    assert result[0]["name"] == "Nuevo León"


def test_get_price_trends(db):
    _seed(db)
    result = get_price_trends(db)
    assert len(result) == 1
    assert result[0]["period"] == "2024-06"
    assert result[0]["volume"] == 100


def test_get_elasticity_all(db):
    _seed(db)
    result = get_elasticity(db)
    assert len(result) == 2


def test_get_elasticity_by_node_type(db):
    _seed(db)
    result = get_elasticity(db, node_type="sku")
    assert len(result) == 1
    assert result[0]["coefficient"] == -1.2


def test_get_elasticity_by_confidence(db):
    _seed(db)
    result = get_elasticity(db, confidence_level="high")
    assert len(result) == 1
    assert result[0]["node_name"] == "Tabla Roca 1/2"


def test_simulate_price_change(db):
    data = _seed(db)
    result = simulate_price_change(db, product_id=data["product"].id, price_change_pct=5.0)
    assert "error" not in result
    assert result["elasticity_used"] == -1.2
    assert result["delta_price_pct"] == 5.0
    assert result["new_price"] > 220  # price should increase


def test_simulate_price_change_category(db):
    data = _seed(db)
    result = simulate_price_change(db, category_id=data["category"].id, price_change_pct=-10.0)
    assert "error" not in result
    assert result["delta_price_pct"] == -10.0


def test_get_recommendations_data(db):
    _seed(db)
    result = get_recommendations_data(db)
    assert len(result) == 1
    assert result[0]["action_type"] == "increase"
    assert result[0]["product_name"] == "Tabla Roca 1/2"


def test_get_recommendations_data_filtered(db):
    _seed(db)
    result = get_recommendations_data(db, segment="oro", action_type="increase")
    assert len(result) == 1

    result_empty = get_recommendations_data(db, segment="plata")
    assert len(result_empty) == 0


def test_get_passthrough_segment(db):
    _seed(db)
    result = get_passthrough_analysis(db, dimension="segment")
    assert len(result) == 1
    assert result[0]["name"] == "oro"
    assert result[0]["avg_list_price"] == 250
    assert result[0]["avg_rebate"] == 10


def test_get_passthrough_category(db):
    _seed(db)
    result = get_passthrough_analysis(db, dimension="category")
    assert len(result) == 1
    assert result[0]["name"] == "Tableros"
