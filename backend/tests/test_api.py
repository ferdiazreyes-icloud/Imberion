"""Basic API tests for USG Pricing Decision Engine."""

from datetime import date

from app.models import Territory, Category, Product, Customer, Transaction, Elasticity, Recommendation


def _seed_basic_data(db):
    """Insert minimal test data."""
    territory = Territory(region="Norte", state="Nuevo León", municipality="Monterrey")
    db.add(territory)
    db.flush()

    customer = Customer(name="Test Distributor", type="distribuidor", segment="oro", territory_id=territory.id)
    db.add(customer)
    db.flush()

    category = Category(name="Tableros")
    db.add(category)
    db.flush()

    product = Product(sku_code="TB-001", name="Tabla Roca Regular 1/2\"", category_id=category.id)
    db.add(product)
    db.flush()

    transaction = Transaction(
        date=date(2024, 6, 1),
        customer_id=customer.id,
        product_id=product.id,
        territory_id=territory.id,
        volume=100.0,
        list_price=250.0,
        discount=20.0,
        rebate=10.0,
        net_price=220.0,
        revenue=22000.0,
    )
    db.add(transaction)

    elasticity = Elasticity(
        type="historical",
        coefficient=-1.2,
        confidence_level="high",
        p_value=0.01,
        r_squared=0.85,
        node_type="sku",
        node_id=product.id,
        period_start=date(2024, 1, 1),
        period_end=date(2025, 12, 31),
        sample_size=500,
    )
    db.add(elasticity)

    recommendation = Recommendation(
        product_id=product.id,
        segment="oro",
        territory_id=territory.id,
        action_type="increase",
        suggested_change_pct=5.0,
        expected_impact_revenue=100000.0,
        expected_impact_volume=-500.0,
        expected_impact_margin=30000.0,
        confidence_level="high",
        rationale={"elasticity": -1.2},
    )
    db.add(recommendation)
    db.commit()

    return {
        "territory": territory,
        "customer": customer,
        "category": category,
        "product": product,
    }


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_filters_segments(client):
    response = client.get("/api/filters/segments")
    assert response.status_code == 200
    assert response.json() == ["oro", "plata", "bronce"]


def test_filters_regions(client, db):
    _seed_basic_data(db)
    response = client.get("/api/filters/regions")
    assert response.status_code == 200
    assert "Norte" in response.json()


def test_filters_categories(client, db):
    _seed_basic_data(db)
    response = client.get("/api/filters/categories")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]["name"] == "Tableros"


def test_overview(client, db):
    _seed_basic_data(db)
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_revenue" in data
    assert "total_volume" in data


def test_history_elasticities(client, db):
    _seed_basic_data(db)
    response = client.get("/api/history/elasticities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["coefficient"] == -1.2


def test_recommendations(client, db):
    _seed_basic_data(db)
    response = client.get("/api/recommendations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["action_type"] == "increase"
    assert data[0]["product_name"] == "Tabla Roca Regular 1/2\""


def test_recommendations_summary(client, db):
    _seed_basic_data(db)
    response = client.get("/api/recommendations/summary")
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_quick_simulate(client, db):
    _seed_basic_data(db)
    response = client.post("/api/simulator/quick-simulate?product_id=1&price_change_pct=5")
    assert response.status_code == 200
    data = response.json()
    assert "curve" in data
    assert len(data["curve"]) == 21  # -20 to +20 in steps of 2


def test_passthrough_by_segment(client, db):
    _seed_basic_data(db)
    response = client.get("/api/passthrough/by-segment")
    assert response.status_code == 200


def test_export_csv(client, db):
    _seed_basic_data(db)
    response = client.get("/api/export/recommendations-csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]


def test_export_executive_summary(client, db):
    _seed_basic_data(db)
    response = client.get("/api/export/executive-summary")
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "top_recommendations" in data
