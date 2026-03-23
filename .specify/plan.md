# Plan — USG Pricing Decision Engine (MVP)

## Architecture

Monorepo with 3 layers:
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS 4 + Recharts 3 + Zustand + TanStack Query
- **Backend**: Python + FastAPI + SQLAlchemy 2 + Pydantic 2
- **Database**: PostgreSQL 16

## Deployment

- **Backend**: Railway (Docker, Python 3.12)
- **Frontend**: Railway (Docker, Node 20, standalone output)
- **Database**: Railway PostgreSQL addon

## Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Monorepo | Yes | Single team, coordinated deploy |
| Elasticity model | Log-log regression (scipy) | Standard in price elasticity, interpretable |
| Mock data | Python script generator | Reproducible, realistic, configurable |
| State management | Zustand | Lightweight, no boilerplate |
| Data fetching | TanStack Query | Cache, refetch, loading states |
| Charts | Recharts 3 | React-native, declarative, good TS support |

## API Design

REST API with global filter parameters:
- `segment`, `territory_id`, `region`, `category_id`, `product_id`
- `period_start`, `period_end`, `confidence_level`

All endpoints under `/api/` prefix with OpenAPI auto-documentation at `/docs`.

## Production URLs

- **Frontend**: https://usg-frontend-production.up.railway.app
- **Backend**: https://usg-backend-production.up.railway.app
- **API Docs**: https://usg-backend-production.up.railway.app/docs

## Current State

- All 5 modules implemented and deployed to Railway (Overview, History, Simulator, Recommendations, Passthrough)
- Backend: 27 endpoints, 38 unit tests passing (pytest + SQLite in-memory)
- Frontend: builds successfully, deployed with standalone output
- E2E tests: 32 Playwright tests covering all 5 modules against production
- Mock data: 86 SKUs, 75 real distributors, 29 territories, 24 months of transactions seeded
- Auto table creation on startup + `/api/admin/seed` endpoint for remote seeding
- Visual refinement v2: USG brand colors (#A6192E), Inter font, Tableau chart palette, dark/light mode, animations
- Simulator quick-simulate fixed: POST→GET method alignment, safe fallback for empty data
- Analytics engine integrated: `predict_scenario()`, `confidence_scorer()`, `suggest_improvements()`, `optimal_price_search()`
- Enhanced simulator: 5 tabs — Simular (manual), Comparar, Mejor Escenario, Cargar Excel, Optimizar
- Multi-select ComboBox with portal dropdown for all filters (segment, territory, category, distributor)
- 75 real distributors with state-level branch mapping (from Excel)
- Distributor filter cascades from territory selection (via Branch.state join)
- All filters support comma-separated multi-values (segment, territory_id, category_id, customer_id)
- Confidence filter moved to History module only
- Scenario CSV export endpoint + button in simulator UI
- Excel-based scenario creation: upload price plan, evaluate with elasticities, get improvement suggestions
- Auto-optimization: maximize margin/revenue/volume per product with user-defined price range

## Pending Improvements

- Authentication (currently open access)
- PDF/Excel export (functional — CSV works, Excel template available)
- Bundle/combo elasticities (requires new ADM cycle — new data models, cross-elasticity analytics)
- CI/CD pipeline (GitHub Actions)
- Optimal Rebates module by distributor (pending client validation)
- AI conversational agent for data queries
