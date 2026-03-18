# USG Pricing Decision Engine (MVP)

Motor de Decisión de Precios B2B para canales de distribución nacional en México.

## Estado Actual

- [x] Backend (FastAPI) — 18 endpoints, 12 tests passing
- [x] Frontend (Next.js) — 5 módulos, builds OK
- [x] Motor de elasticidades (log-log regression)
- [x] Generador de datos mock (86 SKUs, 25 distribuidores, 24 meses)
- [x] Docker setup para desarrollo local
- [x] Configurado para deploy en Railway
- [ ] Deploy en producción (Railway)
- [ ] Integración del módulo analytics avanzado con endpoints

## Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Overview | `/` | Dashboard con 6 KPIs y drill-down |
| History | `/history` | Elasticidades históricas y tendencias |
| Simulator | `/simulator` | Simulador de escenarios de precio |
| Recommendations | `/recommendations` | Recomendaciones por segmento/territorio |
| Passthrough | `/passthrough` | Análisis de rebates y precio neto |

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts 3, Zustand, TanStack Query |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, scipy |
| Database | PostgreSQL 16 |
| Deploy | Railway (Docker) |

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

```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
```

## Deploy en Railway

### Backend
1. Crear nuevo servicio en Railway apuntando a este repo
2. Set root directory: `backend`
3. Railway detecta el Dockerfile automáticamente
4. Agregar PostgreSQL addon
5. Variables de entorno:
   - `DATABASE_URL` — se configura automáticamente con el addon de PostgreSQL
   - `CORS_ORIGINS` — `["https://tu-frontend.railway.app"]`
6. Después del deploy, seed data: `POST https://tu-backend.railway.app/api/admin/seed`

### Frontend
1. Crear nuevo servicio en Railway apuntando a este repo
2. Set root directory: `frontend`
3. Variables de entorno:
   - `NEXT_PUBLIC_API_URL` — URL del backend (ej: `https://tu-backend.railway.app`)

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/overview` | KPIs agregados |
| GET | `/api/overview/by-category` | Drill-down por categoría |
| GET | `/api/overview/by-segment` | Drill-down por segmento |
| GET | `/api/overview/by-territory` | Drill-down por territorio |
| GET | `/api/history/elasticities` | Elasticidades con filtros |
| GET | `/api/history/trends` | Tendencias precio-volumen |
| GET | `/api/history/price-volume` | Scatter precio vs volumen |
| GET | `/api/simulator/scenarios` | Listar escenarios |
| POST | `/api/simulator/scenarios` | Crear escenario |
| GET | `/api/simulator/scenarios/{id}/results` | Resultados |
| POST | `/api/simulator/quick-simulate` | Simulación rápida |
| GET | `/api/recommendations` | Recomendaciones |
| GET | `/api/recommendations/summary` | Resumen |
| GET | `/api/passthrough/by-segment` | Passthrough por segmento |
| GET | `/api/passthrough/by-category` | Passthrough por categoría |
| GET | `/api/passthrough/trends` | Tendencias |
| GET | `/api/export/recommendations-csv` | Exportar CSV |
| GET | `/api/export/executive-summary` | Informe ejecutivo JSON |
| POST | `/api/admin/seed` | Poblar BD con datos mock |

Todos los endpoints aceptan filtros: `segment`, `territory_id`, `region`, `category_id`, `product_id`, `confidence_level`.
