# USG Pricing Decision Engine (MVP)

Motor de Decisión de Precios B2B para canales de distribución nacional en México.

## Estado Actual

- [x] Backend (FastAPI) — 24 endpoints, 31 unit tests passing
- [x] Frontend (Next.js) — 5 módulos con datos en vivo
- [x] Motor de elasticidades (log-log regression con scipy)
- [x] Generador de datos mock (86 SKUs, 75 distribuidores reales, 29 territorios, 24 meses)
- [x] Docker setup para desarrollo local
- [x] Deploy en producción (Railway)
- [x] E2E tests con Playwright
- [x] Integración del módulo analytics avanzado (predict_scenario + confidence_scorer) con API
- [x] Visual refinement v2 — USG brand colors, Inter font, Tableau charts, dark mode, animations
- [x] Simulador potenciado — drill-down, comparación multi-escenario, mejor escenario por objetivo
- [x] Filtros ComboBox multi-select con búsqueda — segmento, territorio, categoría y distribuidor
- [x] Selector de distribuidor — 75 distribuidores reales filtrados por territorio (via sucursales) y segmento
- [x] Confianza movida a módulo Historial exclusivamente
- [x] Export CSV de escenarios en simulador
- [x] Soporte multi-filtro — todos los filtros aceptan selección múltiple con valores separados por coma

## URLs de Producción

| Servicio | URL |
|----------|-----|
| Frontend | https://usg-frontend-production.up.railway.app |
| Backend API | https://usg-backend-production.up.railway.app |
| API Docs (Swagger) | https://usg-backend-production.up.railway.app/docs |

## Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Overview | `/` | Dashboard con 6 KPIs y drill-down por categoría, segmento y territorio |
| Historial | `/history` | Elasticidades históricas, tendencias precio-volumen, scatter plot, filtro de confianza |
| Simulador | `/simulator` | Simulador de escenarios con drill-down, comparación multi-escenario, mejor escenario, export CSV |
| Recomendaciones | `/recommendations` | Recomendaciones por segmento/territorio/SKU con export CSV |
| Passthrough | `/passthrough` | Análisis de rebates, descuentos y precio neto |

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts 3, Zustand, TanStack Query |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, scipy |
| Database | PostgreSQL 16 |
| Deploy | Railway (Docker) |
| Tests | pytest (backend), Playwright (e2e) |

## Desarrollo Local

### Con Docker

```bash
docker-compose up -d
# Seed mock data:
curl -X POST http://localhost:8000/api/admin/seed
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Sin Docker

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # editar DATABASE_URL
python seeds/generate_mock_data.py
uvicorn app.main:app --reload

# Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Tests

### Backend (unit tests) — 31/31

```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
```

### E2E (Playwright) — 28/28

```bash
cd e2e
npm install
npx playwright install chromium
# Against production:
npx playwright test
# Against local:
BASE_URL=http://localhost:3000 npx playwright test
```

#### Cobertura E2E

| Suite | Tests | Qué verifica |
|-------|-------|-------------|
| Overview | 4 | KPIs cargan, gráficas renderizan, filtros presentes, filtro de segmento funciona |
| Historial | 5 | Tendencias precio-volumen, scatter plot, tabla de elasticidades, selector de nivel de análisis |
| Simulador | 6+ | Tabs (Simular/Comparar/Mejor), curva precio-volumen-margen, slider de precio, drill-down por nivel, comparación multi-escenario, mejor escenario por objetivo |
| Recomendaciones | 5 | Tabla con datos, métricas agregadas, badges de acción/confianza, botones de export |
| Passthrough | 5 | Descomposición por segmento, rebate por categoría, evolución de componentes de precio |
| Navegación | 3 | Sidebar con todos los links, navegación entre páginas, health check del API |

## Deploy en Railway

### Backend

1. Crear servicio → repo `ferdiazreyes-icloud/Imberion`, root directory `/backend`
2. Agregar PostgreSQL addon
3. Variables de entorno:
   - `DATABASE_URL` → `${{Postgres.DATABASE_URL}}` (referencia al addon)
   - `CORS_ORIGINS` → `["https://usg-frontend-production.up.railway.app"]`
   - `DEBUG` → `false`
4. Generar dominio público en Settings > Networking
5. Seed data: `curl -X POST https://usg-backend-production.up.railway.app/api/admin/seed`

### Frontend

1. Crear servicio → mismo repo, root directory `/frontend`
2. Variables de entorno:
   - `NEXT_PUBLIC_API_URL` → `https://usg-backend-production.up.railway.app`
3. Generar dominio público en Settings > Networking

**Nota:** `NEXT_PUBLIC_API_URL` es una variable de build-time. El Dockerfile usa `ARG` para inyectarla durante el build. Si la cambias, necesitas hacer redeploy.

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check (verifica BD) |
| GET | `/api/overview` | KPIs agregados |
| GET | `/api/overview/by-category` | Drill-down por categoría |
| GET | `/api/overview/by-segment` | Drill-down por segmento |
| GET | `/api/overview/by-territory` | Drill-down por territorio |
| GET | `/api/history/elasticities` | Elasticidades con filtros |
| GET | `/api/history/trends` | Tendencias precio-volumen |
| GET | `/api/history/price-volume` | Scatter precio vs volumen |
| GET | `/api/simulator/scenarios` | Listar escenarios guardados |
| POST | `/api/simulator/scenarios` | Crear escenario con simulación |
| GET | `/api/simulator/scenarios/{id}/results` | Resultados de un escenario |
| GET | `/api/simulator/quick-simulate` | Simulación rápida (curva) |
| GET | `/api/simulator/scenarios/{id}/summary` | Resumen agregado del escenario (totales, deltas, desglose) |
| GET | `/api/simulator/scenarios/{id}/results-grouped` | Resultados agrupados por categoría/segmento/territorio |
| GET | `/api/simulator/compare` | Comparar escenario vs base |
| GET | `/api/simulator/compare-multi` | Comparar múltiples escenarios con rankings |
| GET | `/api/simulator/best-scenario` | Mejor escenario según objetivo (margen/volumen/ingreso) |
| GET | `/api/recommendations` | Recomendaciones con filtros |
| GET | `/api/recommendations/summary` | Resumen agregado |
| GET | `/api/passthrough/by-segment` | Passthrough por segmento |
| GET | `/api/passthrough/by-category` | Passthrough por categoría |
| GET | `/api/passthrough/trends` | Tendencias de componentes |
| GET | `/api/export/recommendations-csv` | Exportar CSV |
| GET | `/api/export/scenario-csv/{id}` | Exportar resultados de escenario a CSV |
| GET | `/api/export/executive-summary` | Informe ejecutivo JSON |
| POST | `/api/admin/seed` | Poblar BD con datos mock |

### Filtros Globales

Todos los GET endpoints aceptan estos query params opcionales:

| Parámetro | Tipo | Ejemplo |
|-----------|------|---------|
| `segment` | string | `oro`, `plata`, `bronce` |
| `territory_id` | int | `1` |
| `region` | string | `Norte`, `Centro` |
| `category_id` | int | `1` |
| `product_id` | int | `15` |
| `customer_id` | int | `1` |
| `confidence_level` | string | `high`, `medium`, `low` |

## Roadmap

| # | Feature | Estado |
|---|---------|--------|
| 5 | Módulo de Rebates óptimos por distribuidor | Pendiente — validar con cliente |
| 6b | Escenarios por carga de Excel (plan de precios) | Pendiente |
| 6c | Escenarios por optimización automática (maximizar objetivo) | Pendiente |
| 7 | Agente AI conversacional para consultar datos | Pendiente |
