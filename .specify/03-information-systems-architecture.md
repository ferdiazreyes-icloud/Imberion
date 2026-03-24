# Fase C — Arquitectura de Sistemas de Información

## USG Pricing Decision Engine (MVP)

---

## Parte 1: Arquitectura de Datos

### 1.1 Modelo Entidad-Relación (ERD)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    territories   │     │    customers     │     │   categories     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id         (PK) │     │ id         (PK) │     │ id         (PK) │
│ region           │     │ name             │     │ name             │
│ state            │     │ type             │     │ parent_id  (FK) │
│ municipality     │     │ segment          │     └────────┬────────┘
└────────┬────────┘     │ territory_id(FK) │              │
         │              └────────┬────────┘              │
         │                       │                        │
         │              ┌────────┴────────┐     ┌────────┴────────┐
         │              │    branches      │     │    products      │
         │              ├─────────────────┤     ├─────────────────┤
         │              │ id         (PK) │     │ id         (PK) │
         │              │ customer_id(FK) │     │ sku_code         │
         │              │ name             │     │ name             │
         │              │ address          │     │ category_id(FK) │
         │              │ municipality     │     │ subcategory      │
         │              │ state            │     │ attributes (JSON)│
         │              └────────┬────────┘     └────────┬────────┘
         │                       │                        │
         │              ┌────────┴────────────────────────┴────────┐
         │              │            transactions                    │
         │              ├───────────────────────────────────────────┤
         └──────────────│ id                  (PK)                  │
                        │ date                                      │
                        │ customer_id         (FK)                  │
                        │ branch_id           (FK)                  │
                        │ product_id          (FK)                  │
                        │ territory_id        (FK)                  │
                        │ volume                                    │
                        │ list_price                                │
                        │ discount                                  │
                        │ rebate                                    │
                        │ net_price                                 │
                        │ revenue                                   │
                        └───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│            elasticities                    │
├───────────────────────────────────────────┤
│ id                  (PK)                  │
│ type                (historical/predicted)│
│ coefficient                               │
│ confidence_level    (high/medium/low)     │
│ p_value                                   │
│ r_squared                                 │
│ node_type           (segment/territory/   │
│                      category/sku)        │
│ node_id                                   │
│ period_start                              │
│ period_end                                │
│ sample_size                               │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│            scenarios                       │
├───────────────────────────────────────────┤
│ id                  (PK)                  │
│ name                                      │
│ description                               │
│ is_base             (boolean)             │
│ created_at                                │
│ assumptions         (JSON)                │
└──────────────────────┬────────────────────┘
                       │
              ┌────────┴────────────────────────────────┐
              │       scenario_results                    │
              ├─────────────────────────────────────────┤
              │ id                  (PK)                  │
              │ scenario_id         (FK)                  │
              │ product_id          (FK)                  │
              │ segment                                   │
              │ territory_id        (FK)                  │
              │ price_change_pct                          │
              │ expected_volume                           │
              │ expected_revenue                          │
              │ expected_margin                           │
              │ confidence_level                          │
              └─────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│          recommendations                   │
├───────────────────────────────────────────┤
│ id                  (PK)                  │
│ product_id          (FK)                  │
│ segment                                   │
│ territory_id        (FK)                  │
│ action_type         (increase/protect/    │
│                      decrease)            │
│ suggested_change_pct                      │
│ expected_impact_revenue                   │
│ expected_impact_volume                    │
│ expected_impact_margin                    │
│ confidence_level                          │
│ rationale           (JSON)                │
│ created_at                                │
└───────────────────────────────────────────┘
```

### 1.2 Índices Clave

```sql
-- Transacciones: consultas frecuentes por fecha, cliente, producto, territorio
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_product ON transactions(product_id);
CREATE INDEX idx_transactions_territory ON transactions(territory_id);
CREATE INDEX idx_transactions_composite ON transactions(date, customer_id, product_id);

-- Elasticidades: consultas por nodo y tipo
CREATE INDEX idx_elasticities_node ON elasticities(node_type, node_id);
CREATE INDEX idx_elasticities_type ON elasticities(type);

-- Recomendaciones: consultas por segmento y territorio
CREATE INDEX idx_recommendations_segment ON recommendations(segment);
CREATE INDEX idx_recommendations_territory ON recommendations(territory_id);
```

---

## Parte 2: Arquitectura de Aplicación

### 2.1 Estructura del Proyecto

```
Imberion/
├── frontend/                    # Next.js App
│   ├── src/
│   │   ├── app/                 # App Router (Next.js 14+)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Overview / Dashboard
│   │   │   ├── history/
│   │   │   │   └── page.tsx     # Módulo 1: Elasticidades históricas
│   │   │   ├── simulator/
│   │   │   │   └── page.tsx     # Módulo 2: Simulador de escenarios
│   │   │   ├── recommendations/
│   │   │   │   └── page.tsx     # Módulo 3: Recomendaciones
│   │   │   ├── passthrough/
│   │   │   │   └── page.tsx     # Módulo 4: Rebates y passthrough
│   │   │   └── agent/
│   │   │       └── page.tsx     # Módulo 5: Agente AI conversacional
│   │   ├── components/
│   │   │   ├── ui/              # Componentes base (shadcn/ui)
│   │   │   ├── charts/          # Componentes de gráficos
│   │   │   ├── chat/            # Agente AI: ChatPanel, ChatBubble, ChatInput, ChatToggle
│   │   │   ├── filters/         # Panel de filtros global
│   │   │   ├── tables/          # Tablas de datos
│   │   │   └── export/          # Componentes de exportación
│   │   ├── lib/
│   │   │   ├── api.ts           # Cliente API (fetch wrapper)
│   │   │   ├── types.ts         # TypeScript types
│   │   │   └── utils.ts         # Utilidades
│   │   └── hooks/
│   │       ├── useFilters.ts    # Hook de filtros globales
│   │       ├── useChatStore.ts  # Zustand store para chat AI (messages, SSE streaming)
│   │       ├── usePageContext.ts # Contexto de página para el agente (pathname + filtros)
│   │       └── useScenario.ts   # Hook de simulación
│   ├── package.json
│   └── next.config.js
│
├── backend/                     # FastAPI App
│   ├── app/
│   │   ├── main.py              # Entry point FastAPI
│   │   ├── config.py            # Configuración
│   │   ├── database.py          # Conexión PostgreSQL
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── customer.py
│   │   │   ├── product.py
│   │   │   ├── transaction.py
│   │   │   ├── territory.py
│   │   │   ├── elasticity.py
│   │   │   ├── scenario.py
│   │   │   └── recommendation.py
│   │   ├── schemas/             # Pydantic schemas (request/response)
│   │   │   ├── customer.py
│   │   │   ├── product.py
│   │   │   ├── analytics.py
│   │   │   └── scenario.py
│   │   ├── api/                 # API routes
│   │   │   ├── overview.py      # GET /api/overview
│   │   │   ├── history.py       # GET /api/history/elasticities
│   │   │   ├── simulator.py     # POST /api/simulator/scenarios
│   │   │   ├── recommendations.py
│   │   │   ├── passthrough.py
│   │   │   ├── export.py        # GET /api/export/report
│   │   │   └── agent.py         # POST /api/agent/chat (SSE streaming)
│   │   ├── services/            # Business logic
│   │   │   ├── elasticity.py    # Cálculo de elasticidades
│   │   │   ├── simulator.py     # Motor de simulación
│   │   │   ├── recommendation.py# Motor de recomendaciones
│   │   │   └── confidence.py    # Cálculo de confianza
│   │   ├── analytics/           # Motor analítico
│   │   │   ├── elasticity_model.py
│   │   │   ├── prediction_model.py
│   │   │   └── confidence_scorer.py
│   │   └── agent/               # Agente AI conversacional
│   │       ├── tools.py         # 7 herramientas (reutilizan queries existentes)
│   │       ├── graph.py         # LangGraph: 4 nodos multi-modelo
│   │       ├── prompts.py       # System prompts (orquestador, analista, sintetizador)
│   │       └── state.py         # TypedDict del estado del grafo
│   ├── migrations/              # Alembic migrations
│   ├── seeds/                   # Datos mock
│   │   └── generate_mock_data.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                        # Documentación TOGAF
│   └── architecture/
│
└── docker-compose.yml           # Orquestación local
```

### 2.2 API Contracts (Endpoints Principales)

| Método | Endpoint | Descripción | Filtros |
|--------|----------|-------------|---------|
| GET | `/api/overview` | KPIs del dashboard | period, segment, territory, category |
| GET | `/api/overview/kpis` | KPIs agregados | period, segment, territory |
| GET | `/api/history/elasticities` | Elasticidades históricas | segment, territory, category, sku |
| GET | `/api/history/trends` | Tendencias precio-volumen | period, segment, territory, sku |
| GET | `/api/simulator/scenarios` | Listar escenarios | - |
| POST | `/api/simulator/scenarios` | Crear escenario | - |
| POST | `/api/simulator/calculate` | Calcular impacto | scenario_id |
| GET | `/api/recommendations` | Recomendaciones | segment, territory, category, confidence |
| GET | `/api/passthrough/rebates` | Análisis de rebates | segment, territory, sku |
| GET | `/api/export/report` | Generar informe PDF/Excel | filters |
| POST | `/api/agent/chat` | Chat conversacional con agente AI (SSE streaming) | messages, context |

### 2.3 Componentes Frontend Clave

| Componente | Descripción | Usado en |
|------------|-------------|----------|
| `GlobalFilters` | Panel lateral de filtros (canal, territorio, segmento, categoría, SKU) | Todas las vistas |
| `KPICard` | Tarjeta de métrica con tendencia | Overview |
| `ElasticityChart` | Gráfico de elasticidad precio-volumen | History, Simulator |
| `PriceVolumeMarginCurve` | Curva tridimensional de escenarios | Simulator |
| `RecommendationCard` | Tarjeta con acción, impacto y confianza | Recommendations |
| `ConfidenceBadge` | Indicador visual de confianza (alto/medio/bajo) | Todos |
| `DrillDownTable` | Tabla con expansión jerárquica | Todos |
| `ScenarioComparator` | Vista side-by-side de escenarios | Simulator |
| `ExportButton` | Botón de exportación (PDF/Excel) | Recommendations |
| `ChatPanel` | Panel lateral colapsable (w-96) con historial de chat y input | Todas (layout) |
| `ChatToggle` | Botón flotante bottom-right para abrir/cerrar el chat | Todas (layout) |
| `ChatBubble` | Burbuja de mensaje con markdown rendering (user vs assistant) | ChatPanel, Agent |
| `ChatInput` | Textarea con auto-resize y envío con Enter | ChatPanel, Agent |

### 2.4 Agente AI Conversacional

Arquitectura multi-modelo con LangGraph: 4 nodos (Orchestrator, Tool Executor, Deep Analyst, Synthesizer), 7 herramientas read-only, SSE streaming, y contexto de página.

**Ver [08-ai-agent-architecture.md](08-ai-agent-architecture.md) para la especificación completa:** diagrama de flujo, definición de cada tool con input/output, system prompts, contrato SSE, componentes frontend, y restricciones de seguridad.
