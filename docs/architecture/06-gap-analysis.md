# Gap Analysis — Design vs Implementation

## USG Pricing Decision Engine (MVP)

**Date:** 2026-03-18
**Baseline:** Architecture docs (Phases 00–05) vs current deployed state

---

## 1. Summary

The MVP is approximately 80% aligned with the original architecture documents. All 5 core modules are functional and deployed. The gaps are concentrated in three areas: the analytics engine integration, export formats, and authentication.

---

## 2. Work Package Status

| WP | Name | Status | Notes |
|----|------|--------|-------|
| WP-01 | Project setup (monorepo, Docker, CI) | Done | Docker + docker-compose working. No CI/CD pipeline (GitHub Actions) yet |
| WP-02 | Data model + migrations + mock seeds | Done | 86 SKUs, 25 distributors, 10 territories, 24 months. Auto-create tables instead of Alembic |
| WP-03 | Base API (CRUD + filters) | Done | 19 endpoints with global filters |
| WP-04 | Elasticity engine (historical + predictive) | **Partial** | Code exists in `app/analytics/` but is NOT wired to API endpoints |
| WP-05 | Layout + Navigation + Global filters | Done | Sidebar + 5 modules + filter params |
| WP-06 | Overview module (Dashboard KPIs) | Done | 6 KPIs + drill-down by category, segment, territory |
| WP-07 | History module (Historical elasticities) | Done | Elasticities + trends + scatter plot |
| WP-08 | Simulator module (Scenarios) | Done | Scenario creation + price-volume-margin curves + save/compare |
| WP-09 | Recommendations module | Done | By segment/territory/SKU + CSV export |
| WP-10 | Passthrough module (Rebates) | Done | By segment + by category + price component trends |
| WP-11 | Confidence module | **Partial** | Confidence badges displayed, but `confidence_scorer.py` not integrated |
| WP-12 | Export (PDF/Excel) | **Partial** | CSV and executive summary JSON available. PDF and Excel not implemented |
| WP-13 | Production deploy | Done | Railway (frontend + backend + PostgreSQL). Design originally specified Vercel for frontend |
| WP-14 | Testing + QA | Done | 12 pytest unit tests + 28 Playwright E2E tests passing |

---

## 3. Detailed Gap Descriptions

### GAP-01: Analytics Engine Not Integrated

**Design reference:** Phase C (Information Systems Architecture), Section 2.1 — `app/analytics/` directory with `elasticity_model.py`, `prediction_model.py`, `confidence_scorer.py`

**What exists:**
- Files `elasticity_model.py`, `prediction_model.py`, and `confidence_scorer.py` exist in `backend/app/analytics/`
- These modules implement log-log regression (scipy), confidence scoring, and prediction models

**What's missing:**
- These modules are NOT called by any API endpoint
- Elasticities are currently pre-computed during mock data seeding, not calculated on demand
- The simulator uses simplified calculations instead of the full prediction model
- Confidence levels are assigned statically in seed data, not computed by `confidence_scorer.py`

**Impact:** The system displays plausible data but does not perform real-time analytics. This is acceptable for a demo/prototype but would need to be connected before working with real data.

**Affected modules:** History, Simulator, Recommendations, Confidence badges

---

### GAP-02: PDF and Excel Export Missing

**Design reference:** Phase E (Opportunities), WP-12 — "Exportación (PDF/Excel)"
Phase D (Technology Architecture) — lists `xlsx + jspdf` in frontend stack

**What exists:**
- CSV export of recommendations (`GET /api/export/recommendations-csv`)
- Executive summary as JSON (`GET /api/export/executive-summary`)

**What's missing:**
- PDF executive report generation (design specified `jspdf` on frontend)
- Excel detailed export (design specified `xlsx` library)

**Impact:** Users can export data as CSV but cannot generate formatted reports for presentations or executive review.

**Affected modules:** Recommendations, Export

---

### GAP-03: No Authentication

**Design reference:** Phase D (Technology Architecture), Section 4 — "Basic auth o API key simple" for MVP

**What exists:**
- All endpoints are publicly accessible
- CORS is configured to allow only the frontend domain

**What's missing:**
- No login screen (design shows a simplified login step in the user journey)
- No API key or basic auth protection
- No role-based access (not expected for MVP, but basic auth was)

**Impact:** Anyone with the URL can access the application and all data. Acceptable for internal demo but a blocker for sharing with broader stakeholders.

---

### GAP-04: No Alembic Migrations

**Design reference:** Phase C (Information Systems Architecture), Section 2.1 — `migrations/` directory with Alembic
Phase D (Technology Architecture) — lists Alembic 1.x in backend stack

**What exists:**
- Database tables are auto-created on application startup via SQLAlchemy `create_all()`
- Schema changes require dropping and recreating tables

**What's missing:**
- No Alembic migration history
- No ability to evolve the schema incrementally without data loss

**Impact:** Low for MVP with mock data. Would become critical when working with real data that must be preserved across schema changes.

---

### GAP-05: No CI/CD Pipeline

**Design reference:** Phase 00 (Preliminary) — mentions GitHub as version control
Phase E (Opportunities), WP-01 — "Setup del proyecto (monorepo, Docker, CI)"

**What exists:**
- GitHub repository
- Docker setup for local development and Railway deployment
- Railway auto-deploys from the repository

**What's missing:**
- No GitHub Actions workflow for automated testing on PR
- No automated linting or type checking in CI
- No deployment gates (tests must pass before deploy)

**Impact:** Tests exist but are not enforced automatically. A broken commit could reach production without being caught.

---

## 4. Stack Deviations (Non-Critical)

These are intentional adaptations from the original design that are NOT gaps — they are reasonable decisions made during implementation.

| Design Specified | Actually Used | Reason |
|-----------------|---------------|--------|
| Vercel (frontend hosting) | Railway | Unified platform for frontend + backend + DB |
| shadcn/ui (component library) | Tailwind CSS direct | Simpler, fewer dependencies for MVP |
| Next.js 14+ | Next.js 16 | Newer version available at build time |
| React 18+ | React 19 | Newer version available at build time |
| Tailwind CSS 3.x | Tailwind CSS 4 | Newer version available at build time |
| TanStack Table | Custom tables | Simpler implementation for current needs |
| React Hook Form | Native forms | Fewer form scenarios than anticipated |
| Alembic migrations | Auto-create tables | Faster iteration with mock data |

---

## 5. Gap Priority Matrix

| Gap | Severity | Effort | Priority | When to Address |
|-----|----------|--------|----------|-----------------|
| GAP-01: Analytics engine | Medium | High | P2 | Before real data integration |
| GAP-02: PDF/Excel export | Low | Medium | P3 | Before stakeholder demos |
| GAP-03: Authentication | Medium | Low | P1 | Before sharing with broader audience |
| GAP-04: Alembic migrations | Low | Medium | P2 | Before real data integration |
| GAP-05: CI/CD pipeline | Low | Low | P3 | Before team collaboration scales |
