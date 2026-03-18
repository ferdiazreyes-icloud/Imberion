# USG Pricing Decision Engine (MVP)

Motor de Decisión de Precios B2B para canales de distribución nacional en México.

Plataforma de inteligencia de precios que combina análisis de elasticidades históricas, simulación predictiva de escenarios y recomendaciones accionables por segmento, territorio y SKU.

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Overview  │ │ History  │ │Simulator │ │   Recs    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  ┌───────────────┐ ┌──────────────┐ ┌───────────────┐  │
│  │  Passthrough   │ │Global Filters│ │    Export     │  │
│  └───────────────┘ └──────────────┘ └───────────────┘  │
├─────────────────────────────────────────────────────────┤
│                   REST API (FastAPI)                     │
│  /api/overview · /api/history · /api/simulator           │
│  /api/recommendations · /api/passthrough · /api/export   │
├─────────────────────────────────────────────────────────┤
│                  Analytics Engine                        │
│  Elasticity Model · Confidence Scorer · Prediction Model │
├─────────────────────────────────────────────────────────┤
│                 PostgreSQL 16 + SQLAlchemy                │
│  territories · customers · branches · categories         │
│  products · transactions · elasticities                  │
│  scenarios · scenario_results · recommendations          │
└─────────────────────────────────────────────────────────┘
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Estilos | Tailwind CSS 4 |
| Gráficos | Recharts 3 |
| Estado global | Zustand 5 |
| Data fetching | TanStack Query 5 |
| Backend | FastAPI, Python 3.12 |
| ORM | SQLAlchemy 2 |
| Validación | Pydantic 2 |
| Analytics | pandas, scipy, statsmodels, scikit-learn |
| Base de datos | PostgreSQL 16 |
| Contenedores | Docker + docker-compose |

## Módulos

### Overview (`/`)
Dashboard ejecutivo con 6 KPIs principales (ingreso, volumen, precio neto promedio, elasticidad promedio, cobertura modelada, rebate promedio) y drill-down por categoría, segmento y territorio.

### History (`/history`)
Lectura backward-looking: tendencias de precio neto y volumen, scatter precio-volumen para visualizar elasticidad, tabla de elasticidades históricas con coeficientes, R², p-value y nivel de confianza.

### Simulator (`/simulator`)
Modelado de escenarios predictivos. Slider interactivo de cambio de precio (-20% a +20%), curva precio-volumen-margen, creación y comparación de escenarios guardados. Usa el coeficiente de elasticidad para calcular: `%ΔQ = ε × %ΔP`.

### Recommendations (`/recommendations`)
Recomendaciones accionables por producto/segmento/territorio. Tres tipos de acción: **increase** (subir precio), **protect** (mantener), **decrease** (bajar). Exportación a CSV e informe ejecutivo JSON.

### Passthrough (`/passthrough`)
Análisis de la cadena precio lista → descuento → rebate → precio neto. Descomposición por segmento, rebate como % del precio lista por categoría, y evolución temporal de componentes de precio.

## Modelo de Datos

| Entidad | Descripción | Registros mock |
|---------|------------|----------------|
| Territories | Regiones geográficas (Norte, Centro, Bajío, Sur, Occidente) | 10 |
| Customers | Distribuidores con segmento (oro/plata/bronce) | 25 |
| Categories | Categorías de producto (Tableros, Plafones, etc.) | 10 |
| Products | SKUs individuales | 86 |
| Transactions | Sell-in mensual (24 meses: ene 2024 – dic 2025) | ~30,000+ |
| Elasticities | Coeficientes por nodo (categoría, SKU, segmento, territorio) | ~200+ |
| Recommendations | Acciones sugeridas por producto/segmento | ~258 |

## Conceptos Clave

- **Elasticidad**: Sensibilidad del volumen al cambio de precio. Calculada via regresión log-log: `ln(Q) = α + ε × ln(P)`
- **Confianza**: Nivel (high/medium/low) basado en p-value, R² y tamaño de muestra
- **Segmentos**: Oro (alto volumen, mayor descuento), Plata (medio), Bronce (bajo volumen)
- **Precio Neto**: `Precio Lista - Descuento - Rebate`
- **Passthrough**: Relación entre cambio en precio lista y cambio en precio neto al distribuidor

## Inicio Rápido

### Con Docker (recomendado)

```bash
# Levantar todos los servicios
docker-compose up -d

# Generar datos mock (dentro del contenedor backend)
docker-compose exec backend python seeds/generate_mock_data.py

# Acceder
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
cp .env.example .env  # Editar con tu DATABASE_URL
python seeds/generate_mock_data.py
uvicorn app.main:app --reload

# Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Requisitos previos

- Python 3.12+
- Node.js 20+
- PostgreSQL 16 (o Docker)

## Estructura del Proyecto

```
├── backend/
│   ├── app/
│   │   ├── analytics/         # Motor de elasticidades y predicción
│   │   │   ├── elasticity_model.py
│   │   │   ├── confidence_scorer.py
│   │   │   └── prediction_model.py
│   │   ├── api/               # Endpoints FastAPI
│   │   │   ├── overview.py
│   │   │   ├── history.py
│   │   │   ├── simulator.py
│   │   │   ├── recommendations.py
│   │   │   ├── passthrough.py
│   │   │   └── export.py
│   │   ├── models/            # SQLAlchemy models (9)
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── seeds/
│   │   └── generate_mock_data.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router pages
│   │   │   ├── page.tsx           # Overview
│   │   │   ├── history/
│   │   │   ├── simulator/
│   │   │   ├── recommendations/
│   │   │   └── passthrough/
│   │   ├── components/
│   │   │   ├── ui/            # Card, Badge, Select
│   │   │   ├── charts/        # KPICard
│   │   │   ├── filters/       # GlobalFilters
│   │   │   └── layout/        # Sidebar
│   │   ├── hooks/             # useFilters (Zustand)
│   │   └── lib/               # api.ts, utils.ts, types.ts
│   ├── Dockerfile
│   └── package.json
├── docs/
│   └── architecture/          # Documentación TOGAF (fases 00-05)
└── docker-compose.yml
```

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/overview` | KPIs agregados con filtros |
| GET | `/api/overview/by-category` | Drill-down por categoría |
| GET | `/api/overview/by-segment` | Drill-down por segmento |
| GET | `/api/overview/by-territory` | Drill-down por territorio |
| GET | `/api/history/elasticities` | Elasticidades con filtros |
| GET | `/api/history/trends` | Tendencias precio-volumen |
| GET | `/api/history/price-volume` | Scatter para elasticidad visual |
| GET | `/api/simulator/scenarios` | Listar escenarios |
| POST | `/api/simulator/scenarios` | Crear escenario con simulación |
| GET | `/api/simulator/scenarios/{id}/results` | Resultados de escenario |
| POST | `/api/simulator/quick-simulate` | Simulación rápida (curva) |
| GET | `/api/recommendations` | Recomendaciones con filtros |
| GET | `/api/recommendations/summary` | Resumen agregado |
| GET | `/api/passthrough/by-segment` | Passthrough por segmento |
| GET | `/api/passthrough/by-category` | Passthrough por categoría |
| GET | `/api/passthrough/trends` | Tendencias de componentes |
| GET | `/api/export/recommendations-csv` | Exportar CSV |
| GET | `/api/export/executive-summary` | Informe ejecutivo JSON |
| GET | `/api/filters/*` | Opciones de filtro (segments, categories, territories, customers, regions) |

### Filtros Globales

Todos los endpoints aceptan query params opcionales:

| Parámetro | Tipo | Ejemplo |
|-----------|------|---------|
| `segment` | string | `oro`, `plata`, `bronce` |
| `territory_id` | int | `1` |
| `region` | string | `Norte`, `Centro` |
| `category_id` | int | `1` |
| `product_id` | int | `15` |
| `period_start` | date | `2024-01-01` |
| `period_end` | date | `2025-12-31` |
| `confidence_level` | string | `high`, `medium`, `low` |

## Documentación de Arquitectura

La carpeta `docs/architecture/` contiene la documentación TOGAF completa:

| Archivo | Fase TOGAF |
|---------|-----------|
| `00-preliminary-phase.md` | Fase Preliminar: contexto, principios, stakeholders |
| `01-architecture-vision.md` | Fase A: visión, requerimientos, alcance |
| `02-business-architecture.md` | Fase B: procesos de negocio, casos de uso |
| `03-information-systems-architecture.md` | Fase C: datos, aplicaciones, integraciones |
| `04-technology-architecture.md` | Fase D: infraestructura, stack, seguridad |
| `05-opportunities-and-migration.md` | Fase E: roadmap, work packages, migración |
