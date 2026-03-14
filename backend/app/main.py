from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import overview, history, simulator, recommendations, passthrough, export

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router, prefix="/api", tags=["Overview"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(simulator.router, prefix="/api", tags=["Simulator"])
app.include_router(recommendations.router, prefix="/api", tags=["Recommendations"])
app.include_router(passthrough.router, prefix="/api", tags=["Passthrough"])
app.include_router(export.router, prefix="/api", tags=["Export"])


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/filters/segments")
def get_segments():
    return ["oro", "plata", "bronce"]


@app.get("/api/filters/regions")
def get_regions(db=None):
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app.models import Territory
        regions = db.query(Territory.region).distinct().all()
        return [r[0] for r in regions]
    finally:
        db.close()


@app.get("/api/filters/categories")
def get_categories():
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app.models import Category
        cats = db.query(Category).all()
        return [{"id": c.id, "name": c.name} for c in cats]
    finally:
        db.close()


@app.get("/api/filters/territories")
def get_territories():
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app.models import Territory
        territories = db.query(Territory).all()
        return [{"id": t.id, "region": t.region, "state": t.state, "municipality": t.municipality} for t in territories]
    finally:
        db.close()


@app.get("/api/filters/customers")
def get_customers(segment: str | None = None):
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        from app.models import Customer
        q = db.query(Customer)
        if segment:
            q = q.filter(Customer.segment == segment)
        customers = q.all()
        return [{"id": c.id, "name": c.name, "segment": c.segment} for c in customers]
    finally:
        db.close()
