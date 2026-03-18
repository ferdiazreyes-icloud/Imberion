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

## Current State

- All 5 modules implemented (Overview, History, Simulator, Recommendations, Passthrough)
- Backend tests passing (12/12)
- Frontend builds successfully
- Docker setup ready for Railway deployment
- Mock data generator creates realistic USG data
