"""
Generate realistic mock data for USG Pricing Decision Engine MVP.
86 SKUs, 10 categories, 25 distributors, 8 territories, 24 months of sell-in.
"""

import json
import random
import sys
import os
from datetime import date, timedelta

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import engine, SessionLocal
from app.models import (
    Territory, Customer, Branch, Category, Product, Transaction,
    Elasticity, Recommendation,
)
from app.database import Base

random.seed(42)
np.random.seed(42)

# --- Territory Data ---
TERRITORIES = [
    ("Norte", "Nuevo León", "Monterrey"),
    ("Norte", "Chihuahua", "Chihuahua"),
    ("Norte", "Sonora", "Hermosillo"),
    ("Centro", "CDMX", "Benito Juárez"),
    ("Centro", "Estado de México", "Naucalpan"),
    ("Bajío", "Jalisco", "Guadalajara"),
    ("Bajío", "Guanajuato", "León"),
    ("Sur", "Yucatán", "Mérida"),
    ("Sur", "Veracruz", "Veracruz"),
    ("Occidente", "Sinaloa", "Culiacán"),
]

# --- Category & SKU Data ---
CATEGORIES = {
    "Tableros": [
        ("TB-001", "Tabla Roca Regular 1/2\""),
        ("TB-002", "Tabla Roca Regular 5/8\""),
        ("TB-003", "Tabla Roca Resistente Humedad 1/2\""),
        ("TB-004", "Tabla Roca Resistente Humedad 5/8\""),
        ("TB-005", "Tabla Roca Resistente Fuego 5/8\""),
        ("TB-006", "Tabla Roca Ultralight 1/2\""),
        ("TB-007", "Tabla Roca Ultralight 5/8\""),
        ("TB-008", "Tabla Roca Fiberock 1/2\""),
        ("TB-009", "Tabla Roca Mold Tough 1/2\""),
        ("TB-010", "Tabla Roca Exterior 5/8\""),
        ("TB-011", "Tabla Roca Durock 1/2\""),
    ],
    "Plafones": [
        ("PL-001", "Plafón Radar 2x2"),
        ("PL-002", "Plafón Radar 2x4"),
        ("PL-003", "Plafón Eclipse 2x2"),
        ("PL-004", "PL Frost 2x2"),
        ("PL-005", "Plafón Sandrift 2x2"),
        ("PL-006", "Plafón Sahara 2x2"),
        ("PL-007", "Plafón Cortega 2x2"),
        ("PL-008", "Plafón Fine Fissured 2x2"),
        ("PL-009", "Plafón Fine Fissured 2x4"),
        ("PL-010", "Plafón Mars 2x2"),
        ("PL-011", "Plafón Optima 2x2"),
        ("PL-012", "Plafón Ultima 2x2"),
        ("PL-013", "Plafón Ultima 2x4"),
        ("PL-014", "Plafón Clean Room 2x2"),
        ("PL-015", "Plafón Cirrus 2x2"),
        ("PL-016", "Plafón Dune 2x2"),
        ("PL-017", "Plafón Tundra 2x2"),
    ],
    "Suspensiones": [
        ("SU-001", "Suspensión Principal DX 12ft"),
        ("SU-002", "Suspensión Principal DX 8ft"),
        ("SU-003", "Suspensión Cruz 4ft"),
        ("SU-004", "Suspensión Cruz 2ft"),
        ("SU-005", "Ángulo de Pared 10ft"),
        ("SU-006", "Suspensión Principal DXL 12ft"),
        ("SU-007", "Alambre de Suspensión 12ga"),
        ("SU-008", "Clip de Suspensión"),
        ("SU-009", "Ángulo de Pared Sísmica"),
        ("SU-010", "Suspensión DXT 12ft"),
        ("SU-011", "Poste Metálico Suspensión"),
    ],
    "Adhesivos": [
        ("AD-001", "Compuesto Listo para Usar 28kg"),
        ("AD-002", "Compuesto Listo para Usar 17kg"),
        ("AD-003", "Compuesto Polvo 20min 11kg"),
        ("AD-004", "Compuesto Polvo 45min 11kg"),
        ("AD-005", "Compuesto Polvo 90min 11kg"),
        ("AD-006", "Adhesivo Durock Base"),
        ("AD-007", "Compuesto Ligero 14kg"),
        ("AD-008", "Sellador Acústico 828ml"),
        ("AD-009", "Pasta Textura 28kg"),
    ],
    "Perfiles Metálicos": [
        ("PM-001", "Canal Estándar 3-5/8\" x 10ft"),
        ("PM-002", "Canal Estándar 2-1/2\" x 10ft"),
        ("PM-003", "Poste Estándar 3-5/8\" x 10ft"),
        ("PM-004", "Poste Estándar 2-1/2\" x 10ft"),
        ("PM-005", "Canal Cal 20 3-5/8\" x 10ft"),
        ("PM-006", "Poste Cal 20 3-5/8\" x 10ft"),
        ("PM-007", "Canal Furring 7/8\" x 12ft"),
        ("PM-008", "Resilient Channel 12ft"),
        ("PM-009", "Ángulo Esquinero 8ft"),
        ("PM-010", "Z-Furring Channel 10ft"),
        ("PM-011", "Canal J Trim 10ft"),
    ],
    "Yesos": [
        ("YE-001", "Yeso Construcción 40kg"),
        ("YE-002", "Yeso Proyectable 30kg"),
        ("YE-003", "Yeso Acabado 20kg"),
        ("YE-004", "Plaster of Paris 22kg"),
    ],
    "Accesorios": [
        ("AC-001", "Tornillo Punta Broca 6x1\""),
        ("AC-002", "Tornillo Punta Broca 6x1-1/4\""),
        ("AC-003", "Tornillo Punta Fina 6x1-1/4\""),
        ("AC-004", "Cinta Papel 75m"),
        ("AC-005", "Cinta Malla 90m"),
        ("AC-006", "Esquinero Metálico 8ft"),
        ("AC-007", "Esquinero Flexible 30m"),
        ("AC-008", "Esquinero No Coat 8ft"),
        ("AC-009", "Ancla Toggle Bolt 1/8\""),
        ("AC-010", "Ancla EZ Ancor"),
        ("AC-011", "Clavo Concreto 1\""),
        ("AC-012", "Grapas Cuadro 1/2\""),
        ("AC-013", "Pasador Metálico 3\""),
        ("AC-014", "Remache Pop 1/8\""),
    ],
    "Cintas": [
        ("CI-001", "Cinta Durock 2\" x 150ft"),
        ("CI-002", "Cinta FibaTape 2\" x 300ft"),
    ],
    "Mallas de Refuerzo": [
        ("MA-001", "Malla Fibra Vidrio 4\" x 150ft"),
    ],
    "Membranas Impermeables": [
        ("ME-001", "Membrana Durock 5\" x 50ft"),
    ],
}

DISTRIBUTOR_NAMES = [
    "Distribuidora del Norte SA", "Materiales Monterrey", "Grupo Constructor Chihuahua",
    "Plafones y Sistemas CDMX", "Distribuciones del Centro", "Materiales Guadalajara SA",
    "Bajío Construcción", "Distribuidora Sureste", "Materiales del Golfo",
    "Placo Distribuciones", "Nacional de Materiales", "Grupo Tablaroca México",
    "Construrama Afiliado Norte", "Dismat del Pacífico", "Acabados y Plafones SA",
    "Distribuidora León Plus", "Materiales Premium Mérida", "Construcentro Veracruz",
    "Ferremateriales Sinaloa", "Grupo Yeso Nacional", "Distribuidora Hermosillo",
    "Plafones Express CDMX", "Materiales y Acabados Naucalpan",
    "Proveedora de Construcción SA", "Red Nacional Distribuidores",
]

SEGMENTS = ["oro", "plata", "bronce"]
SEGMENT_WEIGHTS = [0.2, 0.35, 0.45]  # fewer gold, more bronze


def create_tables():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    print("Tables created.")


def seed_territories(db):
    territories = []
    for region, state, municipality in TERRITORIES:
        t = Territory(region=region, state=state, municipality=municipality)
        db.add(t)
        territories.append(t)
    db.flush()
    print(f"  {len(territories)} territories created.")
    return territories


def seed_customers(db, territories):
    customers = []
    for i, name in enumerate(DISTRIBUTOR_NAMES):
        segment = random.choices(SEGMENTS, SEGMENT_WEIGHTS)[0]
        territory = territories[i % len(territories)]
        c = Customer(name=name, type="distribuidor", segment=segment, territory_id=territory.id)
        db.add(c)
        customers.append(c)
    db.flush()

    # Create 1-3 branches per customer
    for c in customers:
        n_branches = random.randint(1, 3)
        t = next(t for t in territories if t.id == c.territory_id)
        for j in range(n_branches):
            branch = Branch(
                customer_id=c.id,
                name=f"{c.name} - Sucursal {j+1}",
                municipality=t.municipality,
                state=t.state,
            )
            db.add(branch)
    db.flush()
    print(f"  {len(customers)} customers created.")
    return customers


def seed_categories_and_products(db):
    categories = []
    products = []
    for cat_name, skus in CATEGORIES.items():
        cat = Category(name=cat_name)
        db.add(cat)
        db.flush()
        categories.append(cat)
        for sku_code, sku_name in skus:
            p = Product(sku_code=sku_code, name=sku_name, category_id=cat.id)
            db.add(p)
            products.append(p)
    db.flush()
    print(f"  {len(categories)} categories, {len(products)} products created.")
    return categories, products


def generate_base_price(category_name: str) -> float:
    """Generate realistic base prices by category (MXN)."""
    price_ranges = {
        "Tableros": (180, 650),
        "Plafones": (120, 480),
        "Suspensiones": (45, 220),
        "Adhesivos": (90, 380),
        "Perfiles Metálicos": (60, 250),
        "Yesos": (80, 200),
        "Accesorios": (25, 150),
        "Cintas": (40, 120),
        "Mallas de Refuerzo": (50, 130),
        "Membranas Impermeables": (180, 350),
    }
    lo, hi = price_ranges.get(category_name, (50, 300))
    return round(random.uniform(lo, hi), 2)


def seed_transactions(db, customers, products, territories, categories):
    """Generate 24 months of sell-in transactions."""
    start_date = date(2024, 1, 1)
    end_date = date(2025, 12, 31)
    cat_map = {c.id: c.name for c in categories}

    # Pre-generate base prices per product
    base_prices = {}
    for p in products:
        base_prices[p.id] = generate_base_price(cat_map[p.category_id])

    # Segment multipliers for volume
    segment_volume = {"oro": 1.5, "plata": 1.0, "bronce": 0.6}
    segment_discount = {"oro": 0.12, "plata": 0.07, "bronce": 0.03}
    segment_rebate = {"oro": 0.08, "plata": 0.04, "bronce": 0.01}

    transactions = []
    current = start_date
    batch_count = 0

    while current <= end_date:
        month_factor = 1.0 + 0.05 * np.sin(2 * np.pi * current.month / 12)  # seasonality

        for customer in customers:
            # Each customer buys a subset of products each month
            n_products = random.randint(15, 50)
            bought_products = random.sample(products, min(n_products, len(products)))

            for product in bought_products:
                base_price = base_prices[product.id]
                # Price trends: slight increase over time
                months_elapsed = (current.year - 2024) * 12 + current.month - 1
                price_drift = 1 + 0.003 * months_elapsed + random.gauss(0, 0.01)
                list_price = round(base_price * price_drift, 2)

                seg = customer.segment
                discount = round(list_price * segment_discount[seg] * random.uniform(0.8, 1.2), 2)
                rebate = round(list_price * segment_rebate[seg] * random.uniform(0.7, 1.3), 2)
                net_price = round(list_price - discount - rebate, 2)

                base_vol = random.uniform(10, 200) * segment_volume[seg] * month_factor
                # Elasticity effect: higher price -> lower volume
                price_ratio = net_price / (base_price * 0.85)
                elasticity_effect = price_ratio ** (-1.2 + random.gauss(0, 0.3))
                volume = round(max(1, base_vol * elasticity_effect), 1)
                revenue = round(net_price * volume, 2)

                t = Transaction(
                    date=current,
                    customer_id=customer.id,
                    product_id=product.id,
                    territory_id=customer.territory_id,
                    volume=volume,
                    list_price=list_price,
                    discount=discount,
                    rebate=rebate,
                    net_price=net_price,
                    revenue=revenue,
                )
                transactions.append(t)
                batch_count += 1

                if batch_count >= 5000:
                    db.bulk_save_objects(transactions)
                    transactions = []
                    batch_count = 0

        # Move to next month (first day)
        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)

    if transactions:
        db.bulk_save_objects(transactions)

    db.flush()
    count = db.query(Transaction).count()
    print(f"  {count} transactions created (24 months).")


def seed_elasticities(db, products, categories, territories):
    """Pre-compute mock elasticities for various nodes."""
    elasticities = []
    period_start = date(2024, 1, 1)
    period_end = date(2025, 12, 31)

    # By category
    for cat in categories:
        coeff = round(random.uniform(-2.5, -0.3), 3)
        p_val = round(random.uniform(0.001, 0.15), 4)
        r_sq = round(random.uniform(0.4, 0.95), 3)
        conf = "high" if p_val < 0.05 and r_sq > 0.7 else ("medium" if p_val < 0.1 else "low")
        elasticities.append(Elasticity(
            type="historical", coefficient=coeff, confidence_level=conf,
            p_value=p_val, r_squared=r_sq, node_type="category", node_id=cat.id,
            period_start=period_start, period_end=period_end,
            sample_size=random.randint(200, 2000),
        ))

    # By product
    for prod in products:
        coeff = round(random.uniform(-3.0, -0.2), 3)
        p_val = round(random.uniform(0.001, 0.25), 4)
        r_sq = round(random.uniform(0.3, 0.95), 3)
        conf = "high" if p_val < 0.05 and r_sq > 0.7 else ("medium" if p_val < 0.1 else "low")
        for etype in ["historical", "predicted"]:
            elasticities.append(Elasticity(
                type=etype,
                coefficient=coeff + (random.gauss(0, 0.15) if etype == "predicted" else 0),
                confidence_level=conf,
                p_value=p_val, r_squared=r_sq, node_type="sku", node_id=prod.id,
                period_start=period_start, period_end=period_end,
                sample_size=random.randint(50, 800),
            ))

    # By segment
    for i, seg in enumerate(SEGMENTS):
        coeff = round(random.uniform(-2.0, -0.5), 3)
        p_val = round(random.uniform(0.005, 0.08), 4)
        r_sq = round(random.uniform(0.55, 0.92), 3)
        conf = "high" if p_val < 0.05 and r_sq > 0.7 else "medium"
        for etype in ["historical", "predicted"]:
            elasticities.append(Elasticity(
                type=etype, coefficient=coeff, confidence_level=conf,
                p_value=p_val, r_squared=r_sq, node_type="segment", node_id=i + 1,
                period_start=period_start, period_end=period_end,
                sample_size=random.randint(500, 3000),
            ))

    # By territory
    for t in territories:
        coeff = round(random.uniform(-2.2, -0.4), 3)
        p_val = round(random.uniform(0.005, 0.12), 4)
        r_sq = round(random.uniform(0.45, 0.90), 3)
        conf = "high" if p_val < 0.05 and r_sq > 0.7 else ("medium" if p_val < 0.1 else "low")
        elasticities.append(Elasticity(
            type="historical", coefficient=coeff, confidence_level=conf,
            p_value=p_val, r_squared=r_sq, node_type="territory", node_id=t.id,
            period_start=period_start, period_end=period_end,
            sample_size=random.randint(300, 2000),
        ))

    db.bulk_save_objects(elasticities)
    db.flush()
    print(f"  {len(elasticities)} elasticities created.")


def seed_recommendations(db, products, territories):
    """Generate recommendations for each product/segment combination."""
    recs = []
    for prod in products:
        for seg in SEGMENTS:
            territory = random.choice(territories)
            coeff = random.uniform(-2.5, -0.3)
            abs_coeff = abs(coeff)

            if abs_coeff < 0.8:
                action = "increase"
                change = round(random.uniform(2, 8), 1)
            elif abs_coeff > 1.8:
                action = "protect"
                change = round(random.uniform(-2, 0), 1)
            else:
                action = random.choice(["increase", "protect", "decrease"])
                change = round(random.uniform(-3, 5), 1)

            confidence = random.choice(["high", "medium", "low"])
            margin_impact = round(change * random.uniform(0.5, 1.5), 2)

            recs.append(Recommendation(
                product_id=prod.id,
                segment=seg,
                territory_id=territory.id,
                action_type=action,
                suggested_change_pct=change,
                expected_impact_revenue=round(change * random.uniform(50000, 200000), 2),
                expected_impact_volume=round(change * random.uniform(-0.8, -0.2) * 1000, 2),
                expected_impact_margin=round(margin_impact * 10000, 2),
                confidence_level=confidence,
                rationale={
                    "elasticity": round(coeff, 3),
                    "historical_sensitivity": random.choice(["low", "medium", "high"]),
                    "margin_headroom": round(random.uniform(5, 25), 1),
                    "volume_risk": random.choice(["low", "medium", "high"]),
                },
            ))

    db.bulk_save_objects(recs)
    db.flush()
    print(f"  {len(recs)} recommendations created.")


def seed_all(db):
    """Seed all mock data using an existing database session."""
    territories = seed_territories(db)
    customers = seed_customers(db, territories)
    categories, products = seed_categories_and_products(db)
    seed_transactions(db, customers, products, territories, categories)
    seed_elasticities(db, products, categories, territories)
    seed_recommendations(db, products, territories)
    db.commit()
    print("\nDone! All mock data generated successfully.")


def main():
    print("Creating tables...")
    create_tables()

    print("Seeding data...")
    db = SessionLocal()
    try:
        seed_all(db)
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
