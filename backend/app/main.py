from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.api import overview, history, simulator, recommendations, passthrough, export, agent
from app.models import Territory, Category, Customer, Branch


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (safe — does nothing if they exist)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

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
app.include_router(agent.router, prefix="/api", tags=["Agent"])


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/api/filters/segments")
def get_segments():
    return ["oro", "plata", "bronce"]


@app.get("/api/filters/regions")
def get_regions(db: Session = Depends(get_db)):
    regions = db.query(Territory.region).distinct().all()
    return [r[0] for r in regions]


@app.get("/api/filters/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    return [{"id": c.id, "name": c.name} for c in cats]


@app.get("/api/filters/territories")
def get_territories(db: Session = Depends(get_db)):
    territories = db.query(Territory).all()
    return [{"id": t.id, "region": t.region, "state": t.state, "municipality": t.municipality} for t in territories]


@app.get("/api/filters/customers")
def get_customers(
    segment: Optional[str] = None,
    territory_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Customer)
    if segment:
        segments = [s.strip() for s in segment.split(",") if s.strip()]
        q = q.filter(Customer.segment.in_(segments)) if len(segments) > 1 else q.filter(Customer.segment == segments[0])
    if territory_id:
        tids = [int(t) for t in territory_id.split(",") if t.strip()]
        states = [r.state for r in db.query(Territory.state).filter(Territory.id.in_(tids)).all()]
        if states:
            q = q.join(Branch).filter(Branch.state.in_(states)).distinct()
    customers = q.all()
    return [{"id": c.id, "name": c.name, "segment": c.segment} for c in customers]


@app.post("/api/admin/seed", tags=["Admin"])
def seed_database(db: Session = Depends(get_db)):
    """Populate database with mock data. Safe to call multiple times — skips if data exists."""
    existing = db.query(Territory).first()
    if existing:
        return {"status": "skipped", "message": "Database already has data"}

    from seeds.generate_mock_data import seed_all
    seed_all(db)
    return {"status": "ok", "message": "Mock data generated successfully"}
