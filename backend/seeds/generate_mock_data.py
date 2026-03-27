"""
Generate realistic mock data for USG Pricing Decision Engine MVP.
86 SKUs, 10 categories, 75 distributors (real), 29 territories, 24 months of sell-in.
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

# --- Territory Data (29 states) ---
TERRITORIES = [
    ("Centro", "Aguascalientes", "Aguascalientes"),
    ("Noroeste", "Baja California", "Tijuana"),
    ("Noroeste", "Baja California Sur", "La Paz"),
    ("Centro", "CDMX", "Benito Juárez"),
    ("Sureste", "Campeche", "Campeche"),
    ("Sureste", "Chiapas", "Tuxtla Gutiérrez"),
    ("Norte", "Chihuahua", "Chihuahua"),
    ("Norte", "Coahuila", "Saltillo"),
    ("Occidente", "Colima", "Colima"),
    ("Norte", "Durango", "Durango"),
    ("Centro", "Estado de México", "Naucalpan"),
    ("Bajío", "Guanajuato", "León"),
    ("Sur", "Guerrero", "Acapulco"),
    ("Occidente", "Jalisco", "Guadalajara"),
    ("Occidente", "Michoacán", "Morelia"),
    ("Centro", "Morelos", "Cuernavaca"),
    ("Occidente", "Nayarit", "Tepic"),
    ("Norte", "Nuevo León", "Monterrey"),
    ("Sur", "Oaxaca", "Oaxaca de Juárez"),
    ("Centro", "Puebla", "Puebla"),
    ("Bajío", "Querétaro", "Querétaro"),
    ("Sureste", "Quintana Roo", "Cancún"),
    ("Centro", "San Luis Potosí", "San Luis Potosí"),
    ("Noroeste", "Sinaloa", "Culiacán"),
    ("Noroeste", "Sonora", "Hermosillo"),
    ("Sureste", "Tabasco", "Villahermosa"),
    ("Norte", "Tamaulipas", "Reynosa"),
    ("Sureste", "Veracruz", "Veracruz"),
    ("Sureste", "Yucatán", "Mérida"),
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

# 75 real distributors from docs/distribuidores_por_estado_corregido.xlsx
# Each entry: (name, {state: branch_count, ...})
REAL_DISTRIBUTORS = [
    ("VECTOR", {"Baja California": 9, "Baja California Sur": 5, "Chihuahua": 2, "Sonora": 3}),
    ("IMAC", {"CDMX": 2, "Oaxaca": 3, "Puebla": 1, "Veracruz": 10}),
    ("CONSTRUDECO", {"CDMX": 3, "Estado de México": 10, "Morelos": 2}),
    ("HAZLO KONTABLA", {"Colima": 2, "Guanajuato": 2, "Jalisco": 10, "Querétaro": 1}),
    ("OBREK", {"Quintana Roo": 8, "Yucatán": 5}),
    ("CONSTRUCENTRO", {"CDMX": 5, "Estado de México": 2, "Guanajuato": 1, "Querétaro": 1, "Quintana Roo": 3}),
    ("GRUPO NAPRESA", {"Jalisco": 7, "Nayarit": 1, "Sinaloa": 3}),
    ("COMERCIAL MAYORISTA HERA", {"Estado de México": 8}),
    ("TIENDAS CIASA", {"CDMX": 1, "Jalisco": 2, "Michoacán": 1, "Nayarit": 3, "Sinaloa": 1}),
    ("CONSTRUTABLA", {"Chiapas": 1, "Oaxaca": 6}),
    ("DAEMSA", {"Puebla": 7}),
    ("MUROFAST", {"Baja California": 7}),
    ("ALTA MATERIALES", {"Chihuahua": 6}),
    ("ISOTERMIKA", {"Nuevo León": 5}),
    ("MADERERA ELIZONDO", {"Tamaulipas": 5}),
    ("MATERIALES ROJAS", {"Baja California": 4, "Baja California Sur": 1}),
    ("PLAFONES E INTERIORES", {"Nuevo León": 5}),
    ("FERRECONSTRU", {"Campeche": 4}),
    ("CENTRO DE PREFABRICADOS", {"Morelos": 3}),
    ("DUQUE CONSTRUMERCADO", {"San Luis Potosí": 3}),
    ("DYC 21", {"Tabasco": 3}),
    ("EXPO TILE", {"Sonora": 3}),
    ("MAS CONSTRUCCIÓN", {"Nuevo León": 3}),
    ("MATERIALES DEL NORTE", {"Chihuahua": 3}),
    ("PICSA", {"Baja California": 3}),
    ("ADEMA DE MÉXICO", {"CDMX": 2}),
    ("FERRECENTRO DE NUEVA ROSITA", {"Coahuila": 2}),
    ("IDYCSA", {"Coahuila": 1, "Nuevo León": 1}),
    ("IMPULSORA DE LA VIVIENDA MODERNA", {"Chihuahua": 2}),
    ("Materiales Mi Casa", {"Tamaulipas": 2}),
    ("PLAFOMATE", {"CDMX": 1, "Estado de México": 1}),
    ("PLAFONES E IMPERMEABILIZANTES DE SALTILLO", {"Coahuila": 2}),
    ("RCH", {"Nuevo León": 2}),
    ("SUKASA", {"Tamaulipas": 2}),
    ("ACEROMAX", {"Tamaulipas": 1}),
    ("ARLA", {"Baja California": 1}),
    ("CODIPAY", {"CDMX": 1}),
    ("COGUTSA", {"Querétaro": 1}),
    ("CONSTRUCASA DEL SUR", {"Chiapas": 1}),
    ("CONSTRUCCION LIGERA DE MICHOACAN", {"Michoacán": 1}),
    ("CORRUGADOS DEL CENTRO", {"Coahuila": 1}),
    ("DIMACO", {"Quintana Roo": 1}),
    ("DIZA I2", {"Querétaro": 1}),
    ("GASA TABLAROCA", {"Aguascalientes": 1}),
    ("GM MATERIALES", {"Estado de México": 1}),
    ("ICO INNOVACION EN CONSTRUCCION", {"San Luis Potosí": 1}),
    ("INTEGRACION DE ESPACIO CORPORATIVOS", {"CDMX": 1}),
    ("JakS Home Center", {"Nuevo León": 1}),
    ("LA NUEVA ERA FERRETERIA", {"Chihuahua": 1}),
    ("M + P MODULARES", {"CDMX": 1}),
    ("MATERIALES ORTIZ", {"San Luis Potosí": 1}),
    ("MULTIPLAFONES", {"Sinaloa": 1}),
    ("MUROS Y PLAFONES DE NAYARIT", {"Nayarit": 1}),
    ("MUROSOL", {"Guanajuato": 1}),
    ("PEBER", {"Michoacán": 1}),
    ("PROCASA", {"Veracruz": 1}),
    ("PROMETAL", {"Baja California": 1}),
    ("PRONTOPANEL", {"Michoacán": 1}),
    ("RIGA DE MEXICO", {"Guerrero": 1}),
    ("SOLET", {"Durango": 1}),
    ("Sucursal Altamira", {"Tamaulipas": 1}),
    ("Sucursal Camargo", {"Tamaulipas": 1}),
    ("Sucursal Cedis", {"Chihuahua": 1}),
    ("Sucursal Centro Constitución", {"Baja California Sur": 1}),
    ("Sucursal Constitución", {"Chihuahua": 1}),
    ("Sucursal El Marques", {"Querétaro": 1}),
    ("Sucursal Hidalgo Ote", {"Coahuila": 1}),
    ("Sucursal Nueva España", {"Chihuahua": 1}),
    ("Sucursal Orizaba", {"Veracruz": 1}),
    ("Sucursal Revolución", {"Coahuila": 1}),
    ("Sucursal San Pedro", {"CDMX": 1}),
    ("Sucursal Sn Pedro De Los Pinos", {"CDMX": 1}),
    ("Sucursal Tecnológico", {"Chihuahua": 1}),
    ("Sucursal Valle", {"Chihuahua": 1}),
    ("TAQUETES Y TABLAROCA USG", {"Guerrero": 1}),
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
    # Build state -> territory lookup
    state_to_territory = {t.state: t for t in territories}

    customers = []
    for name, branches_by_state in REAL_DISTRIBUTORS:
        segment = random.choices(SEGMENTS, SEGMENT_WEIGHTS)[0]
        # Assign customer to the territory of their state with most branches
        primary_state = max(branches_by_state, key=branches_by_state.get)
        territory = state_to_territory[primary_state]
        c = Customer(name=name, type="distribuidor", segment=segment, territory_id=territory.id)
        db.add(c)
        customers.append((c, branches_by_state))
    db.flush()

    # Create branches per customer based on real Excel data
    branch_count = 0
    for c, branches_by_state in customers:
        for state, count in branches_by_state.items():
            t = state_to_territory[state]
            for j in range(count):
                branch = Branch(
                    customer_id=c.id,
                    name=f"{c.name} - {state} #{j+1}" if count > 1 else f"{c.name} - {state}",
                    municipality=t.municipality,
                    state=t.state,
                )
                db.add(branch)
                branch_count += 1
    db.flush()
    print(f"  {len(customers)} customers, {branch_count} branches created.")
    return [c for c, _ in customers]


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

    # By category — most categories get high confidence (80% high, 20% medium)
    for cat in categories:
        coeff = round(random.uniform(-2.5, -0.3), 3)
        p_val = round(random.uniform(0.001, 0.04), 4)
        r_sq = round(random.uniform(0.7, 0.95), 3)
        conf = "high" if random.random() < 0.8 else "medium"
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
